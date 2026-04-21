import { useState, useEffect } from "react";
import { Play, Square, Music, AlertCircle, Clock } from "lucide-react";

import type { ActiveMonitorSession, MonitorMetrics } from "../monitor/MonitorContext";
import type { PersistedSession } from "../../api/sessions";
import type { LibraryTrack, RepositoryAnalysis } from "../../types/library";

interface SimpleMonitorScreenProps {
  session: ActiveMonitorSession | null;
  metrics: MonitorMetrics;
  pastSessions: PersistedSession[];
  repositories: RepositoryAnalysis[];
  tracks: LibraryTrack[];
  onStop: () => void;
  onResumeAudio: () => void;
  audioStatus: AudioContextState;
  onStartMonitoring: (repoId: string, trackId: string) => void;
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => void;
  subscribe: (listener: (update: any) => void) => () => void;
  trackName?: string;
  waveformBins?: number[]; // New prop
  isConsoleExpanded?: boolean;
  onToggleConsole?: () => void;
}

interface SessionRecord {
  id: string;
  name: string;
  source: string;
  anomalies: number;
  duration: string;
}

function getTrackTitle(track: LibraryTrack): string {
  return track.tags.title || track.file.filename || "Untitled Track";
}

function MiniWave({ color = "var(--color-accent)", count = 20, active = true, seed = "maia" }) {
  // Deterministic heights based on seed string using a better generator
  const getHeights = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = s.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    let t = Math.abs(hash);
    return Array.from({ length: count }).map((_, i) => {
      t = (t * 1664525 + 1013904223) >>> 0;
      const h = (t % 70) + 15;
      return h;
    });
  };

  const heights = getHeights(seed);

  return (
    <div className={`visual-wave-static ${active ? "active" : ""}`}>
      {heights.map((h, i) => (
        <div 
          key={i} 
          className="wave-bar-static" 
          style={{ 
            backgroundColor: active ? color : 'var(--text-muted)',
            height: `${h}%`,
            opacity: active ? 1 : 0.3
          }} 
        />
      ))}
    </div>
  );
}

interface ModernSelectorProps<T> {
  label: string;
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  renderTitle: (item: T) => string;
  renderSub: (item: T) => string;
  color: string;
}

