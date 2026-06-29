import { Square } from "lucide-react";
import { useT } from "../i18n/I18nContext";
import { buildWaveformBarViewModel } from "./waveformBarRuntime";

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
  source,
  anomalies,
  uptime,
  onStop,
  onInspect,
}: WaveformBarProps) {
  const t = useT();
  const viewModel = buildWaveformBarViewModel({
    t,
    isActive,
    source,
    anomalies,
    uptime,
  });
  if (!viewModel) return null;

  return (
    <div className="waveform-bar-professional">
      <div className="bar-section status">
        <div className="pulsing-dot teal" />
        <div className="bar-info">
          <span className="bar-label">{t.simpleMode.shell.monitoringActive}</span>
          <span className="bar-value">{viewModel.sourceLabel}</span>
        </div>
      </div>

      <div className="bar-section visualizer">
        <div className="mini-visual-channel">
          <span className="channel-tag cyan">{t.simpleMode.shell.logChannel}</span>
          <div className="mini-bars">
            {viewModel.logBars.map((style, i) => (
              <div key={i} className="mini-bar cyan" style={style} />
            ))}
          </div>
        </div>
        <div className="mini-visual-channel">
          <span className="channel-tag orange">{t.simpleMode.shell.alertChannel}</span>
          <div className="mini-bars">
            {viewModel.alertBars.map((style, i) => (
              <div key={i} className="mini-bar orange" style={style} />
            ))}
          </div>
        </div>
      </div>

      <div className="bar-section metrics">
        <div className="metric-item">
          <span className="metric-val red">{viewModel.anomaliesValue}</span>
          <span className="metric-lab">{t.simpleMode.monitor.anomalies}</span>
        </div>
        <div className="metric-item">
          <span className="metric-val">{viewModel.uptimeLabel}</span>
          <span className="metric-lab">{t.simpleMode.monitor.uptime}</span>
        </div>
      </div>

      <div className="bar-section controls">
        <button type="button" className="btn-professional-inspect" onClick={onInspect}>
          {t.simpleMode.common.inspect}
        </button>
        <button
          type="button"
          className="btn-professional-stop"
          onClick={onStop}
          aria-label={t.simpleMode.common.stop}
          title={t.simpleMode.common.stop}
        >
          <Square size={16} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
