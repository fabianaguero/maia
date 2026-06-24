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
    <div className="waveform-bar-professional">
      <div className="bar-section status">
        <div className="pulsing-dot teal" />
        <div className="bar-info">
          <span className="bar-label">Monitoring active</span>
          <span className="bar-value">{source}</span>
        </div>
      </div>

      <div className="bar-section visualizer">
        <div className="mini-visual-channel">
          <span className="channel-tag cyan">LOG</span>
          <div className="mini-bars">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="mini-bar cyan"
                style={{ 
                  height: `${isActive ? 20 + Math.random() * 50 : 10}%`, 
                  animationDelay: `${i * 0.05}s`,
                  opacity: isActive ? 0.8 + Math.random() * 0.2 : 0.4
                }}
              />
            ))}
          </div>
        </div>
        <div className="mini-visual-channel">
          <span className="channel-tag orange">ALERT</span>
          <div className="mini-bars">
            {Array.from({ length: 12 }).map((_, i) => {
              const intensity = anomalies > 0 ? Math.min(100, 30 + anomalies * 8) : 10;
              const jitter = isActive ? (Math.random() * 20 * (anomalies > 0 ? 1.5 : 0.5)) : 0;
              return (
                <div
                  key={i}
                  className="mini-bar orange"
                  style={{ 
                    height: `${intensity + jitter}%`, 
                    animationDelay: `${i * 0.05}s`,
                    filter: anomalies > 0 ? `brightness(${1 + (anomalies * 0.1)})` : 'none'
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="bar-section metrics">
        <div className="metric-item">
          <span className="metric-val red">{anomalies}</span>
          <span className="metric-lab">Anomalies</span>
        </div>
        <div className="metric-item">
          <span className="metric-val">{uptime}</span>
          <span className="metric-lab">Uptime</span>
        </div>
      </div>

      <div className="bar-section controls">
        <button className="btn-professional-inspect" onClick={onInspect}>Inspect</button>
        <button className="btn-professional-stop" onClick={onStop}>
          <Square size={16} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
