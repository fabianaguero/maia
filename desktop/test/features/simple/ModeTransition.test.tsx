import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  userMode: "simple" as "simple" | "expert",
}));

vi.mock("../../../src/features/simple/UserModeContext", () => ({
  useUserMode: () => ({
    userMode: mockState.userMode,
    setUserMode: vi.fn(),
  }),
}));

import { useModeTransition } from "../../../src/features/simple/ModeTransition";

describe("useModeTransition", () => {
  beforeEach(() => {
    mockState.userMode = "simple";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in transition and settles after the debounce window", async () => {
    const { result } = renderHook(() => useModeTransition());

    expect(result.current.userMode).toBe("simple");
    expect(result.current.isTransitioning).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(result.current.isTransitioning).toBe(false);
  });

  it("re-enters transition mode when the user mode changes", async () => {
    const { result, rerender } = renderHook(() => useModeTransition());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(result.current.isTransitioning).toBe(false);

    mockState.userMode = "expert";
    rerender();

    expect(result.current.userMode).toBe("expert");
    expect(result.current.isTransitioning).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(result.current.isTransitioning).toBe(false);
  });
});
