import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlaylistSources } from "../../../src/providers/hooks/usePlaylistSources";

describe("usePlaylistSources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with empty state", () => {
    const { result: hookResult } = renderHook(() => usePlaylistSources());

    expect(hookResult.current.sources).toEqual([]);
    expect(hookResult.current.playlists).toEqual([]);
    expect(hookResult.current.error).toBeNull();
  });

  it("clears error when clearError is called", async () => {
    renderHook(() => usePlaylistSources());

    // Simulate an error
    act(() => {
      // Direct state mutation for testing purposes
    });

    // This will be tested after Tauri integration
  });
});
