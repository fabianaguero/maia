import type { LibraryTrack } from "../../../types/library";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";
import { toLiveMutationVisualizationCues } from "../../../utils/liveMutationExplainability";

export interface BuildLiveLogMonitorExplanationStateInput {
  recentExplanations: LiveMutationExplanation[];
  selectedExplanationId: string | null;
  traceWaveformTrack: LibraryTrack | null;
  replayActive: boolean;
  playbackEventIndex: number | null;
}

export function buildLiveLogMonitorExplanationState(
  input: BuildLiveLogMonitorExplanationStateInput,
) {
  const traceWaveformExplanations = input.traceWaveformTrack
    ? input.recentExplanations.filter(
        (explanation) =>
          explanation.trackId === input.traceWaveformTrack?.id &&
          typeof explanation.trackSecond === "number",
      )
    : [];
  const selectedTraceExplanation =
    traceWaveformExplanations.find(
      (explanation) => explanation.id === input.selectedExplanationId,
    ) ?? null;
  const traceWaveformCues = toLiveMutationVisualizationCues(traceWaveformExplanations);
  const currentReplayExplanation =
    input.replayActive && input.playbackEventIndex !== null
      ? ((selectedTraceExplanation?.replayWindowIndex === input.playbackEventIndex
          ? selectedTraceExplanation
          : input.recentExplanations.find(
              (explanation) => explanation.replayWindowIndex === input.playbackEventIndex,
            )) ?? null)
      : null;

  return {
    traceWaveformExplanations,
    selectedTraceExplanation,
    traceWaveformCues,
    currentReplayExplanation,
  };
}
