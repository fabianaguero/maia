import { useT } from "../i18n/I18nContext";

import type { HUDLine } from "./monitorWaveformBarRuntime";

export function MonitorWaveformBarTailHud({ hudLines }: { hudLines: HUDLine[] }) {
  const t = useT();

  return (
    <div className="monitor-waveform-tail-hud compact kinetic-tail real-tail">
      {hudLines.map((line) => (
        <div
          key={line.id}
          className={`monitor-waveform-tail-line${line.heat > 0.3 ? " is-anomaly" : ""}`}
        >
          <span className="line-bullet">⏵</span>
          <span className="line-content">{line.content}</span>
        </div>
      ))}
      {hudLines.length === 0 && (
        <div className="hud-placeholder">{t.simpleMode.monitor.waitingTelemetryStream}</div>
      )}
    </div>
  );
}
