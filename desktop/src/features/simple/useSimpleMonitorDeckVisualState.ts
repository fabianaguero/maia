import { useMemo } from "react";
import { buildSimpleMonitorDeckVisualCanvasEffectsInput } from "./simpleMonitorDeckVisualComposeRuntime";
import { buildSimpleMonitorDeckVisualDerivedState } from "./simpleMonitorDeckVisualRuntime";
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
  } = useMemo(
    () =>
      buildSimpleMonitorDeckVisualDerivedState({
        waveformBins,
        waveformAnomalies,
        trackWaveProgress,
        deckDurationSeconds,
        deckBpm,
        activeBeatGrid,
        logSignalBuffer,
        selectedAnomalyId,
      }),
    [
      waveformBins,
      waveformAnomalies,
      trackWaveProgress,
      deckDurationSeconds,
      deckBpm,
      activeBeatGrid,
      logSignalBuffer,
      selectedAnomalyId,
    ],
  );
  const scrub = useMonitorDeckScrub({
    backgroundAudioRef,
    waveformAnomalies,
    trackWaveProgress,
    setTrackWaveProgress,
    setTrackElapsedSeconds,
    isConsoleExpanded,
    onToggleConsole,
    onSelectAnomalyForFocus,
  });
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

  return {
    ...scrub,
    ...derivedDeckState,
    visibleWindowSeconds,
    trackWaveSamples,
    deckTimelineMarkers,
    deckBeatMarkers,
  };
}
