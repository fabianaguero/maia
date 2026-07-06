import { describe, expect, it, vi } from "vitest";

import { createGuideTrackDecodeCache } from "../../../src/features/monitor/monitorGuideTrackDecodeRuntime";
import { loadGuideTrackArrayBuffer } from "../../../src/features/monitor/monitorGuideTrackDecodeTransportRuntime";
import type { GuideTrackDecodeDependencies } from "../../../src/features/monitor/monitorGuideTrackDecodeTypes";

function createDependencies(
  overrides: Partial<GuideTrackDecodeDependencies> = {},
): GuideTrackDecodeDependencies {
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
    createOfflineAudioContext: vi.fn(),
    ...overrides,
  };
}

describe("monitorGuideTrackDecodeTransportRuntime", () => {
  it("loads bytes through fetch and falls back to IPC in tauri", async () => {
    const fetchDependencies = createDependencies();
    const fetchBuffer = await loadGuideTrackArrayBuffer("/tracks/a.wav", fetchDependencies);
    expect(fetchBuffer.byteLength).toBe(4);

    const ipcDependencies = createDependencies({
      fetchAudio: vi.fn(async () => {
        throw new Error("transport failed");
      }),
    });
    const ipcBuffer = await loadGuideTrackArrayBuffer("/tracks/a.wav", ipcDependencies);
    expect(ipcDependencies.invokeReadAudioBytes).toHaveBeenCalledWith("/tracks/a.wav");
    expect(ipcBuffer.byteLength).toBe(4);
  });

  it("throws a browser-facing error when no tauri transport exists", async () => {
    const browserDependencies = createDependencies({
      isTauri: () => false,
      fetchAudio: vi.fn(async () => {
        throw new Error("no file");
      }),
    });

    await expect(
      loadGuideTrackArrayBuffer("/tracks/browser.wav", browserDependencies),
    ).rejects.toThrow("Audio file not available in browser environment");
  });
});
