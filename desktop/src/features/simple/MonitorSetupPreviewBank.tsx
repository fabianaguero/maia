import type { AppTranslations } from "../../i18n/types";
import type { MonitorSetupPreviewMeterViewModel } from "./monitorSetupViewModel";

interface MonitorSetupPreviewBankProps {
  t: AppTranslations;
  meters: MonitorSetupPreviewMeterViewModel[];
}

export function MonitorSetupPreviewBank({ t, meters }: MonitorSetupPreviewBankProps) {
  return (
    <div className="monitor-setup-screen__preview-bank">
      <div className="monitor-setup-screen__preview-copy">
        <span className="monitor-setup-screen__rack-kicker">
          {t.simpleMode.deckSetup.livePreview}
        </span>
        <strong>{t.simpleMode.deckSetup.livePreviewTitle}</strong>
        <span
          className="monitor-setup-screen__microcopy"
          title={t.simpleMode.deckSetup.livePreviewDescription}
        >
          {t.simpleMode.deckSetup.livePreviewHint}
        </span>
      </div>

      <div className="monitor-setup-screen__preview-meters" role="list">
        {meters.map((meter) => (
          <div key={meter.key} className="monitor-setup-screen__preview-meter" role="listitem">
            <div className="monitor-setup-screen__preview-meter-bar">
              <span
                className="monitor-setup-screen__preview-meter-fill"
                style={{ height: `${Math.max(10, meter.value)}%` }}
              />
            </div>
            <strong>{meter.value}%</strong>
            <span>{meter.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