function ModernSelector<T extends { id: string }>({ 
  label, 
  items, 
  selectedId, 
  onSelect, 
  renderTitle, 
  renderSub,
  color,
  seedPrefix = "item"
}: ModernSelectorProps<T>) {
  return (
    <div className="modern-selector">
      <label className="setup-label">{label}</label>
      <div className="selector-grid">
        {items.map(item => {
          const isSelected = item.id === selectedId;
          return (
            <div 
              key={item.id} 
              className={`selector-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <div className="card-content">
                <span className="card-title">{renderTitle(item)}</span>
                <span className="card-sub">{renderSub(item)}</span>
              </div>
              <div className="card-wave">
                <MiniWave 
                  color={color} 
                  count={isSelected ? 14 : 6} 
                  active={isSelected} 
                  seed={`${seedPrefix}-${item.id}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SimpleMonitorScreen({ 
  session, 
  metrics, 
  pastSessions,
  repositories,
  tracks,
  onStop,
  onResumeAudio,
  audioStatus,
  onStartMonitoring,
  onReplaySession,
  subscribe,
  trackName,
  waveformBins,
  isConsoleExpanded = false,
  onToggleConsole
}: SimpleMonitorScreenProps) {
  const isListening = !!session;
  const [liveLines, setLiveLines] = useState<any[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [selectedSoundId, setSelectedSoundId] = useState("");
  const [logSignalBuffer, setLogSignalBuffer] = useState<number[]>(new Array(120).fill(10));
  const [isAnomalyFilterActive, setIsAnomalyFilterActive] = useState(false);
  const [waveformScale, setWaveformScale] = useState(1.0);

  const simulateLog = () => {
    const levels = ["info", "warn", "error", "debug"];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const messages = [
      "SYNTH_PULSE_DETECTED: Signal strength at 89%",
      "NODE_HANDSHAKE: Peer connection established",
      "ANOMALY_TRIGGER: Out-of-bounds telemetry detected",
      "BUFFER_FLUSH: Real-time stream synchronized",
      "MAIA_CORE: Sonification engine optimized"
    ];
    const mock = {
      timestamp: new Date().toLocaleTimeString().split(' ')[0],
      level,
      message: messages[Math.floor(Math.random() * messages.length)]
    };
    setLiveLines(prev => [mock, ...prev].slice(0, 50));
    setLogSignalBuffer(prev => {
      const val = level === "error" ? 140 : level === "warn" ? 100 : 60;
      return [...prev.slice(1), val];
    });
  };

  useEffect(() => {
    if (isListening) {
      // Initial System Handshake Log to show it's working
      setLiveLines([{
        timestamp: new Date().toLocaleTimeString().split(' ')[0],
        level: "info",
        message: `MAIA_MONITOR_INITIALIZED: Handshake successful. Tailing ${session?.sourcePath.split('/').pop()}...`
      }]);
    } else {
      setLiveLines([]);
      setLogSignalBuffer(new Array(120).fill(10));
    }
  }, [isListening, session?.sourcePath]);

  useEffect(() => {
    if (!isListening) return;
    
    const unsub = subscribe((update) => {
      if (update.parsedLines && update.parsedLines.length > 0) {
        // Parse raw lines into objects for UI display and signal mapping
        const parsed = update.parsedLines.map(raw => {
          const levelMatch = raw.match(/\[(ERROR|WARN|INFO|DEBUG|TRACE)\]/i);
          const level = levelMatch ? levelMatch[1].toLowerCase() : "info";
          const tsMatch = raw.match(/\[(.*?)\]/);
          const timestamp = tsMatch ? tsMatch[1] : new Date().toLocaleTimeString().split(' ')[0];
          
          // Clean message: remove the tags if they exist to keep it readable
          const message = raw.replace(/\[.*?\]\s*\[.*?\]\s*/, '');
          
          return { timestamp, level, message };
        });

        setLiveLines((prev) => [...parsed, ...prev].slice(0, 200));
        
        // Push to log signal buffer based on levels - Aggressive amplification
        setLogSignalBuffer(prev => {
          const next = [...prev];
          parsed.forEach(p => {
            let val = 40;
            if (p.level === "error") val = 140; 
            else if (p.level === "warn") val = 100;
            else if (p.level === "info") val = 60;
            next.push(val);
          });
          return next.slice(-120);
        });
      } else {
        // Idle pulse when no data - More visible "heartbeat"
        setLogSignalBuffer(prev => {
          const idle = (Math.sin(Date.now() / 300) * 8 + 18);
          return [...prev.slice(1), idle];
        });
      }
    });
    return unsub;
  }, [isListening, subscribe]);

  const uptimeSeconds = session
    ? Math.floor((Date.now() - session.startedAt) / 1000)
    : 0;
  const uptimeLabel =
    uptimeSeconds < 60
      ? `${uptimeSeconds}s`
      : `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`;

  return (
    <div className="simple-monitor-screen">
      {isListening ? (
        <>
          {/* Active Listening State */}
          <div className="monitor-active">
            {/* Now Listening Header - Streamlined */}
            <div className="now-listening-header">
              <div className="brand-header-mini">
                <img src="file:///home/faguero/.gemini/antigravity/brain/0811368a-61f2-4dcc-a96b-476a10a440a2/media__1776681366000.png" alt="MAIA" className="logo-mini" />
                <div className="status-indicator">
                  <div className="pulsing-dot teal"></div>
                  <span className="status-text">SYSTEM_ACTIVE</span>
                </div>
              </div>
              <div className="source-info">
                <span className="source-name-hd">{session?.repoTitle}</span>
                <span className="source-path-mini">{session?.sourcePath}</span>
              </div>
              <div className="metrics-row-hd">
                <div 
                  className={`metric-pill clickable ${isAnomalyFilterActive ? 'active' : ''}`}
                  onClick={() => {
                    setIsAnomalyFilterActive(!isAnomalyFilterActive);
                    if (!isConsoleExpanded) onToggleConsole?.();
                  }}
                >
                  <span className="pill-label">ANOMALIES</span>
                  <span className="pill-value alert">{metrics.totalAnomalies}</span>
                </div>
                <div className="metric-pill">
                  <span className="pill-label">UPTIME</span>
                  <span className="pill-value">{uptimeLabel}</span>
                </div>
              </div>
              <button
                className="btn-stop-hd"
                onClick={onStop}
              >
                STOP
              </button>
            </div>

            {/* Professional Terminal Tail */}
            <div className={`terminal-tail-container ${isConsoleExpanded ? 'expanded' : ''}`}>
              <div className="terminal-header" onClick={() => onToggleConsole?.()}>
                <div className="terminal-dots">
                  <span className="terminal-dot red"></span>
                  <span className="terminal-dot yellow"></span>
                  <span className="terminal-dot green"></span>
                </div>
                <span className="terminal-title">
                  {isAnomalyFilterActive ? "ANOMALY_DETECTION_STREAM" : "LIVE_SYSTEM_INGESTION"}
                </span>
                <div className="terminal-controls">
                  <button className="btn-refresh-hd" onClick={(e) => {
                    e.stopPropagation();
                    window.location.reload();
                  }} style={{
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#94a3b8",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "0.6rem",
                    cursor: "pointer",
                    marginRight: "0.5rem"
                  }}>REFRESH</button>
                  <button className="btn-simulate-hd" onClick={(e) => {
                    e.stopPropagation();
                    simulateLog();
                  }}>SIMULATE_DATA</button>
                  {isAnomalyFilterActive && (
                    <button className="btn-filter-clear" onClick={(e) => {
                      e.stopPropagation();
                      setIsAnomalyFilterActive(false);
                    }}>SHOW ALL</button>
                  )}
                  <span className="terminal-action-hint">{isConsoleExpanded ? "CLOSE" : "INSPECT"}</span>
                </div>
              </div>
              <div className="terminal-lines">
                {liveLines.length === 0 ? (
                  <div className="terminal-empty">
                    <div className="pulsing-dot teal"></div>
                    <span>WAITING_FOR_LIVE_INGESTION_STREAM...</span>
                    <p className="terminal-hint">Listening to {session?.sourcePath} in real-time</p>
                    <div className="terminal-status-badge">DIRECTORY_POLL: ACTIVE (0 LINES DETECTED)</div>
                  </div>
                ) : (
                  liveLines
                    .filter(line => !isAnomalyFilterActive || line.level === "error")
                    .map((line, i) => (
                    <div key={i} className={`terminal-line ${line.level}`}>
                      <span className="line-ts">[{line.timestamp}]</span>
                      <span className="line-level">{line.level.toUpperCase()}</span>
                      <span className="line-msg">{line.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Waveform Area - Rekordbox Style */}
            <div className="waveform-section-hd">
              <div className="section-controls-hd">
                <span className="section-label-hd">HD_WAVEFORM_ENGINE // SCAN_ACTIVE</span>
              </div>

              <div className="zoom-control-vertical">
                <span className="zoom-label-vertical">H</span>
                <input 
                  type="range" 
                  min="0.5" 
                  max="3.5" 
                  step="0.1" 
                  value={waveformScale}
                  onChange={(e) => setWaveformScale(parseFloat(e.target.value))}
                  className="zoom-slider-vertical"
                  /* @ts-ignore - non-standard attribute for vertical slider */
                  orient="vertical"
                />
                <span className="zoom-value-vertical">{waveformScale.toFixed(1)}</span>
              </div>

              <div className="waveform-dual-channel" style={{ height: `${160 * waveformScale}px` }}>
              <div className="analysis-scanline-hd"></div>

              {/* Top channel - TRACK Analysis (Real PCM Bins) */}
              <div className="waveform-channel-hd">
                <div className="channel-label-mini">
                  <span className="label-blue">TRACK PCM</span>
                  <span className="label-muted-hd">{trackName || "Master"}</span>
                </div>
                <div className="waveform-container-hd">
                  {(waveformBins && waveformBins.length > 0 
                    ? waveformBins 
                    : Array.from({ length: 120 }).map((_, i) => {
                        // Deterministic "Unique" wave based on trackName string
                        const seed = (trackName || "Master").split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        return (Math.sin(i * 0.15 + seed) * 20 + 40) + (Math.cos(i * 0.05 + seed) * 10);
                      })
                  ).slice(0, 120).map((bin, i) => (
                    <div
                      key={`track-${i}`}
                      className="waveform-bar-hd blue"
                      style={{
                        height: `${Math.max(15, bin * 1.8)}%`,
                        opacity: 0.5 + (bin / 100) * 0.5
                      }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Bottom channel - LOG Activity (Reactive) */}
              <div className="waveform-channel-hd mirrored">
                <div className="channel-label-mini">
                  <span className="label-cyan">LOG SIGNAL</span>
                  <span className="label-muted-hd">LIVE INGESTION</span>
                </div>
                <div className="waveform-container-hd">
                  {logSignalBuffer.map((val, i) => {
                    const isHigh = val > 60;
                    const isExtreme = val > 90;
                    return (
                      <div
                        key={`log-${i}`}
                        className={`waveform-bar-hd ${isExtreme ? 'red' : isHigh ? 'orange' : 'cyan'}`}
                        style={{
                          height: `${val}%`,
                          opacity: isHigh ? 1 : 0.6,
                          transition: "height 0.05s ease"
                        }}
                      ></div>
                    );
                  })}
                </div>
              </div>

              {/* Reverb/Tail visualizer */}
              <div className="waveform-glow-bg"></div>
            </div>
          </div>

              {/* Sound Status */}
              <div className="sound-status">
                <span className={metrics.totalAnomalies > 0 ? "status-alert" : "status-healthy"}>
                  {metrics.totalAnomalies > 0 
                    ? `Warning: ${metrics.totalAnomalies} anomalies detected in session` 
                    : "Signal healthy — monitoring flow"}
                </span>
              </div>
            

            {/* Action Footer */}
            <div className="monitor-footer">
              <button className="btn-secondary" onClick={onStop}>
                End session
              </button>
              <button className="btn-ghost">Bookmark anomaly</button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Idle State - Ready to Monitor */}
          <div className="monitor-idle">
            <div className="idle-container">
              <h2 className="idle-title">Start monitoring</h2>

              <div className="setup-container-modern">
                <ModernSelector
                  label="Log source"
                  items={repositories}
                  selectedId={selectedSourceId}
                  onSelect={setSelectedSourceId}
                  renderTitle={r => r.title}
                  renderSub={r => r.sourcePath}
                  color="var(--color-calm)"
                  seedPrefix="repo"
                />

                <ModernSelector
                  label="Sound profile"
                  items={tracks}
                  selectedId={selectedSoundId}
                  onSelect={setSelectedSoundId}
                  renderTitle={t => getTrackTitle(t)}
                  renderSub={t => t.tags.musicStyleLabel || "Ambient"}
                  color="var(--color-accent)"
                  seedPrefix="track"
                />

                <div className="setup-actions-fixed">
                  <button
                    className={`btn-start-listening-impactful ${selectedSourceId && selectedSoundId ? 'ready' : ''}`}
                    onClick={() => {
                      if (selectedSourceId && selectedSoundId) {
                        onStartMonitoring(selectedSourceId, selectedSoundId);
                      }
                    }}
                    disabled={!selectedSourceId || !selectedSoundId}
                  >
                    <div className="btn-impact-glitch" />
                    <Play size={28} fill="currentColor" />
                    <span className="btn-text">INITIALIZE MONITORING</span>
                    <div className="btn-impact-scan" />
                  </button>
                </div>
              </div>

              {/* Right Column - Past Sessions */}
              <div className="sessions-column">
                <h3 className="sessions-title">Past sessions</h3>
                <div className="sessions-list">
                  {pastSessions.length === 0 ? (
                    <p className="text-muted" style={{ padding: "1rem", fontSize: "13px" }}>No previous sessions found.</p>
                  ) : (
                    pastSessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="session-row">
                        <div className="session-info">
                          <span className="session-name">{session.label || session.sourceTitle || "Untitled Session"}</span>
                          <span className="session-source">{session.sourcePath}</span>
                        </div>
                        <div className="session-stats">
                          {session.totalAnomalies > 0 && (
                            <span className="badge-anomalies">
                              {session.totalAnomalies}
                            </span>
                          )}
                          <span className="session-duration">{session.totalLines} lines</span>
                        </div>
                        <div className="session-actions">
                          <button 
                            className="btn-ghost" 
                            title="Replay"
                            onClick={() => onReplaySession(session.id, session.sourcePath || "", session.sourceTitle || "Session")}
                          >
                            <Play size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
