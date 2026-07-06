import type { ActiveMonitorSession } from "./monitorContextTypes";

export function resolveStoppedMonitorSessionEffects(input: {
  session: ActiveMonitorSession | null;
  wasPlayback: boolean;
}): {
  persistedSessionIdToPause: string | null;
  shouldStopNativeSession: boolean;
  nativeSessionId: string | null;
} {
  if (input.wasPlayback) {
    return {
      persistedSessionIdToPause: null,
      shouldStopNativeSession: false,
      nativeSessionId: null,
    };
  }

  const current = input.session;
  return {
    persistedSessionIdToPause: current?.persistedSessionId ?? null,
    shouldStopNativeSession:
      current?.pollMode === "session" ||
      current?.pollMode === "websocket" ||
      current?.pollMode === "http-poll",
    nativeSessionId: current?.sessionId ?? null,
  };
}

export async function applyStoppedMonitorSessionEffects(input: {
  persistedSessionIdToPause: string | null;
  shouldStopNativeSession: boolean;
  nativeSessionId: string | null;
  updatePersistedSessionStatus: (
    id: string,
    status: "active" | "paused" | "stopped",
  ) => Promise<void> | void;
  stopStreamSession: (sessionId: string) => Promise<unknown>;
}): Promise<void> {
  if (input.persistedSessionIdToPause) {
    void input.updatePersistedSessionStatus(input.persistedSessionIdToPause, "paused");
  }

  if (input.shouldStopNativeSession && input.nativeSessionId) {
    try {
      await input.stopStreamSession(input.nativeSessionId);
    } catch {
      // best-effort
    }
  }
}
