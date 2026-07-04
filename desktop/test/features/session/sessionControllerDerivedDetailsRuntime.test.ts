import { describe, expect, it } from "vitest";

import { resolveSessionControllerDerivedDetails } from "../../../src/features/session/sessionControllerDerivedDetailsRuntime";

describe("sessionControllerDerivedDetailsRuntime", () => {
  it("resolves selected, active and session detail summaries", () => {
    const details = resolveSessionControllerDerivedDetails({
      baseMode: "track",
      selectedTrack: {
        id: "track-1",
        title: "Base Pulse",
        tags: { title: "Base Pulse" },
        analysis: { bpm: 126 },
        file: { sourcePath: "/music/base-pulse.wav" },
      } as never,
      selectedPlaylist: null,
      tracks: [
        {
          id: "track-1",
          title: "Base Pulse",
          tags: { title: "Base Pulse" },
          analysis: { bpm: 126 },
          file: { sourcePath: "/music/base-pulse.wav" },
        },
      ] as never,
      selectedPlaylistId: null,
      selectedSourceId: "repo-1",
      selectedTrackId: "track-1",
      selectedSource: {
        id: "repo-1",
        title: "orders-service",
      } as never,
      templateGenre: "House",
      templateLabel: "Log monitor",
      sessionPlaceholderFallback: "Session",
      activePlaybackProgress: 0.48,
      activeSession: null,
      selectedSession: null,
      repositories: [] as never,
      playlists: [] as never,
    });

    expect(details.selectedBaseDetails.label).toBe("Base Pulse");
    expect(details.sessionLabelPlaceholder).toContain("orders-service");
    expect(details.playbackPercent).toBe(48);
    expect(details.readyToRun).toBe(true);
  });
});
