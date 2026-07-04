import { useEffectEvent } from "react";

import type { MonitorCueBatch } from "./monitorCueBatchTypes";
import type { MonitorDeckControls } from "./monitorDeckControls";
import type { MonitorTrackMutationInput } from "./monitorAudioMutation";
import { playSimpleMonitorVoicePlans } from "./simpleMonitorReactiveAudioPlaybackRuntime";
import {
  applySimpleMonitorTrackMutationRefState,
  buildSimpleMonitorCueBatchPlaybackState,
  buildSimpleMonitorTestTonePlaybackState,
  resolveSimpleMonitorBackgroundGraphState,
} from "./simpleMonitorReactiveAudioHookRuntime";
import { applyMonitorReactiveAudioPlan } from "./simpleMonitorReactiveAudioRuntime";
import { useSimpleMonitorReactiveAudioRefs } from "./useSimpleMonitorReactiveAudioRefs";

interface UseSimpleMonitorReactiveAudioSlicesInput {
  audioContext: AudioContext | null;
  isListening: boolean;
  deckControls: MonitorDeckControls;
}

export function useSimpleMonitorReactiveAudioSlices({
  audioContext,
  isListening,
  deckControls,
}: UseSimpleMonitorReactiveAudioSlicesInput) {
  const { backgroundGraphRef, audioContextRef, deckControlsRef, smoothedPressureRef } =
    useSimpleMonitorReactiveAudioRefs({
      audioContext,
      isListening,
      deckControls,
    });

  const playTestTone = useEffectEvent(() => {
    const playbackState = buildSimpleMonitorTestTonePlaybackState({
      audioContext: audioContextRef.current,
      masterVolume: deckControlsRef.current.masterVolume,
    });
    if (!playbackState) {
      return;
    }

    playSimpleMonitorVoicePlans(playbackState.context, playbackState.voicePlans);
  });

  const playCueBatch = useEffectEvent((cues: MonitorCueBatch) => {
    const playbackState = buildSimpleMonitorCueBatchPlaybackState({
      audioContext: audioContextRef.current,
      cues,
      masterVolume: deckControlsRef.current.masterVolume,
      hasBackgroundGraph: Boolean(backgroundGraphRef.current),
    });
    if (!playbackState) {
      return;
    }

    playSimpleMonitorVoicePlans(playbackState.context, playbackState.voicePlans);
  });

  const ensureBackgroundGraph = useEffectEvent((audio: HTMLAudioElement, context: AudioContext) => {
    const graph = resolveSimpleMonitorBackgroundGraphState({
      existing: backgroundGraphRef.current,
      context,
      audio,
      masterVolume: deckControlsRef.current.masterVolume,
      warn: (message, error) => {
        console.warn(message, error);
      },
    });
    backgroundGraphRef.current = graph;
    return graph;
  });

  const applyTrackMutation = useEffectEvent(
    (update: MonitorTrackMutationInput, backgroundAudioRef: { current: HTMLAudioElement | null }) => {
      const result = applySimpleMonitorTrackMutationRefState({
        update,
        graph: backgroundGraphRef.current,
        backgroundAudio: backgroundAudioRef.current,
        currentPressure: smoothedPressureRef.current,
        controls: deckControlsRef.current,
        applyMonitorReactiveAudioPlan,
      });
      smoothedPressureRef.current = result.nextPressure;
    },
  );

  return {
    backgroundGraphRef,
    audioContextRef,
    deckControlsRef,
    playTestTone,
    playCueBatch,
    ensureBackgroundGraph,
    applyTrackMutation,
  };
}
