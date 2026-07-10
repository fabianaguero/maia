import { useEffectEvent } from "react";

import type { MonitorDeckControls } from "./monitorDeckControls";
import type { MonitorTrackMutationInput } from "./monitorAudioMutation";
import {
  applySimpleMonitorTrackMutationRefState,
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
    return;
  });

  const playCueBatch = useEffectEvent(() => {
    return;
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
    (
      update: MonitorTrackMutationInput,
      backgroundAudioRef: { current: HTMLAudioElement | null },
    ) => {
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
