import { Dot, Square } from "lucide-react";

interface WaveformBarProps {
  isActive?: boolean;
  source?: string;
  anomalies?: number;
  uptime?: string;
  onStop?: () => void;
  onInspect?: () => void;
}

export function WaveformBar({
  isActive = true,
  source = "payments-api",
  anomalies = 4,
  uptime = "12m 34s",
  onStop,
  onInspect,
}: WaveformBarProps) {
  if (!isActive) return null;

  return (
    <div className="waveform-bar">
      {/* Left Section */}
      <div className="waveform-bar-left">
        <div className="status-indicator">
          <Dot size={10} className="pulsing-dot teal" />
        </div>
        <div className="status-info">
          <span className="status-label">Monitoring active</span>
          <span className="source-name">{source}</span>
        </div>
      </div>

      {/* Center Section - Waveforms */}
      <div className="waveform-bar-center">
        <div className="waveform-channel-mini">
          <span className="channel-label-mini cyan">LOG</span>
          <span className="channel-description">RAW SIGNAL</span>
          <div className="waveform-bars-mini">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`log-${i}`}
                className="waveform-bar-mini cyan"
                style={{
                  height: `${Math.random() * 70 + 30}%`,
                  animationDelay: `${i * 0.075}s`,
                }}
              ></div>
            ))}
          </div>
        </div>

        <div className="waveform-channel-mini">
          <span className="channel-label-mini orange">ALERT</span>
          <span className="channel-description">ANOMALY DETECTION</span>
          <div className="waveform-bars-mini">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`alert-${i}`}
                className="waveform-bar-mini orange"
                style={{
                  height: `${[30, 20, 15, 60, 80, 40, 25, 35][i]}%`,
                  animationDelay: `${i * 0.075}s`,
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="waveform-bar-right">
        <div className="bar-metrics">
          {anomalies > 0 && (
            <span className="metric-anomalies">{anomalies} anomalies</span>
          )}
          <span className="metric-uptime">{uptime}</span>
        </div>
        <div className="bar-actions">
          <button
            className="btn-bar-inspect"
            onClick={onInspect}
            title="Inspect"
          >
            Inspect
          </button>
          <button
            className="btn-bar-stop"
            onClick={onStop}
            title="Stop monitoring"
          >
            <Square size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
