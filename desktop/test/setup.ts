import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

/**
 * Mock HTMLMediaElement methods not implemented by jsdom
 */
HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
HTMLMediaElement.prototype.pause = vi.fn();
HTMLMediaElement.prototype.load = vi.fn();

/**
 * Mock window.MediaSource if not available
 */
if (typeof window.MediaSource === "undefined") {
  (window as any).MediaSource = class MediaSource {
    addSourceBuffer() {
      return {
        appendBuffer: vi.fn(),
        remove: vi.fn(),
      };
    }
  };
}

/**
 * Mock URL APIs if needed
 */
if (typeof URL.createObjectURL === "undefined") {
  (URL as any).createObjectURL = vi.fn(() => "blob:mock-url");
}
if (typeof URL.revokeObjectURL === "undefined") {
  (URL as any).revokeObjectURL = vi.fn();
}

/**
 * Mock Tauri window properties for tests
 * This allows the bridge detection to work in jsdom environment
 */
(window as any).__TAURI_INTERNALS__ = {
  invoke: vi.fn(),
};

const mockCanvasGradient = {
  addColorStop: vi.fn(),
};

const mockCanvasContext = {
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  strokeRect: vi.fn(),
  arc: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  setTransform: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  createLinearGradient: vi.fn(() => mockCanvasGradient),
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 1,
  font: "",
  globalAlpha: 1,
  globalCompositeOperation: "source-over",
};

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  value: vi.fn(() => mockCanvasContext),
});
