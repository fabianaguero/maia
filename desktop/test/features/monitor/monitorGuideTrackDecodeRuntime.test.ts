import { describe, expect, it, vi } from "vitest";

import {
  createGuideTrackDecodeCache,
  decodeGuideTrackFile,
} from "../../../src/features/monitor/monitorGuideTrackDecodeRuntime";

function createDependencies(overrides: Partial<Parameters<typeof decodeGuideTrackFile>[1]> = {}) {
  const decodeAudioData = vi.fn(async () => ({
    length: 4,
    numberOfChannels: 2,
    sampleRate: 2,
    getChannelData: (channel: number) =>
      channel === 0 ? new Float32Array([0.2, 0.4, 0.6, 0.8]) : new Float32Array([0.4, 0.6, 0.8, 1]),
  }));

  return {
    cache: createGuideTrackDecodeCache(),
    logger: { info: vi.fn() },
    isTauri: () => true,
    convertFileSrc: (path: string) => `asset://${path}`,
    fetchAudio: vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
    })),
    invokeReadAudioBytes: vi.fn(async () => "AQIDBA=="),
    decodeBase64: vi.fn((value: string) => Buffer.from(value, "base64").toString("binary")),
    createOfflineAudioContext: vi.fn(() => ({
      decodeAudioData,
    })),
    ...overrides,
  };
}

describe("monitorGuideTrackDecodeRuntime", () => {
  it("decodes guide tracks through fetch and caches the result by path", async () => {
    const dependencies = createDependencies();

    const first = await decodeGuideTrackFile("/tracks/a.wav", dependencies);
    const second = await decodeGuideTrackFile("/tracks/a.wav", dependencies);

    expect(first).toBe(second);
    expect(dependencies.fetchAudio).toHaveBeenCalledTimes(1);
    expect(dependencies.createOfflineAudioContext).toHaveBeenCalledTimes(1);
    expect(Array.from(first.samples)).toEqual(
      expect.arrayContaining([
        expect.closeTo(0.3, 6),
        expect.closeTo(0.5, 6),
        expect.closeTo(0.7, 6),
        expect.closeTo(0.9, 6),
      ]),
    );
    expect(first.sampleRate).toBe(2);
    expect(first.durationSec).toBe(2);
  });

  it("falls back to IPC bytes when fetch transport fails in Tauri", async () => {
    const dependencies = createDependencies({
      fetchAudio: vi.fn(async () => {
        throw new Error("transport failed");
      }),
      createOfflineAudioContext: vi.fn(() => ({
        decodeAudioData: vi.fn(async () => ({
          length: 2,
          numberOfChannels: 1,
          sampleRate: 2,
          getChannelData: () => new Float32Array([0.5, 0.25]),
        })),
      })),
    });

    const decoded = await decodeGuideTrackFile("/tracks/fallback.wav", dependencies);

    expect(dependencies.invokeReadAudioBytes).toHaveBeenCalledWith("/tracks/fallback.wav");
    expect(dependencies.decodeBase64).toHaveBeenCalledWith("AQIDBA==");
    expect(Array.from(decoded.samples)).toEqual([0.5, 0.25]);
  });

  it("throws a browser-facing error when no tauri transport is available", async () => {
    const dependencies = createDependencies({
      isTauri: () => false,
      fetchAudio: vi.fn(async () => {
        throw new Error("no file");
      }),
    });

    await expect(decodeGuideTrackFile("/tracks/browser.wav", dependencies)).rejects.toThrow(
      "Audio file not available in browser environment",
    );
  });
});
