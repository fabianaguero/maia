import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorResetActions } from "../../../../src/features/analyzer/components/useLiveLogMonitorResetActions";

function createInput() {
  return {
    knownComponentsRef: { current: ["http", "db"] },
    beatClockRef: { current: { originTime: 12, bpm: 126 } },
    beatLooperRef: { current: { cancelled: false } },
    panelAudioProbePlayedRef: { current: true },
    bounceCuesRef: { current: [[{ id: "cue-1" }]] },
    setLastUpdate: vi.fn(),
    setEmittedCueCount: vi.fn(),
    setEmittedVoiceCount: vi.fn(),
    setRecentCues: vi.fn(),
    setRecentVoices: vi.fn(),
    setRecentMarkers: vi.fn(),
    setRecentExplanations: vi.fn(),
    setSelectedExplanationId: vi.fn(),
    setBackgroundPlayheadSecond: vi.fn(),
    setRecentWarnings: vi.fn(),
    setSyncTailRows: vi.fn(),
    setActiveTailWindowId: vi.fn(),
    setError: vi.fn(),
    setKnownComponents: vi.fn(),
    setComponentOverrides: vi.fn(),
    setSceneBaseAssetId: vi.fn(),
    setSceneCompositionId: vi.fn(),
    setBasePlaylist: vi.fn(),
    setSelectedStyleProfileId: vi.fn(),
    setSelectedMutationProfileId: vi.fn(),
    setMasterVolume: vi.fn(),
    setPendingAddTrackId: vi.fn(),
    setPendingLoadPlaylistId: vi.fn(),
    setBeatClockBpm: vi.fn(),
    setBackgroundNowPlayingId: vi.fn(),
    setBackgroundTransitionPlan: vi.fn(),
    setLiveMutationState: vi.fn(),
    setForcedLiveMutationState: vi.fn(),
    setBeatLooperActive: vi.fn(),
    setIsStarting: vi.fn(),
    setBounceWindowCount: vi.fn(),
    stopBeatLooper: vi.fn(),
  };
}

