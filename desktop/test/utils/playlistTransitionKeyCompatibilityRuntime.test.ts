import { describe, expect, it } from "vitest";

import { resolveParsedPlaylistHarmonicLabel } from "../../src/utils/playlistTransitionKeyCompatibilityRuntime";

describe("playlistTransitionKeyCompatibilityRuntime", () => {
  it("resolves same-key, relative, adjacent, free-mix, and open-key labels", () => {
    expect(
      resolveParsedPlaylistHarmonicLabel(
        { pitchClass: 0, mode: "major", camelot: "8B" },
        { pitchClass: 0, mode: "major", camelot: "8B" },
      ),
    ).toEqual({ label: "Same key 8B", score: 3 });

    expect(
      resolveParsedPlaylistHarmonicLabel(
        { pitchClass: 0, mode: "major", camelot: "8B" },
        { pitchClass: 9, mode: "minor", camelot: "8A" },
      ),
    ).toEqual({ label: "Relative 8A", score: 2 });

    expect(
      resolveParsedPlaylistHarmonicLabel(
        { pitchClass: 0, mode: "major", camelot: "8B" },
        { pitchClass: 7, mode: "major", camelot: "9B" },
      ),
    ).toEqual({ label: "Adjacent 9B", score: 2 });

    expect(
      resolveParsedPlaylistHarmonicLabel(
        { pitchClass: 0, mode: "major", camelot: "8B" },
        { pitchClass: 4, mode: "major", camelot: "12B" },
      ),
    ).toEqual({ label: "Free mix 12B", score: 1 });

    expect(resolveParsedPlaylistHarmonicLabel(null, null)).toEqual({
      label: "Open key",
      score: 0,
    });
  });
});
