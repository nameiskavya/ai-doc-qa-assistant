import { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { FileSearch } from "lucide-react";
import { AppShell } from "./components/AppShell";
import { DocumentSidebar, type DocEntry } from "./components/DocumentSidebar";
import { ChatToolbar } from "./components/ChatToolbar";
import { ChatMessage, type Message } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import "./styles.css";

const API_BASE = "http://localhost:5000/api/documents";

// Stable session ID for the audit footer
const SESSION_ID = `DIS-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;

function App() {
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showSources, setShowSources] = useState(true);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingAnswer]);

  const activeDoc = docs.find((d) => d.documentId === activeDocumentId);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: form,
      });
      const data = await response.json();

      const newDoc: DocEntry = {
        documentId: data.documentId,
        filename: data.filename ?? file.name,
        chunks: data.chunks ?? 0,
        uploadedAt: new Date(),
      };

      setDocs((prev) => [newDoc, ...prev]);
      setActiveDocumentId(data.documentId);
      setMessages([
        {
          role: "system",
          content: `Document uploaded successfully — ${data.chunks} searchable chunks created. Ask me anything about it.`,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  async function askQuestion() {
    if (!question.trim() || !activeDocumentId) return;
    const currentQuestion = question.trim();
    setQuestion("");

    setMessages((prev) => [
      ...prev,
      { role: "user", content: currentQuestion, timestamp: new Date() },
    ]);
    setLoadingAnswer(true);

    try {
      const response = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: activeDocumentId,
          question: currentQuestion,
          topK: 5,
        }),
      });

      const raw = await response.text();
      console.log("ASK RAW RESPONSE:", raw);
      const data = raw ? JSON.parse(raw) : {};

      const aiAnswer =
        data.answer ??
        data.response ??
        data.message ??
        data.content ??
        data.result ??
        "No answer returned from backend.";

      // Streaming word-by-word animation
      const words = String(aiAnswer).split(" ");
      let streamed = "";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          confidence: data.confidence ?? "low",
          sources: data.sources ?? data.sourceChunks ?? [],
          question: currentQuestion,
          timestamp: new Date(),
        },
      ]);

      for (const word of words) {
        streamed += `${word} `;
        await new Promise((resolve) => setTimeout(resolve, 18));
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: streamed.trim(),
          };
          return next;
        });
      }
    } catch (err) {
      console.error("Ask failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Something went wrong contacting the backend. Please try again.",
          confidence: "low",
          sources: [],
          question: currentQuestion,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoadingAnswer(false);
    }
  }

  async function sendFeedback(message: Message, rating: "up" | "down") {
    if (!message.question) return;
    setFeedbackCount((c) => c + 1);
    try {
      await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: activeDocumentId,
          question: message.question,
          answer: message.content,
          rating,
        }),
      });
    } catch (err) {
      console.error("Feedback failed:", err);
    }
  }

  return (
    <AppShell>
      <DocumentSidebar
        docs={docs}
        activeDocumentId={activeDocumentId}
        uploading={uploading}
        sessionStats={{
          queries: messages.filter((m) => m.role === "user").length,
          feedback: feedbackCount,
        }}
        onSelectDoc={(id) => setActiveDocumentId(id)}
        onUpload={uploadFile}
      />

      <div className="chat-main">
        <ChatToolbar
          filename={activeDoc?.filename ?? ""}
          chunks={activeDoc?.chunks ?? 0}
          showSources={showSources}
          onToggleSources={setShowSources}
        />

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <FileSearch size={40} />
              <p>
                Upload a document from the sidebar to begin your query session.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                showSources={showSources}
                onFeedback={(rating) => sendFeedback(msg, rating)}
              />
            ))
          )}

          {loadingAnswer && (
            <div className="thinking">
              Grounding answer in retrieved chunks
              <span className="thinking-dots">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          value={question}
          disabled={!activeDocumentId}
          loading={loadingAnswer}
          sessionId={SESSION_ID}
          onChange={setQuestion}
          onSubmit={askQuestion}
        />
      </div>
    </AppShell>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
