import React from "react";
import { Upload, FileText, CheckCircle } from "lucide-react";

export type DocEntry = {
  documentId: string;
  filename: string;
  chunks: number;
  uploadedAt: Date;
};

type Props = {
  docs: DocEntry[];
  activeDocumentId: string;
  uploading: boolean;
  sessionStats: { queries: number; feedback: number };
  onSelectDoc: (docId: string) => void;
  onUpload: (file: File) => void;
};

export function DocumentSidebar({
  docs,
  activeDocumentId,
  uploading,
  sessionStats,
  onSelectDoc,
  onUpload,
}: Props) {
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    // reset so same file can be re-uploaded
    e.target.value = "";
  }

  function formatAge(date: Date) {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    return `${Math.floor(mins / 60)} hr ago`;
  }

  return (
    <div className="sidebar">
      {/* Upload */}
      <div className="sb-section">
        <div className="sb-label">Upload document</div>
        <label className="upload-zone">
          <Upload size={22} />
          <div className="uz-title">
            {uploading ? "Processing…" : "Drop file or click to browse"}
          </div>
          <div className="uz-sub">Max 25 MB per file</div>
          <div className="uz-tags">
            <span className="uz-tag">PDF</span>
            <span className="uz-tag">TXT</span>
          </div>
          <input
            type="file"
            accept=".pdf,.txt"
            disabled={uploading}
            onChange={handleFile}
          />
        </label>
      </div>

      {/* Active docs */}
      <div className="sb-section">
        <div className="sb-label">Active documents</div>
        {docs.length === 0 && (
          <div className="no-docs">No documents loaded yet</div>
        )}
        {docs.map((doc) => (
          <div
            key={doc.documentId}
            className={`doc-item${doc.documentId === activeDocumentId ? " active" : ""}`}
            onClick={() => onSelectDoc(doc.documentId)}
          >
            <FileText size={16} />
            <div>
              <div className="doc-name">{doc.filename}</div>
              <div className="doc-meta">{formatAge(doc.uploadedAt)}</div>
              <div className="doc-chunks">
                <CheckCircle size={10} />
                {doc.chunks} chunks indexed
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Session stats */}
      <div className="sb-section">
        <div className="sb-label">Session summary</div>
        <div className="stat-row">
          <span>Documents loaded</span>
          <strong>{docs.length}</strong>
        </div>
        <div className="stat-row">
          <span>Queries this session</span>
          <strong>{sessionStats.queries}</strong>
        </div>
        <div className="stat-row">
          <span>Feedback submitted</span>
          <strong>{sessionStats.feedback}</strong>
        </div>
      </div>
    </div>
  );
}
