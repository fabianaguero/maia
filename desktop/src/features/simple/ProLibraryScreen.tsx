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
  AudioWaveform,
} from "lucide-react";
import type { LibraryTrack, RepositoryAnalysis, BaseAssetRecord } from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { getTrackTitle } from "../../utils/track";

interface ProLibraryScreenProps {
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
}

export function ProLibraryScreen({ tracks, repositories, baseAssets }: ProLibraryScreenProps) {
  const [activeTab, setActiveTab] = useState<"sounds" | "sources" | "profiles">(
    "sounds"
  );
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

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
          <span className="tab-count">{tracks.length}</span>
        </button>
        <button
          className={`tab ${activeTab === "sources" ? "active" : ""}`}
          onClick={() => setActiveTab("sources")}
        >
          <FolderOpen size={16} />
          Log sources
          <span className="tab-count">{repositories.length}</span>
        </button>
        <button
          className={`tab ${activeTab === "profiles" ? "active" : ""}`}
          onClick={() => setActiveTab("profiles")}
        >
          <Package size={16} />
          Profiles
          <span className="tab-count">{baseAssets.length}</span>
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
              {repositories.map((source) => (
                <div
                  key={source.id}
                  className={`source-item ${selectedSource === source.id ? "selected" : ""}`}
                  onClick={() => setSelectedSource(source.id)}
                >
                  <div className="source-icon">
                    {source.sourceKind === "file" ? (
                      <ScrollText size={16} className="text-cyan-400" />
                    ) : (
                      <FolderOpen size={16} className="text-cyan-400" />
                    )}
                  </div>

                  <div className="source-info">
                    <div className="source-header">
                      <span className="source-name">{source.title}</span>
                      {getStatusBadge(source.suggestedBpm ? "ready" : "pending")}
                    </div>
                    <code className="source-path">{source.sourcePath}</code>
                    <span className="source-date">
                      {formatShortDate(source.importedAt)}
                      {source.suggestedBpm ? ` · ${Math.round(source.suggestedBpm)} BPM` : ""}
                    </span>
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
            <div className="sources-list">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="source-item"
                >
                  <div className="source-icon">
                    <AudioWaveform size={18} className="text-cyan-400" />
                  </div>
                  <div className="source-info">
                    <div className="source-header">
                      <span className="source-name">{getTrackTitle(track)}</span>
                      {track.analysis.bpm ? (
                        <span className="status-badge badge-ready">{Math.round(track.analysis.bpm)} BPM</span>
                      ) : (
                        <span className="status-badge badge-pending">Analyzing...</span>
                      )}
                    </div>
                    <code className="source-path">{track.file.sourcePath}</code>
                    <span className="source-date">
                      {track.tags.musicStyleLabel} · {track.file.fileExtension.toUpperCase()}
                    </span>
                  </div>
                  <div className="source-actions">
                    <button className="btn-ghost" title="View">
                      <Eye size={14} />
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
      </div>
    </div>
  );
}
