import { describe, expect, it } from "vitest";

import {
  DEFAULT_PLAYLIST_CROSSFADE_SECONDS,
  resolveNextPlaylistIndex,
  resolvePlaylistCrossfadeSeconds,
  resolvePlaylistTransitionDelayMs,
} from "../../src/utils/playlistRuntime";

describe("playlist runtime utils", () => {
  it("wraps playlist indices for the next queued track", () => {
    expect(resolveNextPlaylistIndex(0, 3)).toBe(1);
    expect(resolveNextPlaylistIndex(2, 3)).toBe(0);
    expect(resolveNextPlaylistIndex(-3, 3)).toBe(1);
    expect(resolveNextPlaylistIndex(0, 1)).toBe(0);
    expect(resolveNextPlaylistIndex(Number.NaN, 3)).toBeNull();
    expect(resolveNextPlaylistIndex(0, 0)).toBeNull();
  });

  it("clamps crossfade length to a safe fraction of track duration", () => {
    expect(resolvePlaylistCrossfadeSeconds(120)).toBe(DEFAULT_PLAYLIST_CROSSFADE_SECONDS);
    expect(resolvePlaylistCrossfadeSeconds(8)).toBe(2);
    expect(resolvePlaylistCrossfadeSeconds(2)).toBe(0.8);
    expect(resolvePlaylistCrossfadeSeconds(4, 0.5)).toBe(0.5);
    expect(resolvePlaylistCrossfadeSeconds(Number.NaN)).toBe(0);
  });

  it("computes transition delay from track duration minus crossfade window", () => {
    expect(resolvePlaylistTransitionDelayMs(120, 6)).toBe(114000);
    expect(resolvePlaylistTransitionDelayMs(4, 1)).toBe(3000);
    expect(resolvePlaylistTransitionDelayMs(4, 6)).toBe(250);
    expect(resolvePlaylistTransitionDelayMs(Number.NaN, 6)).toBe(250);
  });
});
