import { describe, expect, it, vi } from "vitest";

import {
  applyMonitorGuideDraft,
  applyMonitoredRepoNavigationState,
  applyReplayMonitorNavigation,
  applyReplayMonitorRepositorySelection,
  openCurrentMonitoredRepo,
  persistLiveMonitorSessionSelection,
  startLiveMonitorSession,
  startReplayMonitorSession,
} from "../../src/hooks/appMonitorSessionActionsRuntime";

const appRuntimeMock = vi.hoisted(() => ({
  resolveReplaySourceRepository: vi.fn(),
}));

const appMonitorActionsRuntimeMock = vi.hoisted(() => ({
  resolveMonitoredRepository: vi.fn(),
  resolveReplayMonitorDraft: vi.fn(),
}));

const sessionExecutionRuntimeMock = vi.hoisted(() => ({
  buildLiveMonitorExecutionPlan: vi.fn(),
  buildMonitoredRepoNavigation: vi.fn(),
  buildReplayMonitorExecutionPlan: vi.fn(),
}));

vi.mock("../../src/appRuntime", () => appRuntimeMock);
vi.mock("../../src/appMonitorActionsRuntime", () => appMonitorActionsRuntimeMock);
vi.mock("../../src/hooks/appMonitorSessionExecutionRuntime", () => sessionExecutionRuntimeMock);

describe("appMonitorSessionActionsRuntime", () => {
  it("applies guide draft state", () => {
    const armSessionMusicalBase = vi.fn();
    const primeMonitorGuideTrack = vi.fn();
    applyMonitorGuideDraft({ armSessionMusicalBase, primeMonitorGuideTrack } as never, {
      trackId: "track-1",
      playlistId: "playlist-1",
    });

    expect(armSessionMusicalBase).toHaveBeenCalledWith({
      trackId: "track-1",
      playlistId: "playlist-1",
    });
    expect(primeMonitorGuideTrack).toHaveBeenCalledWith({
      trackId: "track-1",
      playlistId: "playlist-1",
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
    sessionExecutionRuntimeMock.buildReplayMonitorExecutionPlan.mockReturnValue({
      playbackInput: {
        sessionId: "session-1",
        label: "Replay 1",
        sourcePath: "/logs/source.log",
        repoId: "repo-1",
      },
      alreadyActiveReplay: false,
      shouldSeekWindow: true,
      replayWindowIndex: 3,
    });

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

    sessionExecutionRuntimeMock.buildLiveMonitorExecutionPlan.mockReturnValue({
      guideDraft: { sourceId: "repo-live", playlistId: "playlist-1" },
      repository: { id: "repo-live" },
      persistenceAction: "create",
      persistenceInput: {
        id: "persisted-1",
        sourceId: "repo-live",
      },
    });

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
    sessionExecutionRuntimeMock.buildMonitoredRepoNavigation.mockReturnValue({
      analysisMode: "repo",
      screen: "inspect",
      pillar: "curate",
    });

    openCurrentMonitoredRepo(openRepoInput);

    expect(openRepoInput.repositories.setSelectedRepositoryId).toHaveBeenCalledWith("repo-live");
    expect(openRepoInput.setAnalysisMode).toHaveBeenCalledWith("repo");
    expect(openRepoInput.setScreen).toHaveBeenCalledWith("inspect");
    expect(openRepoInput.setPillar).toHaveBeenCalledWith("curate");
  });

  it("applies replay selection, navigation and live persistence helpers", async () => {
    const repositories = { setSelectedRepositoryId: vi.fn() };
    const setAnalysisMode = vi.fn();
    const setScreen = vi.fn();
    const setPillar = vi.fn();
    const createSession = vi.fn(async () => null);
    const setSelectedSessionId = vi.fn();

    applyReplayMonitorRepositorySelection({ repositories, setAnalysisMode } as never, "repo-1");
    applyReplayMonitorNavigation({ setAnalysisMode, setScreen } as never);
    applyMonitoredRepoNavigationState(
      { repositories, setAnalysisMode, setScreen, setPillar } as never,
      "repo-2",
    );
    await persistLiveMonitorSessionSelection({
      persistenceAction: "create",
      sessions: { createSession, setSelectedSessionId } as never,
      persistenceInput: { id: "persisted-1" } as never,
      persistedSessionId: "persisted-1",
    });
    await persistLiveMonitorSessionSelection({
      persistenceAction: "select",
      sessions: { createSession, setSelectedSessionId } as never,
      persistenceInput: { id: "persisted-2" } as never,
      persistedSessionId: "persisted-2",
    });

    expect(repositories.setSelectedRepositoryId).toHaveBeenCalledWith("repo-1");
    expect(repositories.setSelectedRepositoryId).toHaveBeenCalledWith("repo-2");
    expect(setAnalysisMode).toHaveBeenCalledWith("repo");
    expect(setScreen).toHaveBeenCalledWith("inspect");
    expect(setPillar).toHaveBeenCalledWith("curate");
    expect(createSession).toHaveBeenCalledWith({ id: "persisted-1" });
    expect(setSelectedSessionId).toHaveBeenCalledWith("persisted-2");
  });
});
