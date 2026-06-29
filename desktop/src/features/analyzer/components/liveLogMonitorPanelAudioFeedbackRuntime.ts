import {
  buildSampleLoadWarningMessage,
  MAX_RECENT_WARNINGS,
} from "./liveLogMonitorPanelAudioInputRuntime";

export function appendLiveLogMonitorWarningMessage(
  currentWarnings: string[],
  message: string,
): string[] {
  return [buildSampleLoadWarningMessage(message), ...currentWarnings].slice(0, MAX_RECENT_WARNINGS);
}
