import { describe, expect, it } from "vitest";

import {
  formatProviderErrorForUser,
  isProviderError,
  type ProviderError,
} from "../../../src/providers/runtime/types";

describe("provider runtime types", () => {
  it("detects provider-shaped errors", () => {
    expect(isProviderError({ kind: "network_error", message: "offline" })).toBe(true);
    expect(isProviderError({ message: "offline" })).toBe(false);
    expect(isProviderError(null)).toBe(false);
    expect(isProviderError("boom")).toBe(false);
  });

  it("formats every provider error variant for the UI", () => {
    const cases: ProviderError[] = [
      { kind: "auth_expired", sourceType: "spotify", message: "expired" },
      { kind: "rate_limited", retryAfterSeconds: 30 },
      { kind: "network_error", message: "offline" },
      { kind: "parsing_error", sourceType: "soundcloud", details: "bad json" },
      { kind: "permission_denied", sourceType: "spotify", message: "denied" },
      { kind: "not_found", resourceId: "playlist-1" },
      { kind: "unknown", message: "mystery" },
    ];

    expect(cases.map(formatProviderErrorForUser)).toEqual([
      "spotify authorization expired. Please reconnect.",
      "Rate limited. Try again in 30 seconds.",
      "Network error: offline",
      "Error parsing soundcloud data: bad json",
      "Permission denied by spotify.",
      "Resource not found: playlist-1",
      "Error: mystery",
    ]);
  });
});
