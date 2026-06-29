import { useEffect, useRef, type MutableRefObject } from "react";

import { useSimpleMonitorReactiveAudio } from "./useSimpleMonitorReactiveAudio";
import { useMonitorTrackAudio } from "./useMonitorTrackAudio";
import { useMonitorLiveStream } from "./useMonitorLiveStream";
import {
  buildMonitorLiveStreamHookInput,
  buildMonitorTrackAudioHookInput,
} from "./simpleMonitorDeckRuntime";
import type { MonitorDeckControls } from "./monitorDeckControls";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import type { ActiveMonitorSession, StreamListener } from "../monitor/monitorContextTypes";
import type { LibraryTrack } from "../../types/library";

const SAFE_MONITOR_RUNTIME = false;

interface UseSimpleMonitorDeckLiveControllerInput {
  audioContext: AudioContext | null;
  isListening: boolean;
  deckControls: MonitorDeckControls;
  activeTrack: LibraryTrack | null;
  deckDurationSeconds: number | null;
  session: ActiveMonitorSession | null;
  streamAdapterLabel: string;
  subscribe: (listener: StreamListener) => () => void;
  trackWaveProgressRef: MutableRefObject<number>;
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  setTrackDurationSeconds: (value: number | null) => void;
  liveSettings: MonitorSetupPreferences;
}

export function useSimpleMonitorDeckLiveController(input: UseSimpleMonitorDeckLiveControllerInput) {
  const activeTrackRef = useRef(input.activeTrack);
  const deckDurationSecondsRef = useRef(input.deckDurationSeconds);
  const {
    backgroundGraphRef,
    audioContextRef,
    deckControlsRef,
    ensureBackgroundGraph,
    applyTrackMutation,
    playTestTone,
    playCueBatch,
  } = useSimpleMonitorReactiveAudio({
    audioContext: input.audioContext,
    isListening: input.isListening,
    deckControls: input.deckControls,
  });

  useEffect(() => {
    activeTrackRef.current = input.activeTrack;
  }, [input.activeTrack]);

  useEffect(() => {
    deckDurationSecondsRef.current = input.deckDurationSeconds;
  }, [input.deckDurationSeconds]);

  const { backgroundAudioRef, previewTrackId, toggleTrackPreview } = useMonitorTrackAudio(
    buildMonitorTrackAudioHookInput({
      audioContext: input.audioContext,
      isListening: input.isListening,
      safeRuntime: SAFE_MONITOR_RUNTIME,
      activeTrack: input.activeTrack,
      ensureBackgroundGraph,
      setTrackWaveProgress: input.setTrackWaveProgress,
      setTrackElapsedSeconds: input.setTrackElapsedSeconds,
      setTrackDurationSeconds: input.setTrackDurationSeconds,
    }),
  );

  const liveState = useMonitorLiveStream(
    buildMonitorLiveStreamHookInput({
      isListening: input.isListening,
      sessionSourcePath: input.session?.sourcePath,
      streamAdapterLabel: input.streamAdapterLabel,
      subscribe: input.subscribe,
      audioContextRef,
      backgroundAudioRef,
      backgroundGraphRef,
      activeTrackRef,
      deckDurationSecondsRef,
      trackWaveProgressRef: input.trackWaveProgressRef,
      deckControlsRef,
      trackBpm: input.activeTrack?.analysis?.bpm ?? null,
      ensureBackgroundGraph,
      applyTrackMutation: (update) => applyTrackMutation(update, backgroundAudioRef),
      playTestTone,
      playCueBatch,
      liveSettings: input.liveSettings,
    }),
  );

  return {
    backgroundAudioRef,
    previewTrackId,
    toggleTrackPreview,
    ...liveState,
  };
}
