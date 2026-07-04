import { describe, expect, it, vi } from "vitest";

import {
  buildLiveMonitorExecutionPlan,
  buildLiveSessionGuideDraft,
  buildLiveSessionPersistenceInput,
  buildMonitoredRepoNavigation,
  buildReplayMonitorExecutionPlan,
  buildReplayPlaybackInput,
  openCurrentMonitoredRepo,
  startLiveMonitorSession,
  startReplayMonitorSession,
} from "../../src/hooks/appMonitorSessionActionsRuntime";

const appRuntimeMock = vi.hoisted(() => ({
  resolveReplaySourceRepository: vi.fn(),
  shouldReuseActiveReplaySession: vi.fn(),
}));

const appMonitorActionsRuntimeMock = vi.hoisted(() => ({
  resolveMonitoredRepository: vi.fn(),
  resolveReplayMonitorDraft: vi.fn(),
  resolveSessionPersistenceAction: vi.fn(),
}));

const appContentRuntimeMock = vi.hoisted(() => ({
  resolveSessionRepository: vi.fn(),
}));

vi.mock("../../src/appRuntime", () => appRuntimeMock);
vi.mock("../../src/appMonitorActionsRuntime", () => appMonitorActionsRuntimeMock);
vi.mock("../../src/appContentRuntime", () => appContentRuntimeMock);

describe("appMonitorSessionActionsRuntime", () => {
  it("builds replay/live payloads and monitored repo navigation", () => {
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

  it("runs replay/open/live monitor actions through pure runtime helpers", async () => {
    const replayInput = {
      t: {
        appShell: {
          replayUnavailableTitle: "Replay unavailable",
          replayUnavailableBody: "Missing source",
        },
        session: {
          unnamedSession: "Unnamed",
        },
      },
      repositories: {
        repositories: [{ id: "repo-1" }],
        setSelectedRepositoryId: vi.fn(),
      },
      sessions: {
        setSelectedSessionId: vi.fn(),
        sessions: [],
        clearError: vi.fn(),
        createSession: vi.fn(async () => null),
      },
      monitor: {
        session: null,
        isPlayback: false,
        playbackSession: vi.fn(async () => true),
        pausePlayback: vi.fn(),
        seekPlaybackWindow: vi.fn(),
        startSession: vi.fn(async () => true),
      },
      notify: vi.fn(),
      setAnalysisMode: vi.fn(),
      setScreen: vi.fn(),
      armSessionMusicalBase: vi.fn(),
      primeMonitorGuideTrack: vi.fn(),
    } as never;

    appMonitorActionsRuntimeMock.resolveReplayMonitorDraft.mockReturnValue({ trackId: "track-1" });
    appRuntimeMock.resolveReplaySourceRepository.mockReturnValue({ id: "repo-1" });
    appRuntimeMock.shouldReuseActiveReplaySession.mockReturnValue(false);

    await expect(
      startReplayMonitorSession(
        replayInput,
        {
          id: "session-1",
          label: "Replay 1",
          sourceId: "repo-1",
          sourcePath: "/logs/source.log",
        } as never,
        3,
      ),
    ).resolves.toBe(true);

    expect(replayInput.sessions.setSelectedSessionId).toHaveBeenCalledWith("session-1");
    expect(replayInput.monitor.playbackSession).toHaveBeenCalledWith({
      sessionId: "session-1",
      label: "Replay 1",
      sourcePath: "/logs/source.log",
      repoId: "repo-1",
    });
    expect(replayInput.monitor.seekPlaybackWindow).toHaveBeenCalledWith(3);

    const liveInput = {
      ...replayInput,
      sessions: {
        ...replayInput.sessions,
        sessions: [],
        setSelectedSessionId: vi.fn(),
        createSession: vi.fn(async () => null),
        clearError: vi.fn(),
      },
    } as never;

    appContentRuntimeMock.resolveSessionRepository.mockReturnValue({ id: "repo-live" });
    appMonitorActionsRuntimeMock.resolveSessionPersistenceAction.mockReturnValue("create");

    await expect(
      startLiveMonitorSession(
        liveInput,
        {
          adapterKind: "file",
          sessionId: "runtime-1",
          label: "Live session",
          source: { kind: "file", path: "/tmp/service.log" },
        } as never,
        "persisted-1",
        { sourceId: "repo-live", playlistId: "playlist-1" },
      ),
    ).resolves.toBe(true);

    expect(liveInput.sessions.clearError).toHaveBeenCalled();
    expect(liveInput.monitor.startSession).toHaveBeenCalledWith(
      { id: "repo-live" },
      expect.objectContaining({ sessionId: "runtime-1" }),
      "persisted-1",
    );
    expect(liveInput.sessions.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: "persisted-1", sourceId: "repo-live" }),
    );

    const openRepoInput = {
      repositories: {
        repositories: [{ id: "repo-live" }],
        setSelectedRepositoryId: vi.fn(),
      },
      monitor: {
        session: { repoId: "repo-live" },
      },
      setAnalysisMode: vi.fn(),
      setScreen: vi.fn(),
      setPillar: vi.fn(),
    } as never;

    appMonitorActionsRuntimeMock.resolveMonitoredRepository.mockReturnValue({ id: "repo-live" });

    openCurrentMonitoredRepo(openRepoInput);

    expect(openRepoInput.repositories.setSelectedRepositoryId).toHaveBeenCalledWith("repo-live");
    expect(openRepoInput.setAnalysisMode).toHaveBeenCalledWith("repo");
    expect(openRepoInput.setScreen).toHaveBeenCalledWith("inspect");
    expect(openRepoInput.setPillar).toHaveBeenCalledWith("curate");
  });
});
