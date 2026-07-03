import type { AppTranslations } from "../../../i18n/en";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import type { RenderedRegion } from "./waveformPlaceholderRuntime";

export interface WaveformRegionOverlayRegionViewModel {
  id: string;
  label: string;
  type: string;
  startPosition: number;
  widthPercent: number;
  color: string;
  title: string;
  tabIndex: number;
  ariaLabel: string;
  ariaDisabled: boolean;
  startSecond: number;
  endSecond: number;
  editableLoop: RenderedRegion["editableLoop"];
}

export interface WaveformRegionOverlayPhraseViewModel {
  label: string;
  startPosition: number;
  widthPercent: number;
  title: string;
  tabIndex: number;
  ariaLabel: string;
  ariaDisabled: boolean;
  startSecond: number;
}

export function buildWaveformRegionOverlayRegions(input: {
  renderedRegions: RenderedRegion[];
  durationSeconds: number | null;
  canEditPerformance: boolean;
  onSeek?: ((second: number) => void) | undefined;
  t: AppTranslations;
}): WaveformRegionOverlayRegionViewModel[] {
  return input.renderedRegions.map((region) => {
    const startPosition =
      input.durationSeconds && input.durationSeconds > 0
        ? Math.min(100, (region.startSecond / input.durationSeconds) * 100)
        : 0;
    const endPosition =
      input.durationSeconds && input.durationSeconds > 0
        ? Math.min(100, (region.endSecond / input.durationSeconds) * 100)
        : startPosition;

    return {
      id: region.id,
      label: region.label,
      type: region.type,
      startPosition,
      widthPercent: Math.max(0.8, endPosition - startPosition),
      color: region.color ?? "rgba(72, 215, 255, 0.28)",
      title: region.excerpt ? `${region.label} · ${region.excerpt}` : region.label,
      tabIndex: input.onSeek || (input.canEditPerformance && region.editableLoop) ? 0 : -1,
      ariaLabel: input.t.inspect.seekTo.replace("{label}", region.label),
      ariaDisabled: !input.onSeek,
      startSecond: region.startSecond,
      endSecond: region.endSecond,
      editableLoop: region.editableLoop,
    };
  });
}

export function buildWaveformRegionOverlayPhrase(input: {
  selectedPhraseRange: BeatGridPhraseRange | null;
  durationSeconds: number | null;
  onSeek?: ((second: number) => void) | undefined;
  t: AppTranslations;
}): WaveformRegionOverlayPhraseViewModel | null {
  if (!input.selectedPhraseRange || !input.durationSeconds || input.durationSeconds <= 0) {
    return null;
  }

  return {
    label: input.selectedPhraseRange.label,
    startPosition: Math.min(
      100,
      (input.selectedPhraseRange.startSecond / input.durationSeconds) * 100,
    ),
    widthPercent: Math.max(
      0.8,
      ((input.selectedPhraseRange.endSecond - input.selectedPhraseRange.startSecond) /
        input.durationSeconds) *
        100,
    ),
    title: `${input.selectedPhraseRange.label} · ${input.selectedPhraseRange.beatCount} beats`,
    tabIndex: input.onSeek ? 0 : -1,
    ariaLabel: input.t.inspect.seekTo.replace("{label}", input.selectedPhraseRange.label),
    ariaDisabled: !input.onSeek,
    startSecond: input.selectedPhraseRange.startSecond,
  };
}
