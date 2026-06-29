import type {
  BeatGridPoint,
  TrackSavedLoop,
  VisualizationCuePoint,
  VisualizationRegionPoint,
} from "../../../types/library";
import { deriveBeatGridGuideMarkers, type BeatGridPhraseRange } from "../../../utils/beatGrid";

export interface WaveformEditableCuePoint {
  id: string;
  second: number;
  label: string;
  kind: "main" | "hot" | "memory";
  color?: string | null;
}

export type DragTarget =
  | {
      type: "cue";
      cue: WaveformEditableCuePoint;
    }
  | {
      type: "loop";
      loopId: string;
      startSecond: number;
      endSecond: number;
      pointerOffsetSecond: number;
    }
  | {
      type: "loop-boundary";
      loopId: string;
      boundary: "start" | "end";
    };

export interface RenderedCueMarker {
  key: string;
  second: number;
  label: string;
  type: string;
  excerpt?: string;
  interactiveCue: WaveformEditableCuePoint | null;
}

export interface RenderedRegion extends VisualizationRegionPoint {
  editableLoop: TrackSavedLoop | undefined;
}

export function formatDuration(durationSeconds: number | null): string {
  if (!durationSeconds) {
    return "--:--";
  }

  const totalSeconds = Math.round(durationSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function resolveDisplayBins(bins: number[]): number[] {
  const normalizedBins =
    bins.length > 0
      ? bins
      : Array.from({ length: 128 }, (_, index) => {
          const cycle = (index % 16) / 16;
          return Number((0.3 + Math.sin(cycle * Math.PI) * 0.6).toFixed(3));
        });

  return normalizedBins.length < 128
    ? Array.from(
        { length: 128 },
        (_, index) => normalizedBins[Math.floor((index / 128) * normalizedBins.length)] || 0.3,
      )
    : normalizedBins;
}

export function resolveVisibleBeats(beatGrid: BeatGridPoint[], durationSeconds: number | null) {
  return durationSeconds && durationSeconds > 0
    ? deriveBeatGridGuideMarkers(beatGrid, durationSeconds)
    : [];
}

export function resolveAnchorPosition(input: {
  dragAnchorSecond: number | null;
  durationSeconds: number | null;
  visibleBeats: Array<{ second: number }>;
}): { anchorSecond: number | null; anchorPosition: number | null } {
  const anchorSecond = input.dragAnchorSecond ?? input.visibleBeats[0]?.second ?? null;
  const anchorPosition =
    anchorSecond !== null && input.durationSeconds && input.durationSeconds > 0
      ? Math.min(100, (anchorSecond / input.durationSeconds) * 100)
      : null;

  return { anchorSecond, anchorPosition };
}

export function buildRenderedCueMarkers(input: {
  editableCues: WaveformEditableCuePoint[];
  hotCues: VisualizationCuePoint[];
  dragTarget: DragTarget | null;
  dragEditSecond: number | null;
}): RenderedCueMarker[] {
  const { editableCues, hotCues, dragTarget, dragEditSecond } = input;

  return editableCues.length > 0
    ? editableCues.map((cue) => ({
        key: cue.id,
        second:
          dragTarget?.type === "cue" && dragTarget.cue.id === cue.id && dragEditSecond !== null
            ? dragEditSecond
            : cue.second,
        label: cue.label,
        type: cue.kind,
        excerpt: cue.kind === "main" ? "Main cue" : undefined,
        interactiveCue: cue,
      }))
    : hotCues.map((cue, index) => ({
        key: `${index}-${cue.second}`,
        second: cue.second,
        label: cue.label,
        type: cue.type,
        excerpt: cue.excerpt,
        interactiveCue: null,
      }));
}

export function buildRenderedRegions(input: {
  regions: VisualizationRegionPoint[];
  editableLoops: TrackSavedLoop[];
  dragTarget: DragTarget | null;
  dragEditSecond: number | null;
  durationSeconds: number | null;
}): RenderedRegion[] {
  const { regions, editableLoops, dragTarget, dragEditSecond, durationSeconds } = input;

  return regions.map((region) => {
    const editableLoop = editableLoops.find((loop) => loop.id === region.id);
    const loopSpan = editableLoop
      ? editableLoop.endSecond - editableLoop.startSecond
      : region.endSecond - region.startSecond;
    const previewLoopStart =
      dragTarget?.type === "loop" && dragTarget.loopId === region.id && dragEditSecond !== null
        ? durationSeconds && durationSeconds > 0
          ? Math.min(dragEditSecond, Math.max(0, durationSeconds - loopSpan))
          : dragEditSecond
        : null;
    const startSecond =
      previewLoopStart !== null
        ? previewLoopStart
        : dragTarget?.type === "loop-boundary" &&
            dragTarget.loopId === region.id &&
            dragTarget.boundary === "start" &&
            dragEditSecond !== null
          ? Math.min(dragEditSecond, region.endSecond)
          : region.startSecond;
    const endSecond =
      previewLoopStart !== null
        ? durationSeconds && durationSeconds > 0
          ? Math.min(durationSeconds, previewLoopStart + loopSpan)
          : previewLoopStart + loopSpan
        : dragTarget?.type === "loop-boundary" &&
            dragTarget.loopId === region.id &&
            dragTarget.boundary === "end" &&
            dragEditSecond !== null
          ? Math.max(dragEditSecond, region.startSecond)
          : region.endSecond;

    return {
      ...region,
      startSecond,
      endSecond,
      editableLoop,
    };
  });
}

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
