import { describe, expect, it } from "vitest";

import {
  formatAnomalyCueCode,
  getBasename,
  truncateMiddle,
} from "../../../src/features/simple/monitorDisplay";

describe("monitorDisplay", () => {
  it("returns a neutral placeholder when source metadata is missing", () => {
    expect(getBasename("")).toBe("—");
    expect(getBasename(null)).toBe("—");
    expect(truncateMiddle("")).toBe("—");
    expect(truncateMiddle(undefined)).toBe("—");
  });

  it("preserves basename and truncates long values deterministically", () => {
    expect(getBasename("/logs/visits-service.log")).toBe("visits-service.log");
    expect(truncateMiddle("abcdefghijklmnopqrstuvwxyz", 12)).toBe("abcdefgh...stuvwxyz");
  });

  it("formats anomaly cue codes deterministically", () => {
    expect(formatAnomalyCueCode("marker-1")).toBe("A-1152");
    expect(formatAnomalyCueCode("marker-1")).toBe(formatAnomalyCueCode("marker-1"));
    expect(formatAnomalyCueCode(null)).toBe("A-0000");
  });
});
