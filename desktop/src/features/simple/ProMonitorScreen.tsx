import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, AlertCircle, Plus } from "lucide-react";
import { useT } from "../../i18n/I18nContext";
import { buildProMonitorMockData, type ProMonitorBookmark } from "./proMonitorMockData";
import {
  buildProMonitorScreenViewModel,
  createCustomProMonitorBookmark,
} from "./proMonitorScreenRuntime";

export function ProMonitorScreen() {
  const t = useT();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiveMode] = useState(true);
  const mockData = buildProMonitorMockData(t);
  const [bookmarks, setBookmarks] = useState<ProMonitorBookmark[]>(mockData.bookmarks);
  const viewModel = buildProMonitorScreenViewModel({ t, mockData, bookmarks });

  return (
    <div className="pro-monitor-screen">
      {/* Left Column - 60% */}
      <div className="monitor-left-column">
        {/* Session Header */}
        <div className="session-header">
          <div className="session-title-group">
            <h1 className="session-title">{mockData.sessionTitle}</h1>
            <span className="session-mode-badge">
              {t.simpleMode.proMonitor.sessionModeLive.replace("{time}", mockData.sessionElapsed)}
            </span>
          </div>
          <div className="session-meta">
            <span className="meta-kind">{t.simpleMode.proMonitor.logKind}</span>
            <span className="meta-sound">
              <span className="music-icon">♪</span>
              {t.simpleMode.proMonitor.trackMeta
                .replace("{track}", mockData.trackTitle)
                .replace("{bpm}", mockData.bpm)}
            </span>
          </div>
        </div>

        {/* Live Log Stream */}
        <div className="log-stream">
          {viewModel.logLines.map((line, idx) => (
            <div key={idx} className="log-line">
              <span className="log-timestamp">{line.timestamp}</span>
              <span className={`level-badge ${line.levelBadgeClassName}`}>{line.levelLabel}</span>
              <span className="log-service">{line.service}</span>
              <span className="log-message">{line.message}</span>
            </div>
          ))}
        </div>

        {/* Playback Controls */}
        <div className="playback-controls">
          <button
            type="button"
            className="btn-playback"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? t.simpleMode.proMonitor.pause : t.simpleMode.proMonitor.play}
            title={isPlaying ? t.simpleMode.proMonitor.pause : t.simpleMode.proMonitor.play}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            type="button"
            className="btn-playback"
            title={t.simpleMode.proMonitor.skipBack}
            aria-label={t.simpleMode.proMonitor.skipBack}
          >
            <SkipBack size={20} />
          </button>
          <button
            type="button"
            className="btn-playback"
            title={t.simpleMode.proMonitor.skipForward}
            aria-label={t.simpleMode.proMonitor.skipForward}
          >
            <SkipForward size={20} />
          </button>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: "45%" }}></div>
          </div>

          <div className="mode-badges">
            <span className={`badge-mode ${isLiveMode ? "active" : ""}`}>
              {t.simpleMode.proMonitor.live}
            </span>
            <span className={`badge-mode ${!isLiveMode ? "active" : ""}`}>
              {t.simpleMode.proMonitor.playback}
            </span>
          </div>
        </div>
      </div>

      {/* Right Column - 40% */}
      <div className="monitor-right-column">
        {/* Metrics Panel */}
        <div className="metrics-panel">
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">{t.simpleMode.proMonitor.anomalies}</span>
              <span className="metric-value red">{mockData.metrics.anomalies}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">{t.simpleMode.proMonitor.confidence}</span>
              <span className="metric-value teal">{mockData.metrics.confidence}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">{t.simpleMode.proMonitor.polls}</span>
              <span className="metric-value muted">{mockData.metrics.polls}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">{t.simpleMode.proMonitor.linesRead}</span>
              <span className="metric-value muted">{mockData.metrics.linesRead}</span>
            </div>
          </div>
        </div>

        {/* Current Alert State */}
        <div className="alert-state">
          <div className="alert-icon">
            <AlertCircle size={24} className="orange" />
          </div>
          <div className="alert-info">
            <h3 className="alert-title">{t.simpleMode.proMonitor.warningSpike}</h3>
            <p className="alert-subtitle">
              {t.simpleMode.proMonitor.warningSpikeSubtitle.replace(
                "{time}",
                mockData.alertTimestamp,
              )}
            </p>
            <p className="alert-sound">{t.simpleMode.proMonitor.warningSpikeSound}</p>
          </div>
        </div>

        {/* Bookmarks */}
        <div className="bookmarks-panel">
          <div className="bookmarks-header">
            <h3 className="bookmarks-title">{t.simpleMode.proMonitor.bookmarks}</h3>
            <span className="bookmark-count">{viewModel.bookmarks.length}</span>
          </div>
          <div className="bookmarks-list">
            {viewModel.bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bookmark-row">
                <span className="bookmark-time">{bookmark.timestamp}</span>
                <span className="bookmark-tag">{bookmark.tagLabel}</span>
                <button
                  type="button"
                  className="btn-ghost btn-small"
                  title={t.simpleMode.proMonitor.replayBookmark}
                  aria-label={t.simpleMode.proMonitor.replayBookmark}
                >
                  {t.simpleMode.proMonitor.replayBookmark}
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn-add-bookmark"
            onClick={() => {
              setBookmarks([...bookmarks, createCustomProMonitorBookmark()]);
            }}
          >
            <Plus size={14} />
            {t.simpleMode.proMonitor.addBookmark}
          </button>
        </div>
      </div>
    </div>
  );
}
