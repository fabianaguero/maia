import { describe, expect, it, vi } from "vitest";

import { createGuideTrackDecodeCache } from "../../../src/features/monitor/monitorGuideTrackDecodeRuntime";
import { decodeGuideTrackPcm } from "../../../src/features/monitor/monitorGuideTrackPcmDecodeRuntime";
import type { GuideTrackDecodeDependencies } from "../../../src/features/monitor/monitorGuideTrackDecodeTypes";

function createDependencies(
  overrides: Partial<GuideTrackDecodeDependencies> = {},
): GuideTrackDecodeDependencies {
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
    convertFileSrc: vi.fn(),
    fetchAudio: vi.fn(),
    invokeReadAudioBytes: vi.fn(),
    decodeBase64: vi.fn(),
    createOfflineAudioContext: vi.fn(() => ({
      decodeAudioData,
    })),
    ...overrides,
  };
}

describe("monitorGuideTrackPcmDecodeRuntime", () => {
  it("decodes stereo buffers into mono PCM metadata", async () => {
    const dependencies = createDependencies();

    const decoded = await decodeGuideTrackPcm({
      arrayBuffer: new Uint8Array([1, 2, 3, 4]).buffer,
      dependencies,
    });

    expect(Array.from(decoded.samples)).toEqual(
      expect.arrayContaining([
        expect.closeTo(0.3, 6),
        expect.closeTo(0.5, 6),
        expect.closeTo(0.7, 6),
        expect.closeTo(0.9, 6),
      ]),
    );
    expect(decoded.sampleRate).toBe(2);
    expect(decoded.durationSec).toBe(2);
  });
});
