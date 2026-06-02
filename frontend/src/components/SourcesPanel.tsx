import { BookOpen } from "lucide-react";

export type Source = {
  label: string;
  page: number;
  chunkIndex: number;
  text: string;
  similarity: number;
};

type Props = {
  sources: Source[];
};

export function SourcesPanel({ sources }: Props) {
  if (sources.length === 0) return null;

  return (
    <div className="sources-panel">
      <div className="src-header">
        <BookOpen size={12} />
        Retrieved sources · {sources.length} chunk
        {sources.length !== 1 ? "s" : ""}
      </div>
      {sources.map((src, i) => (
        <div key={`${src.page}-${src.chunkIndex}-${i}`} className="src-row">
          <span className="src-num">§{i + 1}</span>
          <div>
            <div className="src-text">{src.text}</div>
            <div className="src-score">
              {src.label} · page {src.page} · similarity{" "}
              {src.similarity.toFixed(3)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
