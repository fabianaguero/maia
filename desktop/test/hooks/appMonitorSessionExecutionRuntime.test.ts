import { describe, expect, it, vi } from "vitest";

import {
  buildLiveMonitorExecutionPlan,
  buildLiveSessionGuideDraft,
  buildLiveSessionPersistenceInput,
  buildMonitoredRepoNavigation,
  buildReplayMonitorExecutionPlan,
  buildReplayPlaybackInput,
} from "../../src/hooks/appMonitorSessionExecutionRuntime";

const appRuntimeMock = vi.hoisted(() => ({
  shouldReuseActiveReplaySession: vi.fn(),
}));

const appMonitorActionsRuntimeMock = vi.hoisted(() => ({
  resolveSessionPersistenceAction: vi.fn(),
}));

const appContentRuntimeMock = vi.hoisted(() => ({
  resolveSessionRepository: vi.fn(),
}));

vi.mock("../../src/appRuntime", () => appRuntimeMock);
vi.mock("../../src/appMonitorActionsRuntime", async () => {
  const actual = await vi.importActual("../../src/appMonitorActionsRuntime");
  return {
    ...actual,
    resolveSessionPersistenceAction: appMonitorActionsRuntimeMock.resolveSessionPersistenceAction,
  };
});
vi.mock("../../src/appContentRuntime", () => appContentRuntimeMock);

describe("appMonitorSessionExecutionRuntime", () => {
  it("builds replay and live execution plans", () => {
    expect(
      buildReplayPlaybackInput({
        session: {
          id: "session-1",
          label: null,
          sourcePath: null,
        } as never,
        repoId: "repo-1",
        unnamedSessionLabel: "Unnamed",
      }),
    ).toEqual({
      sessionId: "session-1",
      label: "Unnamed",
      sourcePath: "",
      repoId: "repo-1",
    });

    expect(
      buildLiveSessionGuideDraft({
        trackId: "track-1",
        playlistId: "playlist-1",
      }),
    ).toEqual({
      trackId: "track-1",
      playlistId: "playlist-1",
    });

    expect(
      buildLiveSessionPersistenceInput({
        sessionId: "persisted-1",
        startInput: {
          adapterKind: "file",
          label: "Live",
        } as never,
        draft: {
          sourceId: "repo-1",
          trackId: "track-1",
          playlistId: "playlist-1",
        },
      }),
    ).toEqual({
      id: "persisted-1",
      label: "Live",
      sourceId: "repo-1",
      trackId: "track-1",
      playlistId: "playlist-1",
      adapterKind: "file",
      mode: "live",
    });

    expect(buildMonitoredRepoNavigation()).toEqual({
      analysisMode: "repo",
      screen: "inspect",
      pillar: "curate",
    });

    appRuntimeMock.shouldReuseActiveReplaySession.mockReturnValue(true);
    expect(
      buildReplayMonitorExecutionPlan({
        session: {
          id: "session-1",
          label: null,
          sourceId: "repo-1",
          sourcePath: null,
        } as never,
        sourceRepositoryId: "repo-1",
        unnamedSessionLabel: "Unnamed",
        currentPersistedSessionId: "session-1",
        isPlayback: true,
        replayWindowIndex: 4,
      }),
    ).toEqual({
      playbackInput: {
        sessionId: "session-1",
        label: "Unnamed",
        sourcePath: "",
        repoId: "repo-1",
      },
      alreadyActiveReplay: true,
      shouldSeekWindow: true,
      replayWindowIndex: 4,
    });

    appContentRuntimeMock.resolveSessionRepository.mockReturnValue({ id: "repo-live" });
    appMonitorActionsRuntimeMock.resolveSessionPersistenceAction.mockReturnValue("create");
    expect(
      buildLiveMonitorExecutionPlan({
        startInput: {
          adapterKind: "file",
          sessionId: "runtime-1",
          label: "Live session",
          source: { kind: "file", path: "/tmp/service.log" },
        } as never,
        persistedSessionId: "persisted-1",
        draft: {
          sourceId: "repo-live",
          trackId: "track-1",
          playlistId: "playlist-1",
        },
        repositories: [{ id: "repo-live" }] as never,
        unnamedSessionLabel: "Unnamed",
        existingSessions: [],
      }),
    ).toEqual({
      guideDraft: {
        trackId: "track-1",
        playlistId: "playlist-1",
      },
      repository: { id: "repo-live" },
      persistenceAction: "create",
      persistenceInput: {
        id: "persisted-1",
        label: "Live session",
        sourceId: "repo-live",
        trackId: "track-1",
        playlistId: "playlist-1",
        adapterKind: "file",
        mode: "live",
      },
    });
  });
});
