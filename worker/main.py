import os
import tempfile
from typing import List, Dict, Any

import chromadb
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
from pypdf import PdfReader

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
CHAT_MODEL = os.getenv("CHAT_MODEL", "gpt-4o-mini")
CHROMA_HOST = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8000"))

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is missing. Add it to worker/.env")

client = OpenAI(api_key=OPENAI_API_KEY)
chroma = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
collection = chroma.get_or_create_collection("documents")

app = FastAPI(title="AI Document Q&A Worker")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AskRequest(BaseModel):
    documentId: str
    question: str
    topK: int = 5

class FeedbackRequest(BaseModel):
    documentId: str
    question: str
    answer: str
    rating: str

feedback_log: List[Dict[str, Any]] = []

def extract_text(file_path: str, filename: str) -> List[Dict[str, Any]]:
    if filename.lower().endswith(".pdf"):
        reader = PdfReader(file_path)
        pages = []
        for index, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            if text.strip():
                pages.append({"page": index, "text": text})
        return pages

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return [{"page": 1, "text": f.read()}]

def chunk_text(text: str, page: int, chunk_size: int = 900, overlap: int = 150) -> List[Dict[str, Any]]:
    clean = " ".join(text.split())
    chunks = []
    start = 0
    while start < len(clean):
        end = start + chunk_size
        content = clean[start:end]
        if len(content.strip()) > 80:
            chunks.append({"text": content, "page": page})
        start += chunk_size - overlap
    return chunks

def embed_texts(texts: List[str]) -> List[List[float]]:
    response = client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [item.embedding for item in response.data]

def cosine_similarity(a: List[float], b: List[float]) -> float:
    av = np.array(a)
    bv = np.array(b)
    denominator = np.linalg.norm(av) * np.linalg.norm(bv)
    if denominator == 0:
        return 0.0
    return float(np.dot(av, bv) / denominator)

def confidence_label(similarities: List[float]) -> str:
    if not similarities:
        return "low"
    best = max(similarities)
    if best >= 0.35:
        return "high"
    if best >= 0.25:
        return "medium"
    return "low"

@app.post("/ingest")
async def ingest(file: UploadFile = File(...)):
    if not (file.filename.lower().endswith(".pdf") or file.filename.lower().endswith(".txt")):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported in this MVP.")

    document_id = f"doc_{abs(hash(file.filename + str(os.urandom(8))))}"

    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    pages = extract_text(tmp_path, file.filename)
    all_chunks = []
    for page in pages:
        all_chunks.extend(chunk_text(page["text"], page["page"]))

    if not all_chunks:
        raise HTTPException(status_code=400, detail="No readable text found in document.")

    texts = [chunk["text"] for chunk in all_chunks]
    embeddings = embed_texts(texts)
    ids = [f"{document_id}_chunk_{i}" for i in range(len(all_chunks))]
    metadatas = [
        {"documentId": document_id, "filename": file.filename, "page": chunk["page"], "chunkIndex": i}
        for i, chunk in enumerate(all_chunks)
    ]

    collection.add(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)

    return {"documentId": document_id, "filename": file.filename, "chunks": len(all_chunks)}

@app.post("/ask")
def ask(request: AskRequest):
    query_embedding = embed_texts([request.question])[0]
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=request.topK,
        where={"documentId": request.documentId},
        include=["documents", "metadatas", "embeddings"]
    )

    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    embeddings = results.get("embeddings", [[]])[0]

    if not docs:
        return {
            "answer": "I could not find enough relevant information in the document to answer that.",
            "confidence": "low",
            "sources": []
        }

    sims = [cosine_similarity(query_embedding, emb) for emb in embeddings]
    confidence = confidence_label(sims)

    context_blocks = []
    sources = []
    for i, doc in enumerate(docs):
        meta = metas[i]
        source_label = f"Source {i + 1}, page {meta.get('page')}"
        context_blocks.append(f"[{source_label}] {doc}")
        sources.append({
            "label": source_label,
            "page": meta.get("page"),
            "chunkIndex": meta.get("chunkIndex"),
            "text": doc,
            "similarity": round(sims[i], 3)
        })

    system_prompt = """
You are a careful document Q&A assistant.
Answer only using the provided document context.
If the answer is not supported by the context, say the document does not contain enough information.
Include short citations like [Source 1] or [Source 2] in the answer.
Do not invent facts.
"""

    user_prompt = f"""
Question: {request.question}

Document context:
{chr(10).join(context_blocks)}
"""

    completion = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.2
    )

    return {
        "answer": completion.choices[0].message.content,
        "confidence": confidence,
        "sources": sources
    }

@app.post("/feedback")
def feedback(request: FeedbackRequest):
    feedback_log.append(request.model_dump())
    return {"status": "logged", "count": len(feedback_log)}
