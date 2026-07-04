import { describe, expect, it } from "vitest";

import { normalizePersistentLogSourceConnections } from "../../../src/features/simple/persistentLogSourceConnectionsRuntime";

describe("persistentLogSourceConnectionsRuntime", () => {
  it("returns the original list when the input is an array", () => {
    const connections = [{ id: "cloud-1" }, { id: "cloud-2" }];

    expect(normalizePersistentLogSourceConnections(connections)).toBe(connections);
  });

  it("falls back to an empty list for non-array payloads", () => {
    expect(normalizePersistentLogSourceConnections(null)).toEqual([]);
    expect(normalizePersistentLogSourceConnections({ invalid: true })).toEqual([]);
  });
});
