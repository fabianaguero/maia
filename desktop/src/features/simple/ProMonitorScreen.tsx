import { useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  AlertCircle,
  Bookmark,
  Plus,
} from "lucide-react";

interface LogLine {
  timestamp: string;
  level: "info" | "warn" | "error";
  service: string;
  message: string;
}

interface Bookmark {
  id: string;
  timestamp: string;
  tag: string;
}

export function ProMonitorScreen() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([
    { id: "1", timestamp: "09:14:27", tag: "spike" },
    { id: "2", timestamp: "09:14:29", tag: "anomaly" },
    { id: "3", timestamp: "09:14:35", tag: "recovery" },
  ]);

  const logLines: LogLine[] = [
    {
      timestamp: "09:14:22",
      level: "info",
      service: "payments-api",
      message: "Health check OK · latency 42ms",
    },
    {
      timestamp: "09:14:27",
      level: "warn",
      service: "payments-api",
      message: "Retry spike detected on provider A",
    },
    {
      timestamp: "09:14:29",
      level: "error",
      service: "payments-api",
      message: "Timeout calling settlement gateway",
    },
    {
      timestamp: "09:14:35",
      level: "info",
      service: "payments-api",
      message: "Fallback route engaged",
    },
    {
      timestamp: "09:14:41",
      level: "info",
      service: "payments-api",
      message: "Recovery confirmed · latency 38ms",
    },
    {
      timestamp: "09:14:52",
      level: "warn",
      service: "payments-api",
      message: "Provider B elevated latency 180ms",
    },
  ];

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
            <h1 className="session-title">payments-api</h1>
            <span className="session-mode-badge">Live · 12m 34s</span>
          </div>
          <div className="session-meta">
            <span className="meta-kind">Log file</span>
            <span className="meta-sound">
              <span className="music-icon">♪</span>
              Eurythmics - Sweet Dreams · 126 BPM
            </span>
          </div>
        </div>

        {/* Live Log Stream */}
        <div className="log-stream">
          {logLines.map((line, idx) => (
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
          <button
            className="btn-playback"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button className="btn-playback" title="Skip back">
            <SkipBack size={20} />
          </button>
          <button className="btn-playback" title="Skip forward">
            <SkipForward size={20} />
          </button>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: "45%" }}></div>
          </div>

          <div className="mode-badges">
            <span className={`badge-mode ${isLiveMode ? "active" : ""}`}>
              Live
            </span>
            <span className={`badge-mode ${!isLiveMode ? "active" : ""}`}>
              Playback
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
              <span className="metric-label">Anomalies</span>
              <span className="metric-value red">4</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Confidence</span>
              <span className="metric-value teal">87%</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Polls</span>
              <span className="metric-value muted">238</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Lines read</span>
              <span className="metric-value muted">1,847</span>
            </div>
          </div>
        </div>

        {/* Current Alert State */}
        <div className="alert-state">
          <div className="alert-icon">
            <AlertCircle size={24} className="orange" />
          </div>
          <div className="alert-info">
            <h3 className="alert-title">Warning spike</h3>
            <p className="alert-subtitle">
              Rising tension detected · 09:14:52
            </p>
            <p className="alert-sound">Tonal lift + brighter percussion</p>
          </div>
        </div>

        {/* Bookmarks */}
        <div className="bookmarks-panel">
          <div className="bookmarks-header">
            <h3 className="bookmarks-title">Bookmarks</h3>
            <span className="bookmark-count">{bookmarks.length}</span>
          </div>
          <div className="bookmarks-list">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bookmark-row">
                <span className="bookmark-time">{bookmark.timestamp}</span>
                <span className="bookmark-tag">{bookmark.tag}</span>
                <button className="btn-ghost btn-small" title="Replay">
                  Replay
                </button>
              </div>
            ))}
          </div>
          <button
            className="btn-add-bookmark"
            onClick={() => {
              const newBookmark: Bookmark = {
                id: Date.now().toString(),
                timestamp: "09:15:00",
                tag: "custom",
              };
              setBookmarks([...bookmarks, newBookmark]);
            }}
          >
            <Plus size={14} />
            Add bookmark
          </button>
        </div>
      </div>
    </div>
  );
}
