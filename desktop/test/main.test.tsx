import { beforeEach, describe, expect, it, vi } from "vitest";

const { renderDesktopAppSpy } = vi.hoisted(() => ({
  renderDesktopAppSpy: vi.fn(),
}));

vi.mock("../src/mainRuntime", () => ({
  renderDesktopApp: renderDesktopAppSpy,
}));

describe("main", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    renderDesktopAppSpy.mockClear();
  });

  it("boots the app with the root element", async () => {
    await import("../src/main");

    expect(renderDesktopAppSpy).toHaveBeenCalledWith(document.getElementById("root"));
  });
});
