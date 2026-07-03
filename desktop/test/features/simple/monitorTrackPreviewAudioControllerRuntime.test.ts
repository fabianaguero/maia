import { describe, expect, it, vi } from "vitest";

import {
  applyMonitorPreviewEndedState,
  applyMonitorPreviewPlayFailureState,
  buildMonitorPreviewAudio,
  disposeMonitorPreviewState,
} from "../../../src/features/simple/monitorTrackPreviewAudioControllerRuntime";

class MockAudioElement {
  volume = 0;
  preload = "";
  pause = vi.fn();
  currentTime = 0;
}

describe("monitorTrackPreviewAudioControllerRuntime", () => {
  it("builds preview audio with monitor defaults", () => {
    const createdAudio = new MockAudioElement() as unknown as HTMLAudioElement;

    const audio = buildMonitorPreviewAudio({
      previewUrl: "blob:preview",
      createAudio: vi.fn(() => createdAudio),
    });

    expect(audio).toBe(createdAudio);
    expect(audio.volume).toBe(0.92);
    expect(audio.preload).toBe("auto");
  });

  it("disposes preview state and clears ids and urls", () => {
    const audio = new MockAudioElement() as unknown as HTMLAudioElement;
    const revokePreviewUrl = vi.fn();

    const state = disposeMonitorPreviewState({
      previewAudio: audio,
      previewUrl: "blob:preview",
      revokePreviewUrl,
    });

    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(audio.currentTime).toBe(0);
    expect(revokePreviewUrl).toHaveBeenCalledWith("blob:preview");
    expect(state).toEqual({
      previewAudio: null,
      previewUrl: null,
      previewTrackId: null,
    });
  });

  it("only applies ended state to the active preview audio", () => {
    const activeAudio = new MockAudioElement() as unknown as HTMLAudioElement;
    const staleAudio = new MockAudioElement() as unknown as HTMLAudioElement;
    const revokePreviewUrl = vi.fn();

    const staleState = applyMonitorPreviewEndedState({
      currentPreviewAudio: activeAudio,
      endedAudio: staleAudio,
      currentPreviewUrl: "blob:preview",
      revokePreviewUrl,
    });

    expect(staleState.shouldApply).toBe(false);
    expect(revokePreviewUrl).not.toHaveBeenCalled();

    const activeState = applyMonitorPreviewEndedState({
      currentPreviewAudio: activeAudio,
      endedAudio: activeAudio,
      currentPreviewUrl: "blob:preview",
      revokePreviewUrl,
    });

    expect(activeState).toEqual({
      shouldApply: true,
      previewAudio: null,
      previewUrl: null,
      previewTrackId: null,
    });
    expect(revokePreviewUrl).toHaveBeenCalledWith("blob:preview");
  });

  it("clears preview state after a play failure", () => {
    const activeAudio = new MockAudioElement() as unknown as HTMLAudioElement;
    const revokePreviewUrl = vi.fn();

    const state = applyMonitorPreviewPlayFailureState({
      currentPreviewAudio: activeAudio,
      failedAudio: activeAudio,
      currentPreviewUrl: "blob:preview",
      revokePreviewUrl,
    });

    expect(state).toEqual({
      previewAudio: null,
      previewUrl: null,
      previewTrackId: null,
    });
    expect(revokePreviewUrl).toHaveBeenCalledWith("blob:preview");
  });
});
