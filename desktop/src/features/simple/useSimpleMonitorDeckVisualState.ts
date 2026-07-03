import {
  buildSimpleMonitorDeckVisualCanvasEffectsInput,
  buildSimpleMonitorDeckVisualStateResult,
} from "./simpleMonitorDeckVisualComposeRuntime";
import {
  buildMonitorDeckScrubHookInput,
  buildSimpleMonitorDeckVisualDerivedState,
} from "./simpleMonitorDeckVisualRuntime";
import { useSimpleMonitorDeckCanvasEffects } from "./useSimpleMonitorDeckCanvasEffects";
import { useMonitorDeckScrub } from "./useMonitorDeckScrub";
import type { UseSimpleMonitorDeckVisualStateInput } from "./simpleMonitorDeckVisualTypes";

export function useSimpleMonitorDeckVisualState({
  backgroundAudioRef,
  waveformBins,
  waveformAnomalies,
  trackWaveProgress,
  setTrackWaveProgress,
  setTrackElapsedSeconds,
  deckDurationSeconds,
  deckBpm,
  activeBeatGrid,
  logSignalBuffer,
  selectedAnomalyId,
  isConsoleExpanded,
  onToggleConsole,
  onSelectAnomalyForFocus,
  deckVisualPreset,
  waveformScale,
  safeRuntime = false,
}: UseSimpleMonitorDeckVisualStateInput) {
  const {
    visibleWindowSeconds,
    trackWaveSamples,
    deckTimelineMarkers,
    deckBeatMarkers,
    derivedDeckState,
  } = buildSimpleMonitorDeckVisualDerivedState({
    waveformBins,
    waveformAnomalies,
    trackWaveProgress,
    deckDurationSeconds,
    deckBpm,
    activeBeatGrid,
    logSignalBuffer,
    selectedAnomalyId,
  });
  const scrub = useMonitorDeckScrub(
    buildMonitorDeckScrubHookInput({
      backgroundAudioRef,
      waveformAnomalies,
      trackWaveProgress,
      setTrackWaveProgress,
      setTrackElapsedSeconds,
      isConsoleExpanded,
      onToggleConsole,
      onSelectAnomalyForFocus,
    }),
  );
  useSimpleMonitorDeckCanvasEffects(
    buildSimpleMonitorDeckVisualCanvasEffectsInput({
      visualState: {
        waveformAnomalies,
        trackWaveProgress,
        deckVisualPreset,
        waveformScale,
        safeRuntime,
      },
      scrub,
      derived: {
        derivedDeckState,
        trackWaveSamples,
      },
    }),
  );

  return buildSimpleMonitorDeckVisualStateResult({
    scrub,
    derived: {
      visibleWindowSeconds,
      trackWaveSamples,
      deckTimelineMarkers,
      deckBeatMarkers,
      derivedDeckState,
    },
  });
}
