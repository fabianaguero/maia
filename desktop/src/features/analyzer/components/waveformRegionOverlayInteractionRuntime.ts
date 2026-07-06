import type { BeatGridPoint } from "../../../types/library";
import { nudgeTrackSecond } from "../../../utils/track";

export function shouldSuppressWaveformRegionClick(dragMoved: boolean) {
  return dragMoved;
}

export function resolveWaveformRegionPointerOffset(input: {
  clickedSecond: number | null;
  regionStartSecond: number;
}) {
  return input.clickedSecond === null ? 0 : input.clickedSecond - input.regionStartSecond;
}

export function resolveWaveformRegionNudgeSecond(input: {
  second: number;
  direction: -1 | 1;
  durationSeconds: number | null;
  beatGrid: BeatGridPoint[];
  coarse: boolean;
  freeSlip: boolean;
}) {
  return nudgeTrackSecond(input.second, input.direction, {
    durationSeconds: input.durationSeconds,
    beatGrid: input.beatGrid,
    coarse: input.coarse,
    freeSlip: input.freeSlip,
  });
}
