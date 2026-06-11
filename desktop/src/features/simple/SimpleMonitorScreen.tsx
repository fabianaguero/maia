import React, { useState, useEffect } from "react";
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
  onStartMonitoring: (repoId: string, trackId?: string) => void;
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
  const [logSignalBuffer, setLogSignalBuffer] = useState<{val: number, heat: number}[]>(new Array(120).fill({val: 10, heat: 0}));
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
      const heat = level === "error" ? 1.0 : level === "warn" ? 0.5 : 0;
      const val = 40 + (heat * 100);
      const newBuffer = [...prev];
      for (let i = 0; i < 60; i++) {
        newBuffer[i] = prev[i + 1] || {val: 20, heat: 0};
      }
      newBuffer[60] = { val, heat }; // Insert EXACTLY at the center playhead
      for (let i = 61; i < 120; i++) {
        newBuffer[i] = { val: 20, heat: 0 }; // Future is empty
      }
      return newBuffer;
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
      setLogSignalBuffer(new Array(120).fill({val: 10, heat: 0}));
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
        
        // Push EXACTLY ONE value to the log signal buffer per stream update.
        // This ensures the visual waveform moves at the exact same rate as the 
        // crossfade audio engine (1 block = 1 poll interval), syncing sight and sound.
        setLogSignalBuffer(prev => {
          let val = 20;
          let heat = 0;
          const cues = update.sonificationCues || [];
          const anomalies = update.anomalyMarkers || [];
          
          if (cues.length > 0 || anomalies.length > 0) {
            // Volume logic: based purely on sonification gain (how loud the output is)
            const avgGain = cues.length > 0 ? cues.reduce((s, c) => s + c.gain, 0) / cues.length : 0;
            // Map gain to visual height (0 to 140)
            val = 20 + Math.min(120, avgGain * 150);
            
            // Heat logic: based purely on anomaly presence (triggers red color)
            heat = anomalies.length > 0 ? 0.5 + Math.min(0.5, anomalies.length * 0.1) : 0;
          } else {
            // Low resting pulse if lines arrived but no cues/anomalies
            val = 30 + Math.random() * 10;
          }
          
          const newBuffer = [...prev];
          // Shift the past leftwards
          for (let i = 0; i < 60; i++) {
             newBuffer[i] = prev[i + 1] || {val: 20, heat: 0};
          }
          // Insert the new live data EXACTLY at the center playhead
          newBuffer[60] = { val, heat };
          // The future (right side of playhead) is empty because we don't know future logs
          for (let i = 61; i < 120; i++) {
             newBuffer[i] = { val: 20, heat: 0 };
          }
          return newBuffer;
        });
      } else {
        // Idle pulse when no data
        setLogSignalBuffer(prev => {
          const idle = (Math.sin(Date.now() / 300) * 8 + 18);
          const newBuffer = [...prev];
          for (let i = 0; i < 60; i++) {
             newBuffer[i] = prev[i + 1] || {val: 20, heat: 0};
          }
          newBuffer[60] = { val: idle, heat: 0 };
          for (let i = 61; i < 120; i++) {
             newBuffer[i] = { val: 20, heat: 0 };
          }
          return newBuffer;
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
              <div className="analysis-scanline-hd" style={{ left: "50%", boxShadow: "0 0 10px #fff" }}></div>

              {/* Unified Rekordbox-style Waveform Channel */}
              <div className="waveform-channel-hd" style={{ height: "100%", borderBottom: "none", position: "relative" }}>
                <div className="channel-label-mini" style={{ zIndex: 30 }}>
                  <span className="label-blue">HYBRID MONITOR</span>
                  <span className="label-muted-hd">{trackName || "Live Ingestion"}</span>
                </div>
                
                <div className="waveform-container-hd" style={{ alignItems: "center", height: "100%", position: "relative", backgroundColor: "#000" }}>
                  {/* ICU Monitor: Single Continuous Line */}
                  <svg 
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      minHeight: "150px"
                    }}
                    viewBox="0 0 119 100"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="icuGradient" x1="0" y1="0" x2="1" y2="0">
                        {logSignalBuffer.map((state, i) => {
                          const offset1 = (i / 120) * 100;
                          const offset2 = ((i + 1) / 120) * 100;
                          const color = state.heat > 0.05 ? "#ff003c" : "#00c8ff";
                          return (
                            <React.Fragment key={`stop-${i}`}>
                              <stop offset={`${offset1}%`} stopColor={color} />
                              <stop offset={`${offset2}%`} stopColor={color} />
                            </React.Fragment>
                          );
                        })}
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Grid lines */}
                    <path d="M 0 50 L 119 50" stroke="#00c8ff" strokeWidth="0.2" opacity="0.3" strokeDasharray="1,1" />
                    <path d="M 0 25 L 119 25" stroke="#00c8ff" strokeWidth="0.1" opacity="0.2" />
                    <path d="M 0 75 L 119 75" stroke="#00c8ff" strokeWidth="0.1" opacity="0.2" />

                    <polyline 
                      points={logSignalBuffer.map((state, i) => {
                        const { val, heat } = state;
                        
                        if (heat > 0.01) {
                          // Pure data representation: no fake sine waves or P-QRS-T complexes.
                          // Maps the exact anomaly intensity (heat) to the height.
                          // If there are fluctuating anomalies, it will draw a natural jagged mountain.
                          // If it's a constant flood, it will correctly show a plateau.
                          // We add a tiny bit of the raw audio volume (val) to keep it feeling 'alive'
                          const liveVal = ((val - 20) * 0.1);
                          return `${i},${50 - (heat * 35) + liveVal}`;
                        } else {
                          // Tiny resting ripples based on volume
                          const ripple = ((val - 20) * 0.05);
                          return `${i},${50 + ripple}`;
                        }
                      }).join(" ")}
                      fill="none"
                      stroke="url(#icuGradient)"
                      strokeWidth="1.2"
                      strokeLinejoin="miter"
                      strokeLinecap="square"
                      filter="url(#glow)"
                    />
                  </svg>
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
