import { useSimpleMonitorDeckController } from "./useSimpleMonitorDeckController";
import type { UseSimpleMonitorDeckRuntimeInput } from "./simpleMonitorDeckRuntimeTypes";

export function useSimpleMonitorDeckRuntime({
  skin,
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
  return useSimpleMonitorDeckController({
    skin,
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
  });
}
