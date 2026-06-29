import { describe, expect, it } from "vitest";

import {
  countMissingLibraryTracks,
  resolveRepositoryCleanupCandidates,
  resolveTrackCleanupCandidates,
} from "../../../src/features/library/libraryScreenToolbarRuntime";

describe("libraryScreenToolbarRuntime", () => {
  it("counts missing tracks from the library file availability state", () => {
    expect(
      countMissingLibraryTracks([
        { file: { availabilityState: "missing" } },
        { file: { availabilityState: "available" } },
        { file: { availabilityState: "missing" } },
      ] as never),
    ).toBe(2);
  });

  it("derives cleanup candidates for unanalyzed tracks and repositories", () => {
    expect(
      resolveTrackCleanupCandidates([
        { id: "track-1", analysis: { bpm: null } },
        { id: "track-2", analysis: { bpm: 126 } },
        { id: "track-3", analysis: { bpm: 0 } },
      ] as never),
    ).toEqual(["track-1", "track-3"]);

    expect(
      resolveRepositoryCleanupCandidates([
        { id: "repo-1", suggestedBpm: null },
        { id: "repo-2", suggestedBpm: 124 },
      ] as never),
    ).toEqual(["repo-1"]);
  });
});
