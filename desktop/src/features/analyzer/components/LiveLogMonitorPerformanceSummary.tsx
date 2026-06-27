import type { ReactNode } from "react";

import type { LiveLogMarker } from "../../../types/library";
import type {
  ArrangementTrack,
  ArrangementVoice,
  RoutedLiveCue,
} from "./liveSonificationScene";
import { formatFrequency } from "./liveLogMonitorPanelRuntime";

interface LiveLogMonitorPerformanceSummaryLabels {
  arrangementLayers: string;
  arrangementLayersCopy: string;
  noArrangementVoices: string;
  padSequencerTitle: string;
  padSequencerCopy: string;
  recentCuesTitle: string;
  recentCuesCopy: string;
  noLiveCues: string;
  recentAnomalyMarkersTitle: string;
  recentAnomalyMarkersCopy: string;
  eventLabel: string;
  noAnomalyMarkersSession: string;
  monitorNotesTitle: string;
  monitorNotesCopy: string;
  runtimeError: string;
  monitorNoteLabel: string;
}

interface LiveLogMonitorPerformanceSummaryProps {
  recentVoices: ArrangementVoice[];
  recentCues: RoutedLiveCue[];
  recentMarkers: LiveLogMarker[];
  recentWarnings: string[];
  error: string | null;
  sequencerPanel: ReactNode;
  labels: LiveLogMonitorPerformanceSummaryLabels;
}

const ARRANGEMENT_TRACKS: ArrangementTrack[] = ["foundation", "motion", "accent"];

export function LiveLogMonitorPerformanceSummary({
  recentVoices,
  recentCues,
  recentMarkers,
  recentWarnings,
  error,
  sequencerPanel,
  labels,
}: LiveLogMonitorPerformanceSummaryProps) {
  return (
    <>
      <div className="panel-header compact top-spaced">
        <div>
          <h2>{labels.arrangementLayers}</h2>
          <p className="support-copy">{labels.arrangementLayersCopy}</p>
        </div>
      </div>

      {recentVoices.length > 0 ? (
        <div className="arrangement-lane-grid">
          {ARRANGEMENT_TRACKS.map((track) => {
            const trackVoices = recentVoices.filter((voice) => voice.track === track);
            return (
              <div key={track} className={`arrangement-lane arrangement-lane--${track}`}>
                <span className="arrangement-lane-label">{track}</span>
                <div className="arrangement-lane-chips">
                  {trackVoices.map((voice, index) => (
                    <span key={`${track}-${index}`} className="arrangement-lane-chip">
                      {voice.cue.component} · {voice.cue.routeLabel}
                    </span>
                  ))}
                  {trackVoices.length === 0 ? (
                    <span className="arrangement-lane-empty">—</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <p>{labels.noArrangementVoices}</p>
        </div>
      )}

      <div className="panel-header compact top-spaced">
        <div>
          <h2>{labels.padSequencerTitle}</h2>
          <p className="support-copy">{labels.padSequencerCopy}</p>
        </div>
      </div>

      {sequencerPanel}

      <div className="panel-header compact top-spaced">
        <div>
          <h2>{labels.recentCuesTitle}</h2>
          <p className="support-copy">{labels.recentCuesCopy}</p>
        </div>
      </div>

      {recentCues.length > 0 ? (
        <div className="cue-pill-strip">
          {recentCues.map((cue) => (
            <article key={cue.id} className="cue-pill">
              <span>
                {cue.level} · {cue.waveform} · {cue.routeLabel}
              </span>
              <strong>{cue.component}</strong>
              <small>
                {formatFrequency(cue.noteHz)} · {cue.durationMs} ms
              </small>
              <small>
                {cue.stemLabel} · {cue.sectionLabel}
              </small>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>{labels.noLiveCues}</p>
        </div>
      )}

      <div className="panel-header compact top-spaced">
        <div>
          <h2>{labels.recentAnomalyMarkersTitle}</h2>
          <p className="support-copy">{labels.recentAnomalyMarkersCopy}</p>
        </div>
      </div>

      {recentMarkers.length > 0 ? (
        <ul className="stack-list">
          {recentMarkers.map((marker) => (
            <li key={`${marker.eventIndex}-${marker.component}-${marker.level}`}>
              <strong>
                {labels.eventLabel.replace("{index}", String(marker.eventIndex))} · {marker.level} ·{" "}
                {marker.component}
              </strong>
              <small>{marker.excerpt}</small>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <p>{labels.noAnomalyMarkersSession}</p>
        </div>
      )}

      {recentWarnings.length > 0 || error ? (
        <>
          <div className="panel-header compact top-spaced">
            <div>
              <h2>{labels.monitorNotesTitle}</h2>
              <p className="support-copy">{labels.monitorNotesCopy}</p>
            </div>
          </div>
          <ul className="stack-list live-log-warning-list">
            {error ? (
              <li key="live-log-error">
                <strong>{labels.runtimeError}</strong>
                <small>{error}</small>
              </li>
            ) : null}
            {recentWarnings.map((warning) => (
              <li key={warning}>
                <strong>{labels.monitorNoteLabel}</strong>
                <small>{warning}</small>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
