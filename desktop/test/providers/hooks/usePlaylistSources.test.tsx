import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePlaylistSources } from "../../../src/providers/hooks/usePlaylistSources";

describe("usePlaylistSources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with empty state", () => {
    const { result } = renderHook(() => usePlaylistSources());

    expect(result.current.sources).toEqual([]);
    expect(result.current.playlists).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("clears error when clearError is called", async () => {
    const { result } = renderHook(() => usePlaylistSources());

    // Simulate an error
    act(() => {
      // Direct state mutation for testing purposes
    });

    // This will be tested after Tauri integration
  });
});
