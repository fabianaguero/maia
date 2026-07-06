import type { MonitorDeckControls } from "./monitorDeckControls";
import { buildSimpleMonitorReactiveAudioHookState } from "./simpleMonitorReactiveAudioRuntime";
import { useSimpleMonitorReactiveAudioSlices } from "./useSimpleMonitorReactiveAudioSlices";

interface UseSimpleMonitorReactiveAudioInput {
  audioContext: AudioContext | null;
  isListening: boolean;
  deckControls: MonitorDeckControls;
}

export function useSimpleMonitorReactiveAudio({
  audioContext,
  isListening,
  deckControls,
}: UseSimpleMonitorReactiveAudioInput) {
  const {
    backgroundGraphRef,
    audioContextRef,
    deckControlsRef,
    ensureBackgroundGraph,
    applyTrackMutation,
    playTestTone,
    playCueBatch,
  } = useSimpleMonitorReactiveAudioSlices({
    audioContext,
    isListening,
    deckControls,
  });

  return buildSimpleMonitorReactiveAudioHookState({
    backgroundGraphRef,
    audioContextRef,
    deckControlsRef,
    ensureBackgroundGraph,
    applyTrackMutation,
    playTestTone,
    playCueBatch,
  });
}
