import React from "react";
import { AlertTriangle } from "lucide-react";
import { useT } from "../../i18n/I18nContext";
import type {
  MonitorLegendItemViewModel,
  MonitorMetaChipViewModel,
} from "./activeMonitorDeckViewModel";
import { formatAnomalyCueCode } from "./monitorDisplay";

interface MonitorDeckHeaderProps {
  deckTrackLine: string;
  logSourceLine: string;
  legendItems: MonitorLegendItemViewModel[];
  metaChips: MonitorMetaChipViewModel[];
  focusBadgeLabel: string | null;
  focusBadgeTone: "warning" | "critical" | null;
  focusTimestamp: string | null;
  focusMessage: string | null;
  focusCueCode: string | null;
  focusBurstLabel: string | null;
}

export function MonitorDeckHeader({
  deckTrackLine,
  logSourceLine,
  legendItems,
  metaChips,
  focusBadgeLabel,
  focusBadgeTone,
  focusTimestamp,
  focusMessage,
  focusCueCode,
  focusBurstLabel,
}: MonitorDeckHeaderProps) {
  const t = useT();

  return (
    <>
      <div className="section-controls-hd monitor-deck-topbar">
        <div className="monitor-deck-heading">
          <span className="section-label-hd">{t.simpleMode.monitor.waveformTitle}</span>
          <div className="monitor-deck-source-strip">
            <div className="monitor-deck-source-card track">
              <span className="monitor-deck-source-card__label">
                {t.simpleMode.monitor.trackAudio}
              </span>
              <span className="monitor-deck-source-card__value">{deckTrackLine}</span>
            </div>
            <div className="monitor-deck-source-card log">
              <span className="monitor-deck-source-card__label">
                {t.simpleMode.monitor.logStream}
              </span>
              <span className="monitor-deck-source-card__value">{logSourceLine}</span>
            </div>
          </div>
        </div>
        <div className="monitor-deck-meta">
          <div className="monitor-deck-legend" aria-label={t.simpleMode.monitor.anomalySeverityLegend}>
            {legendItems.map((item) => (
              <span key={item.key} className="monitor-deck-legend__item">
                <span className={`monitor-deck-legend__swatch ${item.tone}`} />
                {item.label}
              </span>
            ))}
          </div>
          {metaChips.map((chip) => (
            <span key={chip.key} className={`monitor-deck-meta__chip${chip.subtle ? " subtle" : ""}`}>
              {chip.label}
            </span>
          ))}
        </div>
      </div>
      {focusBadgeLabel && focusTimestamp && focusMessage ? (
        <div
          className={`monitor-deck-focusbar${focusBadgeTone === "critical" ? " critical" : " warning"}`}
        >
          <span className="monitor-deck-focusbar__signal" aria-hidden="true" />
          <div className="monitor-deck-focusbar__event">
            <span
              className={`monitor-deck-focusbar__badge${focusBadgeTone === "critical" ? " critical" : " warning"}`}
            >
              <AlertTriangle size={11} />
              {focusBadgeLabel}
            </span>
            <span className="monitor-deck-focusbar__time">{focusTimestamp}</span>
            <span className="monitor-deck-focusbar__cue">
              {formatAnomalyCueCode(focusCueCode)}
            </span>
          </div>
          <span className="monitor-deck-focusbar__text">{focusMessage}</span>
          {focusBurstLabel ? (
            <span className="monitor-deck-focusbar__burst">{focusBurstLabel}</span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
