import { describe, expect, it } from "vitest";

import {
  resolveGuideTrackLoadFailureOutcome,
  resolveGuideTrackLoadSuccessOutcome,
} from "../../../src/features/monitor/monitorGuideTrackLoadOutcomeRuntime";

describe("monitorGuideTrackLoadOutcomeRuntime", () => {
  it("resolves ready vs superseded decode success outcomes", () => {
    const pcm = {
      samples: new Float32Array([0.1, 0.2, 0.3]),
      sampleRate: 44100,
      durationSec: 3,
    };

    expect(
      resolveGuideTrackLoadSuccessOutcome({
        accepted: true,
        requestedPath: "/audio/a.wav",
        currentPath: "/audio/a.wav",
        pcm,
      }),
    ).toEqual({
      kind: "ready",
      durationLabel: "3.00",
      sampleCount: 3,
    });

    expect(
      resolveGuideTrackLoadSuccessOutcome({
        accepted: false,
        requestedPath: "/audio/a.wav",
        currentPath: "/audio/other.wav",
        pcm,
      }),
    ).toEqual({
      kind: "superseded",
      requestedPath: "/audio/a.wav",
      currentPath: "/audio/other.wav",
    });
  });

  it("resolves ignored vs failed decode error outcomes", () => {
    expect(
      resolveGuideTrackLoadFailureOutcome({
        rejected: false,
        error: new Error("ignored"),
      }),
    ).toEqual({ kind: "ignored" });

    expect(
      resolveGuideTrackLoadFailureOutcome({
        rejected: true,
        error: new Error("decode failed"),
      }),
    ).toEqual({
      kind: "failed",
      message: "decode failed",
    });
  });
});
