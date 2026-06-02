import { useRef } from "react";
import { Send, Lock } from "lucide-react";

type Props = {
  value: string;
  disabled: boolean;
  loading: boolean;
  sessionId: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
};

export function ChatInput({
  value,
  disabled,
  loading,
  sessionId,
  onChange,
  onSubmit,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="chat-input-area">
      <div className="input-row">
        <div className="input-inner">
          <textarea
            ref={textareaRef}
            rows={2}
            value={value}
            disabled={disabled || loading}
            placeholder={
              disabled
                ? "Upload a document to begin querying…"
                : "Enter your question about the loaded document…"
            }
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
          />
          <div className="input-audit">
            <Lock size={10} />
            Queries are logged for audit purposes · Session: {sessionId}
          </div>
        </div>
        <button
          className="send-btn"
          onClick={onSubmit}
          disabled={disabled || loading || !value.trim()}
          aria-label="Submit question"
        >
          <Send size={14} />
          {loading ? "Thinking…" : "Submit"}
        </button>
      </div>
    </div>
  );
}
