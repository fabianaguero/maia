import { describe, expect, it } from "vitest";

import {
  parsePlaylistKeySignature,
  resolvePlaylistCamelotNumber,
} from "../../src/utils/playlistTransitionKeyParsingRuntime";

describe("playlistTransitionKeyParsingRuntime", () => {
  it("parses supported key signatures into normalized Camelot metadata", () => {
    expect(parsePlaylistKeySignature("C major")).toEqual({
      pitchClass: 0,
      mode: "major",
      camelot: "8B",
    });

    expect(parsePlaylistKeySignature("a min")).toEqual({
      pitchClass: 9,
      mode: "minor",
      camelot: "8A",
    });

    expect(parsePlaylistKeySignature("Gb")).toEqual({
      pitchClass: 6,
      mode: "major",
      camelot: "2B",
    });
  });

  it("rejects malformed keys and resolves numeric Camelot values safely", () => {
    expect(parsePlaylistKeySignature("???")).toBeNull();
    expect(parsePlaylistKeySignature("H major")).toBeNull();
    expect(resolvePlaylistCamelotNumber("8B")).toBe(8);
    expect(resolvePlaylistCamelotNumber("bad")).toBeNull();
  });
});
