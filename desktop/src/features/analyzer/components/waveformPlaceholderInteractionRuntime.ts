import type { BeatGridPoint } from "../../../types/library";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import { selectBeatGridPhrase } from "../../../utils/beatGrid";
import { hasUsableBeatGrid, resolveTrackPlacementSecond } from "../../../utils/track";
import type { DragTarget } from "./waveformPlaceholderRuntime";

export interface WaveformStageRectLike {
  left: number;
  width: number;
}

export function resolveWaveformSecondFromClientX(input: {
  clientX: number;
  stageRect: WaveformStageRectLike | null;
  durationSeconds: number | null;
}): number | null {
  if (!input.durationSeconds || input.durationSeconds <= 0 || !input.stageRect) {
    return null;
  }

  const clickX = input.clientX - input.stageRect.left;
  const percentage = Math.max(0, Math.min(1, clickX / input.stageRect.width));
  return percentage * input.durationSeconds;
}

export function resolveWaveformDragEditSecond(input: {
  rawSecond: number;
  dragTarget: DragTarget;
  durationSeconds: number | null;
  beatGrid: BeatGridPoint[];
}): number {
  const usableBeatGrid = hasUsableBeatGrid(input.beatGrid);
  const placementSecond =
    input.dragTarget.type === "loop"
      ? input.rawSecond - input.dragTarget.pointerOffsetSecond
      : input.rawSecond;

  return resolveTrackPlacementSecond(
    placementSecond,
    input.durationSeconds,
    input.beatGrid,
    usableBeatGrid,
  );
}

export function shouldFlagWaveformDragMoved(
  startClientX: number | null,
  nextClientX: number,
  threshold = 3,
): boolean {
  return startClientX !== null && Math.abs(nextClientX - startClientX) > threshold;
}

export type WaveformClickAction =
  | { action: "noop" }
  | { action: "downbeat"; second: number }
  | { action: "phrase"; range: BeatGridPhraseRange | null }
  | { action: "seek"; second: number };

export function resolveWaveformClickAction(input: {
  clientX: number;
  stageRect: WaveformStageRectLike | null;
  durationSeconds: number | null;
  gridClickArmed: boolean;
  phraseSelectArmed: boolean;
  beatGrid: BeatGridPoint[];
  phraseBeatCount: number;
}): WaveformClickAction {
  const second = resolveWaveformSecondFromClientX({
    clientX: input.clientX,
    stageRect: input.stageRect,
    durationSeconds: input.durationSeconds,
  });
  if (second === null) {
    return { action: "noop" };
  }

  if (input.gridClickArmed) {
    return { action: "downbeat", second };
  }

  if (input.phraseSelectArmed) {
    return {
      action: "phrase",
      range: selectBeatGridPhrase(
        second,
        input.beatGrid,
        input.durationSeconds,
        input.phraseBeatCount,
      ),
    };
  }

  return { action: "seek", second };
}
