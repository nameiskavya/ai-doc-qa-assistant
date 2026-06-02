import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { ConfidenceBar } from "./ConfidenceBar";
import { SourcesPanel, type Source } from "./SourcesPanel";

export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  confidence?: "high" | "medium" | "low";
  sources?: Source[];
  question?: string;
  timestamp?: Date;
  topSimilarity?: number;
};

type Props = {
  message: Message;
  showSources: boolean;
  onFeedback: (rating: "up" | "down") => void;
};

export function ChatMessage({ message, showSources, onFeedback }: Props) {
  const [voted, setVoted] = useState<"up" | "down" | null>(null);

  function handleVote(rating: "up" | "down") {
    if (voted) return;
    setVoted(rating);
    onFeedback(rating);
  }

  function formatTime(date?: Date) {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  /* System message (upload confirmation) */
  if (message.role === "system") {
    return <div className="sys-msg">✓ {message.content}</div>;
  }

  /* User bubble */
  if (message.role === "user") {
    return (
      <div className="msg-user">
        <div className="user-bubble">{message.content}</div>
        <div className="msg-time">{formatTime(message.timestamp)}</div>
      </div>
    );
  }

  /* AI bubble */
  return (
    <div className="msg-ai">
      <div className="ai-meta">
        <div className="ai-avatar">DI</div>
        <span className="ai-tag">DIS · Document Intelligence</span>
      </div>

      <div className="ai-bubble">
        {message.content}

        {message.confidence && (
          <ConfidenceBar confidence={message.confidence} />
        )}
      </div>

      {showSources && message.sources && message.sources.length > 0 && (
        <SourcesPanel sources={message.sources} />
      )}

      {/* Feedback row — only shown when answer is complete */}
      {message.content && (
        <div className="fb-row">
          <span className="fb-label">Helpful?</span>
          <button
            className={`fb-btn${voted === "up" ? " voted-up" : ""}`}
            onClick={() => handleVote("up")}
            disabled={!!voted}
            aria-label="Thumbs up"
          >
            <ThumbsUp size={12} /> Yes
          </button>
          <button
            className={`fb-btn${voted === "down" ? " voted-down" : ""}`}
            onClick={() => handleVote("down")}
            disabled={!!voted}
            aria-label="Thumbs down"
          >
            <ThumbsDown size={12} /> No
          </button>
        </div>
      )}
    </div>
  );
}
