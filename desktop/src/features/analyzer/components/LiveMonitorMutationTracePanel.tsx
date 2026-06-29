import type { LibraryTrack, VisualizationCuePoint } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";
import { getTrackTitle } from "../../../utils/track";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";
import { WaveformPlaceholder } from "./WaveformPlaceholder";

interface LiveMonitorMutationTracePanelProps {
  replayActive: boolean;
  playbackEventIndex: number | null;
  traceWaveformTrack: LibraryTrack | null;
  traceWaveformExplanations: LiveMutationExplanation[];
  traceWaveformCues: VisualizationCuePoint[];
  traceWaveformCurrentTime: number;
  recentExplanations: LiveMutationExplanation[];
  selectedExplanationId: string | null;
  onSelectExplanation: (explanation: LiveMutationExplanation) => void;
}

function formatFrequency(noteHz: number): string {
  return `${Math.round(noteHz)} Hz`;
}

function formatCueGain(gain: number): string {
  return `${Math.round(gain * 100)}%`;
}

export function LiveMonitorMutationTracePanel({
  replayActive,
  playbackEventIndex,
  traceWaveformTrack,
  traceWaveformExplanations,
  traceWaveformCues,
  traceWaveformCurrentTime,
  recentExplanations,
  selectedExplanationId,
  onSelectExplanation,
}: LiveMonitorMutationTracePanelProps) {
  const t = useT();
  return (
    <>
      {traceWaveformTrack ? (
        <>
          <div className="panel-header compact top-spaced">
            <div>
              <h2>{t.inspect.mutationMapTitle}</h2>
              <p className="support-copy">{t.inspect.mutationMapCopy}</p>
            </div>
          </div>
          <div className="audio-path-card">
            <span>{t.inspect.mappedBaseTrack}</span>
            <strong>{getTrackTitle(traceWaveformTrack)}</strong>
            <small>
              {traceWaveformExplanations.length > 0
                ? t.inspect.mutationMarkersPinned.replace(
                    "{count}",
                    String(traceWaveformExplanations.length),
                  )
                : replayActive
                  ? t.inspect.replayNoMutations
                  : t.inspect.noMutationsPinned}
            </small>
          </div>
          <WaveformPlaceholder
            bins={traceWaveformTrack.analysis.waveformBins}
            beatGrid={traceWaveformTrack.analysis.beatGrid}
            durationSeconds={traceWaveformTrack.analysis.durationSeconds}
            hotCues={traceWaveformCues}
            currentTime={traceWaveformCurrentTime}
          />
        </>
      ) : null}

      <div className="panel-header compact top-spaced">
        <div>
          <h2>{t.inspect.mutationTraceTitle}</h2>
          <p className="support-copy">
            {replayActive ? t.inspect.mutationTraceReplayCopy : t.inspect.mutationTraceLiveCopy}
          </p>
        </div>
      </div>

      {recentExplanations.length > 0 ? (
        <div className="mutation-trace-grid">
          {recentExplanations.map((explanation) => (
            <button
              key={explanation.id}
              type="button"
              className={`mutation-trace-card route-${explanation.routeKey}${
                explanation.isAnomalyDriven ? " anomaly-driven" : ""
              }${
                replayActive &&
                explanation.replayWindowIndex !== null &&
                explanation.replayWindowIndex === playbackEventIndex
                  ? " window-active"
                  : ""
              }${selectedExplanationId === explanation.id ? " active" : ""}`}
              onClick={() => onSelectExplanation(explanation)}
            >
              <div className="mutation-trace-head">
                <span>
                  {t.inspect.eventLabel.replace("{index}", String(explanation.eventIndex))} ·{" "}
                  {explanation.level}
                </span>
                <strong>{explanation.component}</strong>
              </div>
              <div className="mutation-trace-section">
                <small>{t.inspect.sourceTrigger}</small>
                <strong>{explanation.triggerLabel}</strong>
                <p>{explanation.triggerDetail}</p>
              </div>
              <div className="mutation-trace-section">
                <small>{t.inspect.musicalResult}</small>
                <strong>{explanation.resultLabel}</strong>
                <p>{explanation.resultDetail}</p>
              </div>
              <div className="mutation-trace-meta">
                {replayActive && explanation.replayWindowIndex !== null ? (
                  <span>
                    {t.inspect.replayWindowShort.replace(
                      "{index}",
                      String(explanation.replayWindowIndex),
                    )}
                  </span>
                ) : null}
                {explanation.trackTitle ? <span>{explanation.trackTitle}</span> : null}
                {typeof explanation.trackSecond === "number" ? (
                  <span>{explanation.trackSecond.toFixed(2)}s</span>
                ) : null}
                <span>{formatFrequency(explanation.noteHz)}</span>
                <span>{explanation.durationMs} ms</span>
                <span>{formatCueGain(explanation.gain)}</span>
                <span>{explanation.waveform}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>{t.inspect.noMutationTrace}</p>
        </div>
      )}
    </>
  );
}
