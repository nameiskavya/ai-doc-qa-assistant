type Props = {
  confidence: "high" | "medium" | "low";
  topSimilarity?: number; // add this
};

const LABEL = {
  high: "High confidence",
  medium: "Moderate confidence",
  low: "Low confidence — verify against sources",
};

const PCT = {
  high: 87,
  medium: 58,
  low: 24,
};

export function ConfidenceBar({ confidence, topSimilarity }: Props) {
  // If we have the real score, show it. Otherwise fall back to bucket estimate.
  const pct =
    topSimilarity != null ? Math.round(topSimilarity * 100) : PCT[confidence];

  return (
    <div className="conf-row">
      <span className="conf-label">Confidence</span>
      <div className="conf-track">
        <div
          className={`conf-fill ${confidence}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`conf-pct ${confidence}`}>
        {pct}% — {LABEL[confidence]}
      </span>
    </div>
  );
}
