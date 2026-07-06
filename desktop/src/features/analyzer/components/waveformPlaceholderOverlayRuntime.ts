import type { AppTranslations } from "../../../i18n/types";
import type { VisualizationRegionPoint } from "../../../types/library";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import type {
  DragTarget,
  WaveformHintState,
  WaveformPlayheadOverlayState,
  WaveformSummaryPillViewModel,
} from "./waveformPlaceholderViewTypes";

export function resolveWaveformSummaryFlags(
  regions: VisualizationRegionPoint[],
  selectedPhraseRange: BeatGridPhraseRange | null,
  onSelectPhraseRange?: ((range: BeatGridPhraseRange) => void) | undefined,
) {
  return {
    showRegionSummary: regions.length > 0 || selectedPhraseRange !== null,
    showPhraseSummary: Boolean(onSelectPhraseRange || selectedPhraseRange),
  };
}

export function resolveWaveformCursor(input: {
  gridAnchorDragging: boolean;
  dragTarget: DragTarget | null;
  phraseSelectArmed: boolean;
  canSelectPhrase: boolean;
  gridClickArmed: boolean;
  canEditBeatGrid: boolean;
  onSeek?: ((second: number) => void) | undefined;
}): CSSStyleDeclaration["cursor"] {
  if (input.gridAnchorDragging || input.dragTarget) {
    return "grabbing";
  }
  if (input.phraseSelectArmed && input.canSelectPhrase) {
    return "cell";
  }
  if (input.gridClickArmed && input.canEditBeatGrid) {
    return "crosshair";
  }
  return input.onSeek ? "pointer" : "default";
}

export function resolveWaveformInteractionHints(input: {
  gridClickArmed: boolean;
  phraseSelectArmed: boolean;
  gridAnchorDragging: boolean;
  phraseBeatCount: number;
  t: AppTranslations;
}): WaveformHintState {
  return {
    gridHint: input.gridClickArmed ? input.t.inspect.clickPlaceDownbeat : null,
    phraseHint: input.phraseSelectArmed
      ? input.t.inspect.clickCapturePhrase.replace("{count}", String(input.phraseBeatCount))
      : null,
    dragHint: input.gridAnchorDragging ? input.t.inspect.draggingDownbeat : null,
  };
}

function resolveWaveformPercentPosition(
  second: number,
  durationSeconds: number | null,
): number | null {
  if (!durationSeconds || durationSeconds <= 0) {
    return null;
  }

  return Math.min(100, (second / durationSeconds) * 100);
}

export function resolveWaveformPlayheadOverlayState(input: {
  currentTime: number;
  durationSeconds: number | null;
  analysisProgress: number | null;
  t: AppTranslations;
}): WaveformPlayheadOverlayState {
  const progressPercent = resolveWaveformPercentPosition(input.currentTime, input.durationSeconds);
  const analysisEndPercent =
    input.analysisProgress !== null &&
    input.analysisProgress < 1 &&
    input.durationSeconds &&
    input.durationSeconds > 0
      ? Math.min(100, input.analysisProgress * 100)
      : null;

  return {
    progressPercent,
    analysisEndPercent,
    analysisEndTitle:
      analysisEndPercent !== null
        ? input.t.inspect.analysisCompletePoint.replace(
            "{progress}",
            String(Math.round(input.analysisProgress! * 100)),
          )
        : null,
  };
}

export function buildWaveformSummaryPills(input: {
  visibleBeatsCount: number;
  showRegionSummary: boolean;
  regionsCount: number;
  selectedPhraseRange: BeatGridPhraseRange | null;
  displayBinsCount: number;
  gridAnchorDragging: boolean;
  gridClickArmed: boolean;
  phraseSelectArmed: boolean;
  showPhraseSummary: boolean;
  t: AppTranslations;
}): WaveformSummaryPillViewModel[] {
  const pills: WaveformSummaryPillViewModel[] = [
    {
      key: "visible-beats",
      label: input.t.inspect.visibleBeats,
      value: String(input.visibleBeatsCount),
    },
    {
      key: "regions",
      label: input.showRegionSummary ? input.t.inspect.regions : input.t.inspect.resolution,
      value: input.showRegionSummary
        ? String(input.regionsCount + (input.selectedPhraseRange ? 1 : 0))
        : `${input.displayBinsCount} bins`,
    },
    {
      key: "grid-state",
      label: input.t.inspect.gridState,
      value: input.gridAnchorDragging
        ? input.t.inspect.dragging
        : input.gridClickArmed
          ? input.t.inspect.armed
          : input.visibleBeatsCount > 0
            ? input.t.inspect.aligned
            : input.t.inspect.pending,
    },
  ];

  if (input.showPhraseSummary) {
    pills.push({
      key: "phrase",
      label: input.t.inspect.phrase,
      value: input.selectedPhraseRange
        ? `${input.selectedPhraseRange.label} · ${input.selectedPhraseRange.beatCount} beats`
        : input.phraseSelectArmed
          ? input.t.inspect.armed
          : input.t.inspect.none,
    });
  }

  return pills;
}
