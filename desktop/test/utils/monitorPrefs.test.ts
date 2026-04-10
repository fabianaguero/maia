import { beforeEach, describe, expect, it } from "vitest";

import {
  createBasePlaylist,
  loadMonitorPrefs,
  persistReplayFeedbackRecommendation,
  saveMonitorPrefs,
  type MonitorPrefs,
} from "../../src/utils/monitorPrefs";

describe("monitorPrefs", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads the current MonitorPrefs storage shape", () => {
    const prefs: MonitorPrefs = {
      basePlaylist: createBasePlaylist(["track-1", "track-2"], "Ops Bed"),
      selectedStyleProfileId: "steady-house",
      selectedMutationProfileId: "balanced",
    };

    saveMonitorPrefs("repo-current", prefs);

    expect(loadMonitorPrefs("repo-current")).toEqual(prefs);
  });

  it("migrates legacy playlist/genre/preset prefs into the current shape", () => {
    localStorage.setItem(
      "maia.monitor-prefs.repo-legacy",
      JSON.stringify({
        referencePlaylistIds: ["track-1", "track-2"],
        selectedGenreId: "techno",
        selectedPresetId: "beat-locked",
      }),
    );

    expect(loadMonitorPrefs("repo-legacy")).toEqual(
      expect.objectContaining({
        basePlaylist: expect.objectContaining({
          name: "Base playlist",
          trackIds: ["track-1", "track-2"],
        }),
        selectedStyleProfileId: "alert-techno",
        selectedMutationProfileId: "balanced",
      }),
    );
  });

  it("persists replay feedback recommendations immediately while preserving the playlist", () => {
    const currentPrefs: MonitorPrefs = {
      basePlaylist: createBasePlaylist(["track-7"], "Night watch"),
      selectedStyleProfileId: "ambient-watch",
      selectedMutationProfileId: "subtle",
    };

    saveMonitorPrefs("repo-feedback", currentPrefs);

    const nextPrefs = persistReplayFeedbackRecommendation(
      "repo-feedback",
      currentPrefs,
      {
        suggestedStyleProfileId: "ambient-watch",
        suggestedMutationProfileId: "subtle",
      },
    );

    expect(nextPrefs).toEqual(currentPrefs);
    expect(loadMonitorPrefs("repo-feedback")).toEqual(currentPrefs);
  });
});
