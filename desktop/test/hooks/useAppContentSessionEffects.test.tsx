import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAppContentSessionEffects } from "../../src/hooks/useAppContentSessionEffects";

describe("useAppContentSessionEffects", () => {
  it("refreshes session bookmarks only when the session screen is active", () => {
    const refreshSessionBookmarks = vi.fn(async () => undefined);

    const { rerender } = renderHook(
      ({ screen }) =>
        useAppContentSessionEffects({
          screen,
          refreshSessionBookmarks,
        }),
      {
        initialProps: {
          screen: "library" as const,
        },
      },
    );

    expect(refreshSessionBookmarks).not.toHaveBeenCalled();

    rerender({ screen: "session" });

    expect(refreshSessionBookmarks).toHaveBeenCalledTimes(1);
  });
});
