import type { AppTranslations } from "../../../i18n/en";
import type { BeatGridPoint } from "../../../types/library";
import { nudgeTrackSecond } from "../../../utils/track";
import type {
  DragTarget,
  RenderedCueMarker,
  WaveformEditableCuePoint,
} from "./waveformPlaceholderRuntime";

export interface WaveformCueOverlayMarkerViewModel {
  key: string;
  label: string;
  typeClassName: string;
  dragging: boolean;
  position: number;
  title: string;
  ariaLabel: string;
  disabled: boolean;
  second: number;
  interactiveCue: WaveformEditableCuePoint | null;
}

export function buildWaveformCueOverlayMarkers(input: {
  renderedCueMarkers: RenderedCueMarker[];
  dragTarget: DragTarget | null;
  durationSeconds: number | null;
  onSeek?: ((second: number) => void) | undefined;
  t: AppTranslations;
}): WaveformCueOverlayMarkerViewModel[] {
  return input.renderedCueMarkers.map((cue) => ({
    key: cue.key,
    label: cue.label,
    typeClassName: cue.type.toLowerCase(),
    dragging: input.dragTarget?.type === "cue" && input.dragTarget.cue.id === cue.key,
    position:
      input.durationSeconds && input.durationSeconds > 0
        ? Math.min(100, (cue.second / input.durationSeconds) * 100)
        : 0,
    title: cue.excerpt ? `${cue.label}: ${cue.excerpt}` : cue.label,
    ariaLabel: input.t.inspect.seekToCue.replace("{label}", cue.label),
    disabled: !input.onSeek,
    second: cue.second,
    interactiveCue: cue.interactiveCue ?? null,
  }));
}

export function resolveWaveformCueOverlayNudgeSecond(input: {
  cueSecond: number;
  direction: -1 | 1;
  durationSeconds: number | null;
  beatGrid: BeatGridPoint[];
  coarse: boolean;
  freeSlip: boolean;
}): number {
  return nudgeTrackSecond(input.cueSecond, input.direction, {
    durationSeconds: input.durationSeconds,
    beatGrid: input.beatGrid,
    coarse: input.coarse,
    freeSlip: input.freeSlip,
  });
}
