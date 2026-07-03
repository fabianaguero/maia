import {
  buildRenderedCueMarkers,
  buildRenderedRegions,
  buildWaveformSummaryPills,
  resolveWaveformCursor,
  resolveWaveformInteractionHints,
  resolveWaveformPlayheadOverlayState,
} from "./waveformPlaceholderRuntime";
import type {
  BuildWaveformPlaceholderViewModelInput,
  WaveformPlaceholderDerivedViewModel,
} from "./waveformPlaceholderViewModelTypes";

export function buildWaveformPlaceholderVisualState(
  input: Pick<
    BuildWaveformPlaceholderViewModelInput,
    | "t"
    | "hotCues"
    | "regions"
    | "editableCues"
    | "editableLoops"
    | "currentTime"
    | "durationSeconds"
    | "analysisProgress"
    | "canEditBeatGrid"
    | "canSelectPhrase"
    | "selectedPhraseRange"
    | "onSeek"
    | "phraseBeatCount"
    | "interactions"
  > &
    Pick<
      WaveformPlaceholderDerivedViewModel,
      "displayBins" | "visibleBeats" | "showRegionSummary" | "showPhraseSummary"
    >,
): Pick<
  WaveformPlaceholderDerivedViewModel,
  | "renderedCueMarkers"
  | "renderedRegions"
  | "interactionHints"
  | "playheadOverlay"
  | "summaryPills"
  | "cursor"
> {
  const renderedCueMarkers = buildRenderedCueMarkers({
    editableCues: input.editableCues,
    hotCues: input.hotCues,
    dragTarget: input.interactions.dragTarget,
    dragEditSecond: input.interactions.dragEditSecond,
  });
  const renderedRegions = buildRenderedRegions({
    regions: input.regions,
    editableLoops: input.editableLoops,
    dragTarget: input.interactions.dragTarget,
    dragEditSecond: input.interactions.dragEditSecond,
    durationSeconds: input.durationSeconds,
  });
  const interactionHints = resolveWaveformInteractionHints({
    gridClickArmed: input.interactions.gridClickArmed,
    phraseSelectArmed: input.interactions.phraseSelectArmed,
    gridAnchorDragging: input.interactions.gridAnchorDragging,
    phraseBeatCount: input.phraseBeatCount,
    t: input.t,
  });
  const playheadOverlay = resolveWaveformPlayheadOverlayState({
    currentTime: input.currentTime,
    durationSeconds: input.durationSeconds,
    analysisProgress: input.analysisProgress,
    t: input.t,
  });
  const summaryPills = buildWaveformSummaryPills({
    visibleBeatsCount: input.visibleBeats.length,
    showRegionSummary: input.showRegionSummary,
    regionsCount: input.regions.length,
    selectedPhraseRange: input.selectedPhraseRange,
    displayBinsCount: input.displayBins.length,
    gridAnchorDragging: input.interactions.gridAnchorDragging,
    gridClickArmed: input.interactions.gridClickArmed,
    phraseSelectArmed: input.interactions.phraseSelectArmed,
    showPhraseSummary: input.showPhraseSummary,
    t: input.t,
  });
  const cursor = resolveWaveformCursor({
    gridAnchorDragging: input.interactions.gridAnchorDragging,
    dragTarget: input.interactions.dragTarget,
    phraseSelectArmed: input.interactions.phraseSelectArmed,
    canSelectPhrase: input.canSelectPhrase,
    gridClickArmed: input.interactions.gridClickArmed,
    canEditBeatGrid: input.canEditBeatGrid,
    onSeek: input.onSeek,
  });

  return {
    renderedCueMarkers,
    renderedRegions,
    interactionHints,
    playheadOverlay,
    summaryPills,
    cursor,
  };
}
