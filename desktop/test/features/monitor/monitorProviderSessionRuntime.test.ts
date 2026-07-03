import { describe, expect, it, vi } from "vitest";

import type { RepositoryAnalysis } from "../../../src/types/library";
import type { StartSessionInput, StreamSessionRecord } from "../../../src/types/monitor";
import {
  attachMonitorProviderSessionState,
  FILE_ONLY_MONITORING_ERROR,
  startMonitorProviderSessionState,
} from "../../../src/features/monitor/monitorProviderSessionRuntime";

function createRepo(): RepositoryAnalysis {
  return {
    id: "repo-1",
    title: "Visits",
    path: "/repos/visits",
    language: "typescript",
    fileCount: 12,
    analysisStatus: "completed",
    createdAt: "2026-06-26T00:00:00.000Z",
    updatedAt: "2026-06-26T00:00:00.000Z",
  };
}

function createSessionInput(overrides?: Partial<StartSessionInput>): StartSessionInput {
  return {
    sessionId: "stream-1",
    adapterKind: "file",
    source: "/logs/visits.log",
    label: "visits",
    startFromBeginning: true,
    ...overrides,
  };
}

function createSessionRecord(): StreamSessionRecord {
  return {
    sessionId: "attached-1",
    adapterKind: "file",
    source: "/logs/attached.log",
    label: "attached",
    status: "active",
    createdAt: "2026-06-26T00:00:00.000Z",
    updatedAt: "2026-06-26T00:00:00.000Z",
    fileCursor: 128,
  };
}

function createLiveStartInput() {
  return {
    directCursorRef: { current: undefined },
    emptyWindowsRef: { current: 0 },
    pollIndexRef: { current: 0 },
    activeTemplateRef: { current: { id: "default", bpm: 120 } },
    setActiveTemplateState: vi.fn(),
    updatePersistedSessionStatus: vi.fn(),
    sessionRef: { current: null },
    activeRef: { current: false },
    isPlaybackRef: { current: false },
    setSession: vi.fn(),
    setIsPlayback: vi.fn(),
    setMetrics: vi.fn(),
    resetReplayTelemetry: vi.fn(),
    ensureAudioContext: vi.fn(),
    emitProbe: vi.fn(),
    reloadPendingGuideTrack: vi.fn(),
    doPoll: vi.fn(),
  };
}

describe("monitorProviderSessionRuntime", () => {
  it("starts a live file-backed session through the shared live start state", async () => {
    const startLiveMonitorSession = vi.fn(async () => undefined);
    const resolveLiveMonitorPollMode = vi.fn(async () => "session" as const);

    const ok = await startMonitorProviderSessionState({
      repo: createRepo(),
      sessionInput: createSessionInput({ sourceTemplateId: "techno" }),
      persistedSessionId: "persisted-1",
      sessionRef: { current: null },
      replaceExistingSessionIfPresent: vi.fn(),
      resolveLiveMonitorPollMode,
      startLiveMonitorSession,
      liveStartInput: createLiveStartInput(),
      logger: { info: vi.fn() },
    });

    expect(ok).toBe(true);
    expect(resolveLiveMonitorPollMode).toHaveBeenCalledWith({
      sessionInput: expect.objectContaining({ sessionId: "stream-1" }),
    });
    expect(startLiveMonitorSession).toHaveBeenCalledTimes(1);
    expect(startLiveMonitorSession.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        session: expect.objectContaining({
          sessionId: "stream-1",
          repoId: "repo-1",
          sourcePath: "/logs/visits.log",
        }),
        sourceTemplateId: "techno",
        persistedSessionId: "persisted-1",
        logLabel: "startSession",
      }),
    );
  });

  it("replaces an existing session before starting a new one and preserves start-from-tail mode", async () => {
    const startLiveMonitorSession = vi.fn(async () => undefined);
    const resolveLiveMonitorPollMode = vi.fn(async () => "direct" as const);
    const replaceExistingSessionIfPresent = vi.fn(async () => undefined);
    const logger = { info: vi.fn() };

    const ok = await startMonitorProviderSessionState({
      repo: createRepo(),
      sessionInput: createSessionInput({
        startFromBeginning: false,
      }),
      sessionRef: {
        current: {
          sessionId: "old-1",
        } as never,
      },
      replaceExistingSessionIfPresent,
      resolveLiveMonitorPollMode,
      startLiveMonitorSession,
      liveStartInput: createLiveStartInput(),
      logger,
    });

    expect(ok).toBe(true);
    expect(replaceExistingSessionIfPresent).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      "startSession — stopping previous session id=%s",
      "old-1",
    );
    expect(startLiveMonitorSession.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        session: expect.objectContaining({
          pollMode: "direct",
        }),
        startFromBeginning: false,
        sourceTemplateId: null,
      }),
    );
  });

  it("rejects non-file monitoring starts", async () => {
    await expect(
      startMonitorProviderSessionState({
        repo: createRepo(),
        sessionInput: createSessionInput({
          adapterKind: "websocket",
        }),
        sessionRef: { current: null },
        replaceExistingSessionIfPresent: vi.fn(),
        resolveLiveMonitorPollMode: vi.fn(),
        startLiveMonitorSession: vi.fn(),
        liveStartInput: createLiveStartInput(),
        logger: { info: vi.fn() },
      }),
    ).rejects.toThrow(FILE_ONLY_MONITORING_ERROR);
  });

  it("attaches an existing native session through the shared start state", async () => {
    const startLiveMonitorSession = vi.fn(async () => undefined);

    const ok = await attachMonitorProviderSessionState({
      sessionRecord: createSessionRecord(),
      repoId: "repo-1",
      repoTitle: "Visits",
      trackId: "track-1",
      trackTitle: "Night watch",
      sourceTemplateId: "ambient",
      persistedSessionId: "persisted-1",
      sessionRef: { current: null },
      replaceExistingSessionIfPresent: vi.fn(),
      startLiveMonitorSession,
      liveStartInput: createLiveStartInput(),
      logger: { info: vi.fn() },
    });

    expect(ok).toBe(true);
    expect(startLiveMonitorSession).toHaveBeenCalledWith(
      expect.objectContaining({
        session: expect.objectContaining({
          sessionId: "attached-1",
          sourcePath: "/logs/attached.log",
          trackId: "track-1",
          trackName: "Night watch",
        }),
        sourceTemplateId: "ambient",
        persistedSessionId: "persisted-1",
      }),
    );
  });

  it("replaces an existing session before attaching and tolerates a missing logger", async () => {
    const startLiveMonitorSession = vi.fn(async () => undefined);
    const replaceExistingSessionIfPresent = vi.fn(async () => undefined);

    const ok = await attachMonitorProviderSessionState({
      sessionRecord: createSessionRecord(),
      repoId: "repo-1",
      repoTitle: "Visits",
      sessionRef: {
        current: {
          sessionId: "old-1",
        } as never,
      },
      replaceExistingSessionIfPresent,
      startLiveMonitorSession,
      liveStartInput: createLiveStartInput(),
    });

    expect(ok).toBe(true);
    expect(replaceExistingSessionIfPresent).toHaveBeenCalledTimes(1);
    expect(startLiveMonitorSession).toHaveBeenCalledWith(
      expect.objectContaining({
        session: expect.objectContaining({
          sessionId: "attached-1",
          sourcePath: "/logs/attached.log",
          adapterKind: "file",
          pollMode: "session",
        }),
        sourceTemplateId: null,
        persistedSessionId: undefined,
      }),
    );
  });
});
