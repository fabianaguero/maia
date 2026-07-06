import { beforeEach, describe, expect, it, vi } from "vitest";

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

    const nextPrefs = persistReplayFeedbackRecommendation("repo-feedback", currentPrefs, {
      suggestedStyleProfileId: "ambient-watch",
      suggestedMutationProfileId: "subtle",
    });

    expect(nextPrefs).toEqual(currentPrefs);
    expect(loadMonitorPrefs("repo-feedback")).toEqual(currentPrefs);
  });

  it("returns null for invalid storage and normalizes migrated/current payloads", () => {
    localStorage.setItem("maia.monitor-prefs.repo-bad", "{broken");
    expect(loadMonitorPrefs("repo-bad")).toBeNull();

    localStorage.setItem(
      "maia.monitor-prefs.repo-current-weird",
      JSON.stringify({
        basePlaylist: {
          id: "  ",
          name: "",
          trackIds: ["track-1", "", null, "track-2"],
        },
        selectedStyleProfileId: "",
        selectedMutationProfileId: "",
        masterVolume: 99,
      }),
    );

    expect(loadMonitorPrefs("repo-current-weird")).toEqual(
      expect.objectContaining({
        basePlaylist: expect.objectContaining({
          id: "playlist-repo-current-weird",
          name: "Base playlist",
          trackIds: ["track-1", "track-2"],
        }),
        selectedStyleProfileId: "steady-house",
        selectedMutationProfileId: "balanced",
        masterVolume: 1,
      }),
    );

    localStorage.setItem(
      "maia.monitor-prefs.repo-legacy-empty",
      JSON.stringify({
        referencePlaylistIds: ["", null, "track-9"],
        selectedGenreId: "unknown",
        selectedPresetId: "unknown",
        masterVolume: -10,
      }),
    );

    expect(loadMonitorPrefs("repo-legacy-empty")).toEqual(
      expect.objectContaining({
        basePlaylist: expect.objectContaining({
          trackIds: ["track-9"],
        }),
        selectedStyleProfileId: "steady-house",
        selectedMutationProfileId: "balanced",
        masterVolume: 0,
      }),
    );
  });

  it("ignores storage write failures and still returns updated replay recommendations", () => {
    const currentPrefs: MonitorPrefs = {
      basePlaylist: createBasePlaylist(["track-7"], "Night watch"),
      selectedStyleProfileId: "ambient-watch",
      selectedMutationProfileId: "subtle",
      masterVolume: 0.7,
    };
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(() => saveMonitorPrefs("repo-fail", currentPrefs)).not.toThrow();

    const nextPrefs = persistReplayFeedbackRecommendation("repo-fail", currentPrefs, {
      suggestedStyleProfileId: "alert-techno",
      suggestedMutationProfileId: "reactive",
    });

    expect(nextPrefs).toEqual({
      ...currentPrefs,
      selectedStyleProfileId: "alert-techno",
      selectedMutationProfileId: "reactive",
    });
    expect(setItemSpy).toHaveBeenCalled();
  });
});
