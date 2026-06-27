import { describe, expect, it } from "vitest";

import {
  appendToast,
  createToast,
  createToastId,
  removeToastById,
} from "../../src/components/notificationRuntime";

describe("notificationRuntime", () => {
  it("creates compact deterministic toast ids", () => {
    expect(createToastId(0.123456789)).toBe("4fzzzxjyl");
  });

  it("builds and appends toast records", () => {
    const toast = createToast(
      {
        type: "success",
        title: "Track imported",
        message: "Ready for playback",
      },
      0.42,
    );

    expect(appendToast([], toast)).toEqual([toast]);
    expect(toast).toEqual({
      id: "f4bipx4bi",
      type: "success",
      title: "Track imported",
      message: "Ready for playback",
    });
  });

  it("removes a toast by id without mutating other entries", () => {
    const current = [
      createToast({ type: "info", title: "One" }, 0.1),
      createToast({ type: "error", title: "Two" }, 0.2),
    ];

    expect(removeToastById(current, current[0].id)).toEqual([current[1]]);
  });
});
