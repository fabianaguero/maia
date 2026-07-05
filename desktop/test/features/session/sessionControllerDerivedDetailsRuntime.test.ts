import { describe, expect, it } from "vitest";

import {
  buildSessionControllerLabelPlaceholder,
  buildSessionControllerLaunchState,
  buildSessionControllerSelectedBaseDetails,
  buildSessionControllerSessionDetails,
  buildSessionControllerSourceDetails,
  resolveSessionControllerDerivedDetails,
} from "../../../src/features/session/sessionControllerDerivedDetailsRuntime";

describe("sessionControllerDerivedDetailsRuntime", () => {
  it("resolves selected, active and session detail summaries", () => {
    const input = {
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
    } as const;
    const selectedBaseDetails = buildSessionControllerSelectedBaseDetails(input);
    const placeholder = buildSessionControllerLabelPlaceholder({
      selectedBaseDetails,
      selectedSource: input.selectedSource,
      templateGenre: input.templateGenre,
      templateLabel: input.templateLabel,
      sessionPlaceholderFallback: input.sessionPlaceholderFallback,
    });
    const launchState = buildSessionControllerLaunchState(input);
    const sessionDetails = buildSessionControllerSessionDetails(input);
    const sourceDetails = buildSessionControllerSourceDetails(input);
    const details = resolveSessionControllerDerivedDetails(input);

    expect(selectedBaseDetails.label).toBe("Base Pulse");
    expect(placeholder).toContain("orders-service");
    expect(launchState.playbackPercent).toBe(48);
    expect(launchState.readyToRun).toBe(true);
    expect(sessionDetails.activeBaseDetails.label).toBeNull();
    expect(sourceDetails.activeSourceDetails.label).toBeNull();
    expect(details.selectedBaseDetails.label).toBe("Base Pulse");
    expect(details.sessionLabelPlaceholder).toContain("orders-service");
    expect(details.playbackPercent).toBe(48);
    expect(details.readyToRun).toBe(true);
  });
});
