# AI Document Q&A Assistant

A portfolio-ready RAG web app: upload a PDF or text file, ask questions, receive grounded answers with citations, confidence indicators, retrieved-source transparency, feedback logging, and streaming responses.

## Why this project is strong

This demonstrates practical AI engineering instead of just API usage:

- Document ingestion pipeline
- PDF/text parsing
- Chunking strategy
- Embeddings
- Vector search with Chroma
- Grounded answer generation
- Citations back to retrieved chunks
- Confidence indicator to reduce hallucination risk
- Source transparency toggle
- Feedback logging
- Streaming chat UX
- ASP.NET Core Web API + React TypeScript architecture
- Python worker for document processing
- GitHub Actions CI scaffold

## Architecture

```text
React + TypeScript UI
        |
        | REST + streaming fetch
        v
ASP.NET Core Web API
        |
        | calls Python worker endpoints
        v
Python FastAPI worker
        |
        | parse -> chunk -> embed -> store/retrieve
        v
Chroma vector store
```

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: ASP.NET Core Web API
- Worker: Python FastAPI
- Vector DB: Chroma
- AI: OpenAI embeddings + chat model
- CI: GitHub Actions

OpenAI’s API platform supports building applications with model APIs, and the project uses embeddings for retrieval plus a chat model for grounded generation. Keep your API key server-side only.

## Local Setup

### 1. Start Chroma

```bash
docker compose up -d
```

### 2. Start Python worker

```bash
cd worker
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add OPENAI_API_KEY
uvicorn main:app --reload --port 8001
```

### 3. Start ASP.NET Core API

```bash
cd backend/AiDocQa.Api
dotnet restore
dotnet run
```

### 4. Start React frontend

```bash
cd frontend
npm install
npm run dev
```

## Demo Flow

1. Upload a PDF or .txt file.
2. Ask: “What is this document about?”
3. Ask a specific question.
4. Turn on “Show Sources.”
5. Show citations and confidence.
6. Give thumbs up/down feedback.
