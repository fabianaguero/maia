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
                style={{ height: `${Math.random() * 60 + 20}%`, animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
        </div>
        <div className="mini-visual-channel">
          <span className="channel-tag orange">ALERT</span>
          <div className="mini-bars">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="mini-bar orange"
                style={{ height: `${anomalies > 0 ? Math.random() * 80 + 20 : 10}%`, animationDelay: `${i * 0.05}s` }}
              />
            ))}
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
