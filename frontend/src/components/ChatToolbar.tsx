import { FileText } from "lucide-react";

type Props = {
  filename: string;
  chunks: number;
  showSources: boolean;
  onToggleSources: (val: boolean) => void;
};

export function ChatToolbar({
  filename,
  chunks,
  showSources,
  onToggleSources,
}: Props) {
  return (
    <div className="chat-toolbar">
      <div className="ct-left">
        {filename ? (
          <>
            <div className="status-dot" />
            <div className="doc-active">
              <FileText size={14} />
              {filename}
            </div>
            {chunks > 0 && (
              <span className="chunk-badge">· {chunks} chunks available</span>
            )}
          </>
        ) : (
          <span className="chunk-badge">No document loaded</span>
        )}
      </div>
      <div className="ct-right">
        <label className="sources-toggle">
          <input
            type="checkbox"
            checked={showSources}
            onChange={(e) => onToggleSources(e.target.checked)}
          />
          Show sources
        </label>
      </div>
    </div>
  );
}
