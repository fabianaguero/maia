import { useEffect, useRef } from "react";

import type { ActiveMonitorSession } from "../monitor/monitorContextTypes";
import type { AppTranslations } from "../../i18n/en";
import type { LibraryTrack } from "../../types/library";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import { useMonitorDeckControls } from "./useMonitorDeckControls";
import { useSimpleMonitorPlaybackState } from "./useSimpleMonitorPlaybackState";
import { useSimpleMonitorReactiveAudio } from "./useSimpleMonitorReactiveAudio";
import { useMonitorTrackAudio } from "./useMonitorTrackAudio";
import { useMonitorLiveStream } from "./useMonitorLiveStream";
import { useSimpleMonitorDeckPresentationState } from "./useSimpleMonitorDeckPresentationState";
import {
  buildSimpleMonitorDeckHookState,
  buildMonitorTrackAudioHookInput,
  buildMonitorDeckPresentationHookInput,
  buildMonitorLiveStreamHookInput,
  buildSimpleMonitorDeckRuntimeState,
} from "./simpleMonitorDeckRuntime";

export interface UseSimpleMonitorDeckRuntimeInput {
  session: ActiveMonitorSession | null;
  isListening: boolean;
  isLaunchingMonitor: boolean;
  safeTracks: LibraryTrack[];
  trackName?: string;
  audioContext: AudioContext | null;
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  waveformBins?: number[];
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  liveSettings: MonitorSetupPreferences;
  t: AppTranslations;
}

const SAFE_MONITOR_RUNTIME = false;

export function useSimpleMonitorDeckRuntime({
  session,
  isListening,
  isLaunchingMonitor,
  safeTracks,
  trackName,
  audioContext,
  subscribe,
  waveformBins,
  isConsoleExpanded,
  onToggleConsole,
  liveSettings,
  t,
}: UseSimpleMonitorDeckRuntimeInput) {
  const { deckControls, activePreset } = useMonitorDeckControls();
  const {
    trackWaveProgress,
    setTrackWaveProgress,
    trackElapsedSeconds,
    setTrackElapsedSeconds,
    trackDurationSeconds,
    setTrackDurationSeconds,
    trackWaveProgressRef,
  } = useSimpleMonitorPlaybackState({
    isListening,
  });
  const baseDeckState = buildSimpleMonitorDeckRuntimeState({
    session,
    isListening,
    isLaunchingMonitor,
    tracks: safeTracks,
    trackName,
    trackDurationSeconds,
    activePreset,
    alertShape: deckControls.alertShape,
    liveSuggestedBpm: null,
    t,
  });
  const {
    activeTrack,
    deckDurationSeconds,
    activeBeatGrid,
    streamAdapterLabel,
    isMonitorActive,
    deckPresetLabel,
    deckVisualPreset,
  } = baseDeckState;
  const activeTrackRef = useRef(activeTrack);
  const deckDurationSecondsRef = useRef(deckDurationSeconds);
  const {
    backgroundGraphRef,
    audioContextRef,
    deckControlsRef,
    ensureBackgroundGraph,
    applyTrackMutation,
    playTestTone,
    playCueBatch,
  } = useSimpleMonitorReactiveAudio({
    audioContext,
    isListening,
    deckControls,
  });

  useEffect(() => {
    activeTrackRef.current = activeTrack;
  }, [activeTrack]);

  useEffect(() => {
    deckDurationSecondsRef.current = deckDurationSeconds;
  }, [deckDurationSeconds]);

  const waveformScale = deckControls.waveformScale;
  const { backgroundAudioRef, previewTrackId, toggleTrackPreview } = useMonitorTrackAudio(
    buildMonitorTrackAudioHookInput({
      audioContext,
      isListening,
      safeRuntime: SAFE_MONITOR_RUNTIME,
      activeTrack,
      ensureBackgroundGraph,
      setTrackWaveProgress,
      setTrackElapsedSeconds,
      setTrackDurationSeconds,
    }),
  );
  const {
    liveLines,
    logSignalBuffer,
    liveSuggestedBpm,
    waveformAnomalies,
    selectedAnomalyId,
    setSelectedAnomalyId,
    simulateLog,
  } = useMonitorLiveStream(
    buildMonitorLiveStreamHookInput({
      isListening,
      sessionSourcePath: session?.sourcePath,
      streamAdapterLabel,
      subscribe,
      audioContextRef,
      backgroundAudioRef,
      backgroundGraphRef,
      activeTrackRef,
      deckDurationSecondsRef,
      trackWaveProgressRef,
      deckControlsRef,
      trackBpm: activeTrack?.analysis?.bpm ?? null,
      ensureBackgroundGraph,
      applyTrackMutation: (update) => applyTrackMutation(update, backgroundAudioRef),
      playTestTone,
      playCueBatch,
      liveSettings,
    }),
  );
  const { deckBpm } = buildSimpleMonitorDeckRuntimeState({
    session,
    isListening,
    isLaunchingMonitor,
    tracks: safeTracks,
    trackName,
    trackDurationSeconds,
    activePreset,
    alertShape: deckControls.alertShape,
    liveSuggestedBpm,
    t,
  });
  const {
    terminalLinesRef,
    onTerminalScroll,
    registerLineRef,
    focusAnomaly,
    overviewCanvasRef,
    waveformCanvasRef,
    waveformStageRef,
    handleOverviewPointerDown,
    handleOverviewClick,
    handleOverviewAnomalyClick,
    handleOverviewAnomalyPointerDown,
    handleStagePointerDown,
    handleStageClick,
    anomalyBurstRegions,
    overviewWindowWidthPercent,
    overviewWindowLeftPercent,
    overviewPlayheadLeftPercent,
    overviewAnomalyMarkers,
    selectedDeckMarker,
    selectedBurstRegion,
    deckTimelineMarkers,
    deckBeatMarkers,
  } = useSimpleMonitorDeckPresentationState(
    buildMonitorDeckPresentationHookInput({
      backgroundAudioRef,
      waveformBins,
      waveformAnomalies: waveformAnomalies as WaveformAnomalyMarker[],
      trackWaveProgress,
      setTrackWaveProgress,
      setTrackElapsedSeconds,
      deckDurationSeconds,
      deckBpm,
      activeBeatGrid,
      logSignalBuffer,
      selectedAnomalyId,
      setSelectedAnomalyId,
      liveLines,
      isConsoleExpanded,
      onToggleConsole,
      deckVisualPreset,
      waveformScale,
      safeRuntime: SAFE_MONITOR_RUNTIME,
    }),
  );

  return buildSimpleMonitorDeckHookState({
    activeTrack,
    previewTrackId,
    toggleTrackPreview,
    deckPresetLabel,
    streamAdapterLabel,
    isMonitorActive,
    liveLines,
    selectedAnomalyId,
    simulateLog,
    terminalLinesRef,
    onTerminalScroll,
    registerLineRef,
    focusAnomaly,
    deckBpm,
    trackElapsedSeconds,
    deckDurationSeconds,
    overviewCanvasRef,
    waveformCanvasRef,
    waveformStageRef,
    anomalyBurstRegions,
    selectedBurstRegion,
    overviewAnomalyMarkers,
    overviewWindowLeftPercent,
    overviewWindowWidthPercent,
    overviewPlayheadLeftPercent,
    handleOverviewPointerDown,
    handleOverviewClick,
    handleOverviewAnomalyClick,
    handleOverviewAnomalyPointerDown,
    selectedDeckMarker,
    deckTimelineMarkers,
    deckBeatMarkers,
    handleStagePointerDown,
    handleStageClick,
    waveformScale,
  });
}
