import { describe, expect, it, vi } from "vitest";

const { createRootSpy, renderSpy } = vi.hoisted(() => {
  const render = vi.fn();
  return {
    renderSpy: render,
    createRootSpy: vi.fn(() => ({ render })),
  };
});

vi.mock("react-dom/client", () => ({
  default: {
    createRoot: createRootSpy,
  },
  createRoot: createRootSpy,
}));

import { renderDesktopApp } from "../src/mainRuntime";

describe("mainRuntime", () => {
  it("boots the desktop app into a root element", () => {
    const root = document.createElement("div");

    renderDesktopApp(root);

    expect(createRootSpy).toHaveBeenCalledWith(root);
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });
});
