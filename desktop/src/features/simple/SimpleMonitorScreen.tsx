import { useState } from "react";
import { Play, Square, Music, AlertCircle, Clock } from "lucide-react";

interface Session {
  id: string;
  name: string;
  source: string;
  anomalies: number;
  duration: string;
}

export function SimpleMonitorScreen() {
  const [isListening, setIsListening] = useState(false);
  const [selectedSource, setSelectedSource] = useState("payments-api");
  const [selectedSound, setSelectedSound] = useState("Eurythmics - Sweet Dreams");

  const [sessions, setSessions] = useState<Session[]>([
    {
      id: "1",
      name: "Payments API - 2026-04-19",
      source: "payments-api",
      anomalies: 4,
      duration: "12m 34s",
    },
    {
      id: "2",
      name: "API Monitoring - 2026-04-18",
      source: "payments-api",
      anomalies: 0,
      duration: "8h 45m",
    },
    {
      id: "3",
      name: "Backend Check - 2026-04-17",
      source: "backend-monorepo",
      anomalies: 2,
      duration: "3h 12m",
    },
  ]);

  return (
    <div className="simple-monitor-screen">
      {isListening ? (
        <>
          {/* Active Listening State */}
          <div className="monitor-active">
            {/* Now Listening Header */}
            <div className="now-listening-header">
              <div className="status-indicator">
                <div className="pulsing-dot teal"></div>
                <span className="status-text">Listening now</span>
              </div>
              <div className="source-info">
                <span className="source-name">{selectedSource}</span>
              </div>
              <div className="metrics-row">
                <span className="metric-red">4 anomalies detected</span>
                <span className="metric-muted">12m 34s uptime</span>
                <span className="metric-teal">Confidence 87%</span>
              </div>
              <button
                className="btn-stop"
                onClick={() => setIsListening(false)}
              >
                Stop monitoring
              </button>
            </div>

            {/* Waveform Area */}
            <div className="waveform-section">
              {/* Top channel - LOG signal */}
              <div className="waveform-channel">
                <div className="channel-label">
                  <span className="label-cyan">LOG</span>
                  <span className="label-muted">RAW SIGNAL</span>
                </div>
                <div className="waveform-bars">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={`log-${i}`}
                      className="waveform-bar cyan"
                      style={{
                        height: `${Math.random() * 70 + 30}%`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Bottom channel - ALERT detection */}
              <div className="waveform-channel">
                <div className="channel-label">
                  <span className="label-orange">ALERT</span>
                  <span className="label-muted">ANOMALY DETECTION</span>
                </div>
                <div className="waveform-bars">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={`alert-${i}`}
                      className="waveform-bar orange"
                      style={{
                        height: `${[30, 20, 15, 60, 80, 40, 25, 35, 70, 45, 20, 15, 25, 50, 35, 20][i]}%`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Sound Status */}
              <div className="sound-status">
                <span className="status-healthy">
                  Warning spike → rising tension
                </span>
              </div>
            </div>

            {/* Action Footer */}
            <div className="monitor-footer">
              <button className="btn-secondary" onClick={() => setIsListening(false)}>
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

              {/* Left Column - Setup */}
              <div className="setup-column">
                <div className="setup-section">
                  <label className="setup-label">Log source</label>
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="setup-select"
                  >
                    <option>payments-api</option>
                    <option>backend-monorepo</option>
                    <option>github.com/org/infra</option>
                  </select>
                </div>

                <div className="setup-section">
                  <label className="setup-label">Sound profile</label>
                  <select
                    value={selectedSound}
                    onChange={(e) => setSelectedSound(e.target.value)}
                    className="setup-select"
                  >
                    <option>Eurythmics - Sweet Dreams</option>
                    <option>Donna Summer - I Feel Love</option>
                    <option>Daft Punk - Around The World</option>
                  </select>
                </div>

                <button
                  className="btn-start-listening"
                  onClick={() => setIsListening(true)}
                >
                  <Play size={20} />
                  Start listening
                </button>
              </div>

              {/* Right Column - Past Sessions */}
              <div className="sessions-column">
                <h3 className="sessions-title">Past sessions</h3>
                <div className="sessions-list">
                  {sessions.map((session) => (
                    <div key={session.id} className="session-row">
                      <div className="session-info">
                        <span className="session-name">{session.name}</span>
                        <span className="session-source">{session.source}</span>
                      </div>
                      <div className="session-stats">
                        {session.anomalies > 0 && (
                          <span className="badge-anomalies">
                            {session.anomalies}
                          </span>
                        )}
                        <span className="session-duration">{session.duration}</span>
                      </div>
                      <div className="session-actions">
                        <button className="btn-ghost" title="Resume">
                          Resume
                        </button>
                        <button className="btn-ghost" title="Replay">
                          Replay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
