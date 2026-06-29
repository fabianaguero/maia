import { describe, expect, it } from "vitest";

import { resolveAppV0SectionContentKind } from "../src/appV0SectionViewModel";

describe("appV0SectionViewModel", () => {
  it("routes simple mode sections to the simple content views", () => {
    expect(
      resolveAppV0SectionContentKind({
        currentSection: "monitor",
        userMode: "simple",
      }),
    ).toBe("simple-monitor");
    expect(
      resolveAppV0SectionContentKind({
        currentSection: "library",
        userMode: "simple",
      }),
    ).toBe("simple-library");
  });

  it("routes pro mode sections to the pro content views", () => {
    expect(
      resolveAppV0SectionContentKind({
        currentSection: "monitor",
        userMode: "pro",
      }),
    ).toBe("pro-monitor");
    expect(
      resolveAppV0SectionContentKind({
        currentSection: "library",
        userMode: "pro",
      }),
    ).toBe("pro-library");
  });

  it("keeps shared sections stable across user modes", () => {
    expect(
      resolveAppV0SectionContentKind({
        currentSection: "connections",
        userMode: "simple",
      }),
    ).toBe("connections");
    expect(
      resolveAppV0SectionContentKind({
        currentSection: "setup",
        userMode: "pro",
      }),
    ).toBe("setup");
  });
});
