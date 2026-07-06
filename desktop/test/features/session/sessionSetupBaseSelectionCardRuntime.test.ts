import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSessionSetupBaseModeTabs,
  buildSessionSetupBaseSummary,
  buildSessionSetupPlaylistOptions,
  buildSessionSetupTrackOptions,
  resolveSessionSetupBaseEmptyState,
} from "../../../src/features/session/sessionSetupBaseSelectionCardRuntime";

describe("sessionSetupBaseSelectionCardRuntime", () => {
  it("builds tabs and empty states deterministically", () => {
    const tabs = buildSessionSetupBaseModeTabs({
      t: en,
      baseMode: "track",
      trackCount: 0,
      playlistCount: 2,
    });

    expect(tabs[0]).toEqual({
      id: "track",
      label: en.session.track,
      active: true,
      disabled: true,
    });
    expect(
      resolveSessionSetupBaseEmptyState({
        t: en,
        baseMode: "track",
        trackCount: 0,
        playlistCount: 2,
      }),
    ).toBe(en.session.noTracks);
  });

  it("builds track and playlist options plus summary", () => {
    const trackOptions = buildSessionSetupTrackOptions({
      tracks: [
        {
          id: "track-1",
          tags: { title: "Night Ride" },
          file: { sourcePath: "/music/night-ride.wav" },
          sourcePath: "/music/night-ride.wav",
          analysis: { bpm: 125 },
        } as never,
      ],
      selectedTrackId: "track-1",
    });
    const playlistOptions = buildSessionSetupPlaylistOptions({
      playlists: [
        {
          id: "playlist-1",
          name: "Warm Up",
          trackIds: ["track-1"],
        } as never,
      ],
      tracks: [
        {
          id: "track-1",
          tags: { title: "Night Ride" },
          file: { sourcePath: "/music/night-ride.wav" },
          sourcePath: "/music/night-ride.wav",
          analysis: { bpm: 125 },
        } as never,
      ],
      selectedPlaylistId: "playlist-1",
      t: en,
    });
    const summary = buildSessionSetupBaseSummary({
      t: en,
      selectedBaseLabel: "Night Ride",
      selectedBaseDetail: "125 BPM",
    });

    expect(trackOptions[0]?.selected).toBe(true);
    expect(trackOptions[0]?.detail).toBe("125 BPM");
    expect(playlistOptions[0]?.selected).toBe(true);
    expect(playlistOptions[0]?.detail).toContain("125 BPM");
    expect(summary?.title).toBe("Night Ride");
  });
});
