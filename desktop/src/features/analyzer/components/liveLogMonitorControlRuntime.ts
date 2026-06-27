export function createLiveMonitorSessionId(repositoryId: string, nowMs: number): string {
  return `sess-${repositoryId}-${nowMs}`;
}

export function resolveLiveMonitorStartWarning(
  adapterKind: string,
  sourcePath: string,
): string | null {
  if (adapterKind === "file" && sourcePath.startsWith("/tmp/")) {
    return "Warning: Log path is in /tmp/. We moved the generator to the project root for persistence.";
  }

  return null;
}

export function resolveLiveMonitorStartFailureMessage(
  error: unknown,
  toMessage: (value: unknown) => string,
): string {
  return `Failed to start monitor: ${toMessage(error)}`;
}

export function resolveBeatLooperStartBpm(anchorBpm: number | null, fallbackBpm = 120): number {
  return anchorBpm ?? fallbackBpm;
}
