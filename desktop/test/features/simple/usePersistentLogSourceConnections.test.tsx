import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePersistentLogSourceConnections } from "../../../src/features/simple/usePersistentLogSourceConnections";

const repositoriesMock = vi.hoisted(() => ({
  listLogSourceConnections: vi.fn(),
}));

vi.mock("../../../src/api/repositories", () => repositoriesMock);

describe("usePersistentLogSourceConnections", () => {
  beforeEach(() => {
    repositoriesMock.listLogSourceConnections.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads and normalizes saved connections", async () => {
    repositoriesMock.listLogSourceConnections.mockResolvedValue([{ id: "cloud-1" }]);

    const { result } = renderHook(() => usePersistentLogSourceConnections());

    await waitFor(() => {
      expect(result.current).toEqual([{ id: "cloud-1" }]);
    });
  });

  it("falls back to an empty list when loading fails", async () => {
    repositoriesMock.listLogSourceConnections.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => usePersistentLogSourceConnections());

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });
});
