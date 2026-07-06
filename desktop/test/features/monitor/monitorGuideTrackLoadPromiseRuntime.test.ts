import { describe, expect, it, vi } from "vitest";

import { createGuideTrackLoadPromise } from "../../../src/features/monitor/monitorGuideTrackLoadPromiseRuntime";

describe("monitorGuideTrackLoadPromiseRuntime", () => {
  it("routes decode success and failure through dedicated callbacks", async () => {
    const pcm = {
      samples: new Float32Array([0.1, 0.2]),
      sampleRate: 44100,
      durationSec: 2,
    };
    const onDecodeSuccess = vi.fn();
    const onDecodeFailure = vi.fn();

    await createGuideTrackLoadPromise({
      requestedPath: "/audio/a.wav",
      decodeGuideTrack: vi.fn(async () => pcm),
      onDecodeSuccess,
      onDecodeFailure,
    });

    expect(onDecodeSuccess).toHaveBeenCalledWith(pcm);
    expect(onDecodeFailure).not.toHaveBeenCalled();

    await createGuideTrackLoadPromise({
      requestedPath: "/audio/b.wav",
      decodeGuideTrack: vi.fn(async () => {
        throw new Error("decode failed");
      }),
      onDecodeSuccess,
      onDecodeFailure,
    });

    expect(onDecodeFailure).toHaveBeenCalledWith(expect.any(Error));
  });
});
