import { describe, expect, it, vi } from "vitest";

import {
  buildAppMonitorLiveActionInput,
  buildAppMonitorOpenRepoActionInput,
  buildAppMonitorReplayActionInput,
  buildReplaySourceRepositoryId,
  shouldSeekReplayWindow,
} from "../../src/hooks/appMonitorSessionActionsHookRuntime";

function createInput() {
  return {
    t: {
      appShell: {
        replayUnavailableTitle: "Replay unavailable",
        replayUnavailableBody: "Missing source",
      },
      session: {
        unnamedSession: "Unnamed session",
      },
    },
    repositories: {
      repositories: [{ id: "repo-1" }] as never[],
      setSelectedRepositoryId: vi.fn(),
    },
    sessions: {
      sessions: [{ id: "persisted-1" }] as never[],
      setSelectedSessionId: vi.fn(),
      createSession: vi.fn(async () => null),
      clearError: vi.fn(),
    },
    monitor: {
      session: { persistedSessionId: "persisted-1", repoId: "repo-1" } as never,
      isPlayback: false,
      setGuideTrack: vi.fn(),
      setGuideTrackPlaylist: vi.fn(),
      playbackSession: vi.fn(async () => true),
      pausePlayback: vi.fn(),
      seekPlaybackWindow: vi.fn(),
      startSession: vi.fn(async () => true),
    },
    notify: vi.fn(),
    setAnalysisMode: vi.fn(),
    setScreen: vi.fn(),
    setPillar: vi.fn(),
    armSessionMusicalBase: vi.fn(),
    primeMonitorGuideTrack: vi.fn(),
  };
}

describe("appMonitorSessionActionsHookRuntime", () => {
  it("builds focused replay, live, and open-repo inputs from the broader hook contract", () => {
    const input = createInput();

    const replayInput = buildAppMonitorReplayActionInput(input);
    const liveInput = buildAppMonitorLiveActionInput(input);
    const openRepoInput = buildAppMonitorOpenRepoActionInput(input);

    expect(replayInput.t).toBe(input.t);
    expect(replayInput.notify).toBe(input.notify);
    expect(replayInput.armSessionMusicalBase).toBe(input.armSessionMusicalBase);

    expect(liveInput.sessions).toBe(input.sessions);
    expect(liveInput.monitor).toBe(input.monitor);
    expect(liveInput.primeMonitorGuideTrack).toBe(input.primeMonitorGuideTrack);

    expect(openRepoInput.repositories).toBe(input.repositories);
    expect(openRepoInput.setAnalysisMode).toBe(input.setAnalysisMode);
    expect(openRepoInput.setPillar).toBe(input.setPillar);
  });

  it("normalizes replay repository ids and replay-window seeking guards", () => {
    expect(buildReplaySourceRepositoryId({ id: "repo-1" }, { sourceId: "fallback-1" })).toBe(
      "repo-1",
    );
    expect(buildReplaySourceRepositoryId(null, { sourceId: "fallback-1" })).toBe("fallback-1");
    expect(buildReplaySourceRepositoryId(null, { sourceId: null })).toBeNull();

    expect(shouldSeekReplayWindow(0)).toBe(true);
    expect(shouldSeekReplayWindow(4)).toBe(true);
    expect(shouldSeekReplayWindow(undefined)).toBe(false);
  });
});
