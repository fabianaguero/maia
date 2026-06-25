import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, AlertCircle, Plus } from "lucide-react";
import { useT } from "../../i18n/I18nContext";
import { buildProMonitorMockData, type ProMonitorBookmark } from "./proMonitorMockData";

export function ProMonitorScreen() {
  const t = useT();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiveMode] = useState(true);
  const mockData = buildProMonitorMockData(t);
  const [bookmarks, setBookmarks] = useState<ProMonitorBookmark[]>(mockData.bookmarks);

  const resolveBookmarkTag = (bookmark: ProMonitorBookmark): string => {
    switch (bookmark.tagKind) {
      case "spike":
        return t.simpleMode.proMonitor.tagSpike;
      case "anomaly":
        return t.simpleMode.proMonitor.tagAnomaly;
      case "recovery":
        return t.simpleMode.proMonitor.tagRecovery;
      default:
        return t.simpleMode.proMonitor.tagCustom;
    }
  };

  const getLevelBadge = (level: string) => {
    const levelClasses: Record<string, string> = {
      info: "badge-info",
      warn: "badge-warn",
      error: "badge-error",
    };
    return <span className={`level-badge ${levelClasses[level]}`}>{level.toUpperCase()}</span>;
  };

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
          {mockData.logLines.map((line, idx) => (
            <div key={idx} className="log-line">
              <span className="log-timestamp">{line.timestamp}</span>
              {getLevelBadge(line.level)}
              <span className="log-service">{line.service}</span>
              <span className="log-message">{line.message}</span>
            </div>
          ))}
        </div>

        {/* Playback Controls */}
        <div className="playback-controls">
          <button className="btn-playback" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button className="btn-playback" title={t.simpleMode.proMonitor.skipBack}>
            <SkipBack size={20} />
          </button>
          <button className="btn-playback" title={t.simpleMode.proMonitor.skipForward}>
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
            <span className="bookmark-count">{bookmarks.length}</span>
          </div>
          <div className="bookmarks-list">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bookmark-row">
                <span className="bookmark-time">{bookmark.timestamp}</span>
                <span className="bookmark-tag">{resolveBookmarkTag(bookmark)}</span>
                <button
                  className="btn-ghost btn-small"
                  title={t.simpleMode.proMonitor.replayBookmark}
                >
                  {t.simpleMode.proMonitor.replayBookmark}
                </button>
              </div>
            ))}
          </div>
          <button
            className="btn-add-bookmark"
            onClick={() => {
              const newBookmark: ProMonitorBookmark = {
                id: Date.now().toString(),
                timestamp: "09:15:00",
                tagKind: "custom",
              };
              setBookmarks([...bookmarks, newBookmark]);
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
