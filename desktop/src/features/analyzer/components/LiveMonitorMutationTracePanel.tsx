import type { LibraryTrack, VisualizationCuePoint } from "../../../types/library";
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
  return (
    <>
      {traceWaveformTrack ? (
        <>
          <div className="panel-header compact top-spaced">
            <div>
              <h2>Base track mutation map</h2>
              <p className="support-copy">
                Recent mutations pinned to the current base track so the team can see where each
                source event landed on the groove.
              </p>
            </div>
          </div>
          <div className="audio-path-card">
            <span>Mapped base track</span>
            <strong>{getTrackTitle(traceWaveformTrack)}</strong>
            <small>
              {traceWaveformExplanations.length > 0
                ? `${traceWaveformExplanations.length} mutation markers pinned to this track.`
                : replayActive
                  ? "Replay is running, but no stored mutations have been pinned to the current base track yet."
                  : "No mutation markers pinned yet for the current base track."}
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
          <h2>Mutation trace</h2>
          <p className="support-copy">
            {replayActive
              ? "Historical source windows on the left, musical consequences on the right."
              : "Why Maia changed the music in this window: source event on the left, musical consequence on the right."}
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
                  Event {explanation.eventIndex} · {explanation.level}
                </span>
                <strong>{explanation.component}</strong>
              </div>
              <div className="mutation-trace-section">
                <small>Source trigger</small>
                <strong>{explanation.triggerLabel}</strong>
                <p>{explanation.triggerDetail}</p>
              </div>
              <div className="mutation-trace-section">
                <small>Musical result</small>
                <strong>{explanation.resultLabel}</strong>
                <p>{explanation.resultDetail}</p>
              </div>
              <div className="mutation-trace-meta">
                {replayActive && explanation.replayWindowIndex !== null ? (
                  <span>W{explanation.replayWindowIndex}</span>
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
          <p>No mutation trace emitted yet.</p>
        </div>
      )}
    </>
  );
}
