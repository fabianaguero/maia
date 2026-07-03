import type { VisualizationRegionPoint } from "../../../types/library";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import {
  resolveAnchorPosition,
  resolveDisplayBins,
  resolveVisibleBeats,
  resolveWaveformSummaryFlags,
} from "./waveformPlaceholderRuntime";
import type { BuildWaveformPlaceholderViewModelInput } from "./waveformPlaceholderViewModelTypes";

export interface WaveformPlaceholderDerivedState {
  displayBins: number[];
  visibleBeats: ReturnType<typeof resolveVisibleBeats>;
  anchorSecond: number | null;
  anchorPosition: number | null;
  showRegionSummary: boolean;
  showPhraseSummary: boolean;
}

export function buildWaveformPlaceholderDerivedState(
  input: Pick<
    BuildWaveformPlaceholderViewModelInput,
    | "bins"
    | "beatGrid"
    | "durationSeconds"
    | "regions"
    | "selectedPhraseRange"
    | "onSelectPhraseRange"
    | "interactions"
  >,
): WaveformPlaceholderDerivedState {
  const displayBins = resolveDisplayBins(input.bins);
  const visibleBeats = resolveVisibleBeats(input.beatGrid, input.durationSeconds);
  const anchorState = resolveAnchorPosition({
    dragAnchorSecond: input.interactions.dragAnchorSecond,
    durationSeconds: input.durationSeconds,
    visibleBeats,
  });
  const summaryFlags = resolveWaveformSummaryFlags(
    input.regions as VisualizationRegionPoint[],
    input.selectedPhraseRange as BeatGridPhraseRange | null,
    input.onSelectPhraseRange,
  );

  return {
    displayBins,
    visibleBeats,
    anchorSecond: anchorState.anchorSecond,
    anchorPosition: anchorState.anchorPosition,
    showRegionSummary: summaryFlags.showRegionSummary,
    showPhraseSummary: summaryFlags.showPhraseSummary,
  };
}
