import { useState } from "react";
import {
  Music,
  FolderOpen,
  Package,
  Plus,
  Eye,
  Trash2,
  ScrollText,
  RefreshCw,
  AudioWaveform,
} from "lucide-react";
import type { LibraryTrack, RepositoryAnalysis, BaseAssetRecord } from "../../types/library";
import { useT } from "../../i18n/I18nContext";
import { formatShortDate } from "../../utils/date";
import { formatBpmLabel } from "../../utils/monitorLabels";
import { getTrackTitle } from "../../utils/track";

interface ProLibraryScreenProps {
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
}

export function ProLibraryScreen({ tracks, repositories, baseAssets }: ProLibraryScreenProps) {
  const t = useT();
  const [activeTab, setActiveTab] = useState<"sounds" | "sources" | "profiles">("sounds");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      analyzed: "badge-analyzed",
      ready: "badge-ready",
      pending: "badge-pending",
    };
    const statusLabels: Record<string, string> = {
      analyzed: t.library.statusAnalyzed,
      ready: t.library.statusReady,
      pending: t.library.statusPending,
    };
    return <span className={`status-badge ${statusClasses[status]}`}>{statusLabels[status]}</span>;
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
          {t.library.sounds}
          <span className="tab-count">{tracks.length}</span>
        </button>
        <button
          className={`tab ${activeTab === "sources" ? "active" : ""}`}
          onClick={() => setActiveTab("sources")}
        >
          <FolderOpen size={16} />
          {t.library.logSources}
          <span className="tab-count">{repositories.length}</span>
        </button>
        <button
          className={`tab ${activeTab === "profiles" ? "active" : ""}`}
          onClick={() => setActiveTab("profiles")}
        >
          <Package size={16} />
          {t.library.profiles}
          <span className="tab-count">{baseAssets.length}</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="library-content">
        {activeTab === "sources" && (
          <div className="sources-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">{t.library.logSources}</h2>
                <p className="section-subtitle">{t.library.toolbarSourcesNote}</p>
              </div>
              <div className="action-buttons">
                <button className="btn-primary">
                  <FolderOpen size={16} />
                  {t.library.importRepository}
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
                      {source.suggestedBpm ? ` · ${formatBpmLabel(source.suggestedBpm)}` : ""}
                    </span>
                  </div>

                  <div className="source-actions">
                    <button className="btn-ghost" title={t.simpleMode.common.inspect}>
                      <Eye size={14} />
                    </button>
                    <button className="btn-ghost" title={t.library.analyze}>
                      <RefreshCw size={14} />
                    </button>
                    <button className="btn-ghost btn-danger" title={t.library.deleteRepository}>
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
            <h3>{t.library.noBasePacksYet}</h3>
            <button className="btn-primary">
              <Plus size={16} />
              {t.library.importBaseAsset}
            </button>
          </div>
        )}

        {activeTab === "sounds" && (
          <div className="sounds-section">
            <div className="sources-list">
              {tracks.map((track) => (
                <div key={track.id} className="source-item">
                  <div className="source-icon">
                    <AudioWaveform size={18} className="text-cyan-400" />
                  </div>
                  <div className="source-info">
                    <div className="source-header">
                      <span className="source-name">{getTrackTitle(track)}</span>
                      {track.analysis.bpm ? (
                        <span className="status-badge badge-ready">
                          {formatBpmLabel(track.analysis.bpm)}
                        </span>
                      ) : (
                        <span className="status-badge badge-pending">
                          {t.simpleMode.status.loading}
                        </span>
                      )}
                    </div>
                    <code className="source-path">{track.file.sourcePath}</code>
                    <span className="source-date">
                      {track.tags.musicStyleLabel} · {track.file.fileExtension.toUpperCase()}
                    </span>
                  </div>
                  <div className="source-actions">
                    <button className="btn-ghost" title={t.library.view}>
                      <Eye size={14} />
                    </button>
                    <button className="btn-ghost btn-danger" title={t.library.deleteTrack}>
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
