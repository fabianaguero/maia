import { describe, expect, it } from "vitest";

import {
  normalizePlaylistKeyNote,
  resolvePlaylistCamelotLabel,
  resolvePlaylistKeyMode,
  resolvePlaylistPitchClass,
} from "../../src/utils/playlistTransitionKeyDomainRuntime";

describe("playlistTransitionKeyDomainRuntime", () => {
  it("normalizes note tokens and resolves pitch classes", () => {
    expect(normalizePlaylistKeyNote("gb")).toBe("Gb");
    expect(resolvePlaylistPitchClass("Gb")).toBe(6);
    expect(resolvePlaylistPitchClass("H")).toBeNull();
  });

  it("resolves major/minor modes and Camelot labels safely", () => {
    expect(resolvePlaylistKeyMode(undefined)).toBe("major");
    expect(resolvePlaylistKeyMode("min")).toBe("minor");
    expect(resolvePlaylistCamelotLabel({ pitchClass: 0, mode: "major" })).toBe("8B");
    expect(resolvePlaylistCamelotLabel({ pitchClass: 9, mode: "minor" })).toBe("8A");
    expect(resolvePlaylistCamelotLabel({ pitchClass: 99, mode: "major" })).toBeNull();
  });
});
