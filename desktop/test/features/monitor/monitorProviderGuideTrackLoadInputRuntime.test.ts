import { describe, expect, it, vi } from "vitest";

const decodeGuideTrackFile = vi.fn(async () => ({
  samples: new Float32Array([0, 1]),
  sampleRate: 44100,
  durationSec: 0.1,
}));

vi.mock("../../../src/features/monitor/monitorGuideTrackDecodeRuntime", () => ({
  decodeGuideTrackFile: (...args: unknown[]) => decodeGuideTrackFile(...args),
  isTauriRuntime: vi.fn(() => true),
}));

vi.mock("../../../src/api/tauri", () => ({
  invoke: vi.fn(async () => "Zm9v"),
}));

vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: vi.fn((path: string) => `asset://${path}`),
}));

import {
  buildMonitorProviderGuideTrackDecodeDependencies,
  buildMonitorProviderGuideTrackLoadStateInput,
} from "../../../src/features/monitor/monitorProviderGuideTrackLoadInputRuntime";

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  };
}

describe("monitorProviderGuideTrackLoadInputRuntime", () => {
  it("builds decode dependencies with cache, fetch and tauri bridges", async () => {
    const cache = new Map();
    const logger = createLogger();

    const result = buildMonitorProviderGuideTrackDecodeDependencies({
      cache,
      logger,
    });

    expect(result.cache).toBe(cache);
    expect(result.logger).toBe(logger);
    expect(result.isTauri()).toBe(true);
    expect(result.convertFileSrc("/track.wav")).toBe("asset:///track.wav");
    await expect(result.invokeReadAudioBytes("/track.wav")).resolves.toBe("Zm9v");
    expect(result.decodeBase64("Zm9v")).toBe("foo");
  });

  it("builds load-state input with a decode callback bound to the generated dependencies", async () => {
    const cache = new Map();
    const logger = createLogger();

    const result = buildMonitorProviderGuideTrackLoadStateInput({
      path: "/tracks/a.wav",
      currentPath: null,
      hasGuideTrack: false,
      hasPendingLoad: false,
      audioContextRef: { current: null },
      currentSegmentRef: { current: null },
      guideTrackPathRef: { current: null },
      guideTrackRef: { current: null },
      guideTrackCursorRef: { current: { current: 0 } },
      guideTrackFinishedRef: { current: false },
      guideTrackLoadPromiseRef: { current: null },
      setGuideTrackReady: vi.fn(),
      setGuideTrackPathState: vi.fn(),
      setGuideTrackDurationSec: vi.fn(),
      cache,
      logger,
    });

    expect(result).toEqual(
      expect.objectContaining({
        path: "/tracks/a.wav",
        currentPath: null,
        hasGuideTrack: false,
        hasPendingLoad: false,
        logger,
        decodeGuideTrack: expect.any(Function),
      }),
    );

    await result.decodeGuideTrack("/tracks/a.wav");
    expect(decodeGuideTrackFile).toHaveBeenCalledWith(
      "/tracks/a.wav",
      expect.objectContaining({
        cache,
        logger,
      }),
    );
  });
});
