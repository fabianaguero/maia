import type {
  TrackSavedLoop,
  VisualizationCuePoint,
  VisualizationRegionPoint,
} from "../../../types/library";
import type {
  DragTarget,
  RenderedCueMarker,
  RenderedRegion,
  WaveformEditableCuePoint,
} from "./waveformPlaceholderViewTypes";

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
