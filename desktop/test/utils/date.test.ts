import { describe, expect, it } from "vitest";

import { formatShortDate, formatShortDateTime } from "../../src/utils/date";

describe("date utils", () => {
  it("formats ISO and numeric timestamps while rejecting invalid values", () => {
    const isoFormatted = formatShortDateTime("2026-06-30T13:45:00.000Z");
    const numericFormatted = formatShortDate("1719748800000");

    expect(isoFormatted).not.toBe("Unknown");
    expect(numericFormatted).not.toBe("Unknown");
    expect(formatShortDateTime("not-a-date")).toBe("Unknown");
    expect(formatShortDate("not-a-date")).toBe("Unknown");
  });
});
