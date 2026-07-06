import type { PersistedSession } from "../../api/sessions";

export type SessionBoothActionBarMode = "playback" | "live" | "idle";

export function resolveSessionBoothActionBarMode(input: {
  playbackActive: boolean;
  liveMonitorActive: boolean;
}): SessionBoothActionBarMode {
  if (input.playbackActive) {
    return "playback";
  }

  if (input.liveMonitorActive) {
    return "live";
  }

  return "idle";
}

export function resolveSessionBoothDirectLaunchDisabled(input: {
  directPath: string;
  isDirectLoading: boolean;
}): boolean {
  return input.isDirectLoading || !input.directPath.trim();
}

export function resolveSessionBoothShowResumeSelected(
  selectedSession: PersistedSession | null,
): boolean {
  return Boolean(selectedSession && selectedSession.status === "paused");
}

export function resolveSessionBoothShowReplaySelected(
  selectedSession: PersistedSession | null,
): boolean {
  return Boolean(selectedSession && selectedSession.totalPolls > 0);
}

export function resolveSessionBoothStartDisabled(input: {
  creating: boolean;
  mutating: boolean;
  readyToRun: boolean;
}): boolean {
  return input.creating || input.mutating || !input.readyToRun;
}
