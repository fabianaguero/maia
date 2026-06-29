import { describe, expect, it } from "vitest";

import {
  buildMonitorPreviewEndedState,
  buildMonitorTrackAudioResetState,
  buildMonitorTrackProgressState,
  resolveMonitorPreviewAction,
  shouldBindMonitorBackgroundTrack,
  shouldStartMonitorProgressLoop,
} from "../../../src/features/simple/monitorTrackAudioOrchestrationRuntime";

describe("monitorTrackAudioOrchestrationRuntime", () => {
  it("resolves preview actions deterministically", () => {
    expect(
      resolveMonitorPreviewAction({
        playablePath: null,
        previewTrackId: null,
        nextTrackId: "track-1",
        hasPreviewAudio: false,
      }),
    ).toBe("skip");

    expect(
      resolveMonitorPreviewAction({
        playablePath: "/music/track-1.wav",
        previewTrackId: "track-1",
        nextTrackId: "track-1",
        hasPreviewAudio: true,
      }),
    ).toBe("stop-current-preview");

    expect(
      resolveMonitorPreviewAction({
        playablePath: "/music/track-2.wav",
        previewTrackId: "track-1",
        nextTrackId: "track-2",
        hasPreviewAudio: true,
      }),
    ).toBe("replace-preview");

    expect(
      resolveMonitorPreviewAction({
        playablePath: "/music/track-3.wav",
        previewTrackId: null,
        nextTrackId: "track-3",
        hasPreviewAudio: false,
      }),
    ).toBe("start");
  });

  it("builds reset and ended state snapshots", () => {
    expect(buildMonitorPreviewEndedState()).toEqual({
      previewTrackId: null,
      previewUrl: null,
      clearPreviewAudio: true,
    });

    expect(buildMonitorTrackAudioResetState()).toEqual({
      trackWaveProgress: 0,
      trackElapsedSeconds: 0,
      trackDurationSeconds: null,
      clearBackgroundAudio: true,
      clearBackgroundUrl: true,
    });
  });

  it("guards progress/background loops and maps snapshot state", () => {
    expect(
      shouldBindMonitorBackgroundTrack({
        safeRuntime: false,
        isListening: true,
        hasActiveTrack: true,
      }),
    ).toBe(true);
    expect(
      shouldBindMonitorBackgroundTrack({
        safeRuntime: true,
        isListening: true,
        hasActiveTrack: true,
      }),
    ).toBe(false);
    expect(
      shouldStartMonitorProgressLoop({
        safeRuntime: false,
        isListening: true,
      }),
    ).toBe(true);
    expect(
      shouldStartMonitorProgressLoop({
        safeRuntime: false,
        isListening: false,
      }),
    ).toBe(false);

    expect(
      buildMonitorTrackProgressState({
        progress: 0.25,
        elapsedSeconds: 30,
        durationSeconds: 120,
      }),
    ).toEqual({
      trackWaveProgress: 0.25,
      trackElapsedSeconds: 30,
      trackDurationSeconds: 120,
    });
    expect(buildMonitorTrackProgressState(null)).toBeNull();
  });
});
