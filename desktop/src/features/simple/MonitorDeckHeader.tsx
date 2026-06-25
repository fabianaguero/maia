import React from "react";
import { useT } from "../../i18n/I18nContext";

interface SelectedDeckMarkerViewModel {
  severity: number;
  timestamp: string;
  message: string;
}

interface MonitorDeckHeaderProps {
  monitorTrackTitle: string;
  musicStyleLabel?: string | null;
  deckBpm: number | null | undefined;
  trackElapsedSeconds: number | null;
  deckRemainingSeconds: number | null;
  selectedDeckMarker: SelectedDeckMarkerViewModel | null;
  selectedBurstCount?: number | null;
}

function formatDeckTime(seconds: number | null): string {
  if (typeof seconds !== "number" || Number.isNaN(seconds) || seconds < 0) {
    return "--:--";
  }

  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function MonitorDeckHeader({
  monitorTrackTitle,
  musicStyleLabel,
  deckBpm,
  trackElapsedSeconds,
  deckRemainingSeconds,
  selectedDeckMarker,
  selectedBurstCount,
}: MonitorDeckHeaderProps) {
  const t = useT();

  return (
    <>
      <div className="section-controls-hd monitor-deck-topbar">
        <div className="monitor-deck-heading">
          <span className="section-label-hd">{t.simpleMode.monitor.waveformTitle}</span>
          <span className="monitor-deck-trackline">
            {monitorTrackTitle || t.simpleMode.monitor.liveIngestionFallback}
            {musicStyleLabel ? ` · ${musicStyleLabel}` : ""}
          </span>
        </div>
        <div className="monitor-deck-meta">
          <div
            className="monitor-deck-legend"
            aria-label={t.simpleMode.monitor.anomalySeverityLegend}
          >
            <span className="monitor-deck-legend__item">
              <span className="monitor-deck-legend__swatch track" />
              {t.simpleMode.monitor.trackAudio}
            </span>
            <span className="monitor-deck-legend__item">
              <span className="monitor-deck-legend__swatch warn" />
              {t.simpleMode.monitor.logPressure}
            </span>
            <span className="monitor-deck-legend__item">
              <span className="monitor-deck-legend__swatch error" />
              {t.simpleMode.monitor.anomaly}
            </span>
          </div>
          <span className="monitor-deck-meta__chip">
            BPM {typeof deckBpm === "number" ? deckBpm.toFixed(0) : "--"}
          </span>
          <span className="monitor-deck-meta__chip">{formatDeckTime(trackElapsedSeconds)}</span>
          <span className="monitor-deck-meta__chip subtle">
            -{formatDeckTime(deckRemainingSeconds)}
          </span>
        </div>
      </div>
      <div className="monitor-deck-explainer" aria-hidden="true">
        <span className="monitor-deck-explainer__item">{t.simpleMode.monitor.upperLane}</span>
        <span className="monitor-deck-explainer__item">{t.simpleMode.monitor.lowerLane}</span>
      </div>
      {selectedDeckMarker ? (
        <div className="monitor-deck-focusbar">
          <span
            className={`monitor-deck-focusbar__badge${selectedDeckMarker.severity >= 0.9 ? " critical" : " warning"}`}
          >
            {selectedDeckMarker.severity >= 0.9
              ? t.simpleMode.monitor.activeAnomaly
              : t.simpleMode.monitor.activeWarning}
          </span>
          <span className="monitor-deck-focusbar__time">{selectedDeckMarker.timestamp}</span>
          <span className="monitor-deck-focusbar__text">{selectedDeckMarker.message}</span>
          {selectedBurstCount ? (
            <span className="monitor-deck-focusbar__burst">
              {t.simpleMode.monitor.burst} {selectedBurstCount}
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
