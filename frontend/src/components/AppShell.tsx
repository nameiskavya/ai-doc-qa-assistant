import React from "react";
import { Shield } from "lucide-react";

const TABS = [
  "Document Query",
  "Upload History",
  "Audit Log",
  "Administration",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <div className="app-shell">
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-seal">
            <Shield size={16} />
          </div>
          <div>
            <div className="topbar-name">AI Document Q&A Assistant</div>
            <div className="topbar-sub">
              Secure AI-Assisted Document Analysis
            </div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="tb-chip">v2.1.4</div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="navtabs">
        {TABS.map((tab, i) => (
          <div
            key={tab}
            className={`navtab${activeTab === i ? " active" : ""}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="body-split">{children}</div>

      {/* Footer */}
      <div className="gov-footer">
        <span>Document Intelligence System · v2.1.4</span>
        <div className="footer-links">
          <a href="#">Privacy Notice</a>
          <a href="#">Accessibility</a>
          <a href="#">Terms of Use</a>
          <a href="#">Support</a>
        </div>
        <span>TLS 1.3 Encrypted</span>
      </div>
    </div>
  );
}
