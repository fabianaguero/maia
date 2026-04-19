import { useState } from "react";
import {
  Music,
  FolderOpen,
  Package,
  Plus,
  Eye,
  Trash2,
  GitBranch,
  ScrollText,
  RefreshCw,
} from "lucide-react";

interface LogSource {
  id: string;
  name: string;
  type: "file" | "directory" | "github";
  path: string;
  status: "analyzed" | "pending" | "ready";
  dateAdded: string;
}

export function ProLibraryScreen() {
  const [activeTab, setActiveTab] = useState<"sounds" | "sources" | "profiles">(
    "sources"
  );
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const logSources: LogSource[] = [
    {
      id: "1",
      name: "payments-api",
      type: "file",
      path: "/var/log/payments-api.log",
      status: "analyzed",
      dateAdded: "12 apr 2026",
    },
    {
      id: "2",
      name: "backend-monorepo",
      type: "directory",
      path: "/home/dev/projects/backend",
      status: "ready",
      dateAdded: "11 apr 2026",
    },
    {
      id: "3",
      name: "github.com/org/infra",
      type: "github",
      path: "https://github.com/org/infra",
      status: "pending",
      dateAdded: "10 apr 2026",
    },
  ];

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "file":
        return <ScrollText size={16} className="text-cyan-400" />;
      case "directory":
        return <FolderOpen size={16} className="text-cyan-400" />;
      case "github":
        return <GitBranch size={16} className="text-cyan-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      analyzed: "badge-analyzed",
      ready: "badge-ready",
      pending: "badge-pending",
    };
    const statusLabels: Record<string, string> = {
      analyzed: "Analyzed",
      ready: "Ready",
      pending: "Pending",
    };
    return (
      <span className={`status-badge ${statusClasses[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  return (
    <div className="pro-library-screen">
      {/* Tab Navigation */}
      <div className="library-tabs">
        <button
          className={`tab ${activeTab === "sounds" ? "active" : ""}`}
          onClick={() => setActiveTab("sounds")}
        >
          <Music size={16} />
          Sounds
          <span className="tab-count">9</span>
        </button>
        <button
          className={`tab ${activeTab === "sources" ? "active" : ""}`}
          onClick={() => setActiveTab("sources")}
        >
          <FolderOpen size={16} />
          Log sources
          <span className="tab-count">12</span>
        </button>
        <button
          className={`tab ${activeTab === "profiles" ? "active" : ""}`}
          onClick={() => setActiveTab("profiles")}
        >
          <Package size={16} />
          Profiles
          <span className="tab-count">0</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="library-content">
        {activeTab === "sources" && (
          <div className="sources-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Your log sources</h2>
                <p className="section-subtitle">
                  Connect log files, repos, and live streams to monitor.
                </p>
              </div>
              <div className="action-buttons">
                <button className="btn-primary">
                  <FolderOpen size={16} />
                  Connect Log Source
                </button>
              </div>
            </div>

            <div className="sources-list">
              {logSources.map((source) => (
                <div
                  key={source.id}
                  className={`source-item ${selectedSource === source.id ? "selected" : ""}`}
                  onClick={() => setSelectedSource(source.id)}
                >
                  <div className="source-icon">{getSourceIcon(source.type)}</div>

                  <div className="source-info">
                    <div className="source-header">
                      <span className="source-name">{source.name}</span>
                      {getStatusBadge(source.status)}
                    </div>
                    <code className="source-path">{source.path}</code>
                    <span className="source-date">{source.dateAdded}</span>
                  </div>

                  <div className="source-actions">
                    <button className="btn-ghost" title="Inspect">
                      <Eye size={14} />
                    </button>
                    <button className="btn-ghost" title="Reanalyze">
                      <RefreshCw size={14} />
                    </button>
                    <button className="btn-ghost btn-danger" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "profiles" && (
          <div className="profiles-section empty-state">
            <div className="empty-icon">◆</div>
            <h3>No profiles yet.</h3>
            <button className="btn-primary">
              <Plus size={16} />
              Import Sound Profile
            </button>
          </div>
        )}

        {activeTab === "sounds" && (
          <div className="sounds-section">
            <p className="text-center text-gray-500 py-8">
              Sound library view (3+ tracks)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
