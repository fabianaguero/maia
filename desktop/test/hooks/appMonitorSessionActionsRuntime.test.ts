import { describe, expect, it } from "vitest";

import {
  buildLiveSessionGuideDraft,
  buildLiveSessionPersistenceInput,
  buildMonitoredRepoNavigation,
  buildReplayPlaybackInput,
} from "../../src/hooks/appMonitorSessionActionsRuntime";

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
  });
});