describe("useLiveLogMonitorResetActions", () => {
  it("applies a full repository reset across live state, deck state and refs", () => {
    const input = createInput();
    const { result } = renderHook(() => useLiveLogMonitorResetActions(input));

    const repositoryResetState = {
      sceneBaseAssetId: "base-2",
      sceneCompositionId: "comp-3",
      basePlaylist: { trackIds: ["track-1"] },
      selectedStyleProfileId: "style-2",
      selectedMutationProfileId: "mutation-4",
      masterVolume: 0.33,
      pendingAddTrackId: "track-9",
      pendingLoadPlaylistId: "playlist-2",
      backgroundNowPlayingId: "track-2",
      backgroundTransitionPlan: { toTrackId: "track-2" },
      liveMutationState: { pressure: 0.4 },
      forcedLiveMutationState: { enabled: true },
    } as never;

    act(() => {
      result.current.applyRepositoryReset(repositoryResetState);
    });

    expect(input.setLastUpdate).toHaveBeenCalledWith(null);
    expect(input.setEmittedCueCount).toHaveBeenCalledWith(0);
    expect(input.setEmittedVoiceCount).toHaveBeenCalledWith(0);
    expect(input.setRecentCues).toHaveBeenCalledWith([]);
    expect(input.setRecentVoices).toHaveBeenCalledWith([]);
    expect(input.setRecentMarkers).toHaveBeenCalledWith([]);
    expect(input.setRecentExplanations).toHaveBeenCalledWith([]);
    expect(input.setSelectedExplanationId).toHaveBeenCalledWith(null);
    expect(input.setBackgroundPlayheadSecond).toHaveBeenCalledWith(0);
    expect(input.setRecentWarnings).toHaveBeenCalledWith([]);
    expect(input.setSyncTailRows).toHaveBeenCalledWith([]);
    expect(input.setActiveTailWindowId).toHaveBeenCalledWith(null);
    expect(input.setError).toHaveBeenCalledWith(null);
    expect(input.knownComponentsRef.current).toEqual([]);
    expect(input.setKnownComponents).toHaveBeenCalledWith([]);
    expect(input.setComponentOverrides).toHaveBeenCalledWith(new Map());
    expect(input.setSceneBaseAssetId).toHaveBeenCalledWith("base-2");
    expect(input.setSceneCompositionId).toHaveBeenCalledWith("comp-3");
    expect(input.setBasePlaylist).toHaveBeenCalledWith({ trackIds: ["track-1"] });
    expect(input.setSelectedStyleProfileId).toHaveBeenCalledWith("style-2");
    expect(input.setSelectedMutationProfileId).toHaveBeenCalledWith("mutation-4");
    expect(input.setMasterVolume).toHaveBeenCalledWith(0.33);
    expect(input.setPendingAddTrackId).toHaveBeenCalledWith("track-9");
    expect(input.setPendingLoadPlaylistId).toHaveBeenCalledWith("playlist-2");
    expect(input.beatClockRef.current).toBeNull();
    expect(input.setBeatClockBpm).toHaveBeenCalledWith(null);
    expect(input.setBackgroundNowPlayingId).toHaveBeenCalledWith("track-2");
    expect(input.setBackgroundTransitionPlan).toHaveBeenCalledWith({ toTrackId: "track-2" });
    expect(input.setLiveMutationState).toHaveBeenCalledWith({ pressure: 0.4 });
    expect(input.setForcedLiveMutationState).toHaveBeenCalledWith({ enabled: true });
    expect(input.stopBeatLooper).toHaveBeenCalledTimes(1);
    expect(input.setBeatLooperActive).toHaveBeenCalledWith(false);
  });

  it("applies the start reset for a fresh session boot", () => {
    const input = createInput();
    const { result } = renderHook(() => useLiveLogMonitorResetActions(input));

    act(() => {
      result.current.applyStartReset({
        emittedCueCount: 6,
        backgroundPlayheadSecond: 48,
        activeTailWindowId: "window-4",
        error: "soft warning",
        isStarting: true,
        bounceWindowCount: 3,
      } as never);
    });

    expect(input.setLastUpdate).toHaveBeenCalledWith(null);
    expect(input.setEmittedCueCount).toHaveBeenCalledWith(6);
    expect(input.setRecentCues).toHaveBeenCalledWith([]);
    expect(input.setRecentVoices).toHaveBeenCalledWith([]);
    expect(input.setRecentMarkers).toHaveBeenCalledWith([]);
    expect(input.setRecentExplanations).toHaveBeenCalledWith([]);
    expect(input.setSelectedExplanationId).toHaveBeenCalledWith(null);
    expect(input.setBackgroundPlayheadSecond).toHaveBeenCalledWith(48);
    expect(input.setSyncTailRows).toHaveBeenCalledWith([]);
    expect(input.setActiveTailWindowId).toHaveBeenCalledWith("window-4");
    expect(input.setError).toHaveBeenCalledWith("soft warning");
    expect(input.setIsStarting).toHaveBeenCalledWith(true);
    expect(input.panelAudioProbePlayedRef.current).toBe(false);
    expect(input.bounceCuesRef.current).toEqual([]);
    expect(input.setBounceWindowCount).toHaveBeenCalledWith(3);
  });

  it("applies the stop reset for a stopped live monitor session", () => {
    const input = createInput();
    const { result } = renderHook(() => useLiveLogMonitorResetActions(input));

    act(() => {
      result.current.applyStopReset({
        selectedExplanationId: "exp-2",
        backgroundPlayheadSecond: 91,
        liveMutationState: { pressure: 0.1 },
        forcedLiveMutationState: { enabled: false },
        beatClockBpm: 124,
        beatLooperActive: false,
      } as never);
    });

    expect(input.setRecentExplanations).toHaveBeenCalledWith([]);
    expect(input.setSelectedExplanationId).toHaveBeenCalledWith("exp-2");
    expect(input.setBackgroundPlayheadSecond).toHaveBeenCalledWith(91);
    expect(input.setLiveMutationState).toHaveBeenCalledWith({ pressure: 0.1 });
    expect(input.setForcedLiveMutationState).toHaveBeenCalledWith({ enabled: false });
    expect(input.beatClockRef.current).toBeNull();
    expect(input.setBeatClockBpm).toHaveBeenCalledWith(124);
    expect(input.setBeatLooperActive).toHaveBeenCalledWith(false);
  });
});
