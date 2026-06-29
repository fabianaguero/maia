import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorSurfaceSync } from "../../../../src/features/analyzer/components/useLiveLogMonitorSurfaceSync";

const saveMonitorPrefsMock = vi.fn();
const setBlobAudioVolumeStateMock = vi.fn();

vi.mock("../../../../src/utils/monitorPrefs", () => ({
  saveMonitorPrefs: (...args: unknown[]) => saveMonitorPrefsMock(...args),
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorAudioRuntime", () => ({
  setBlobAudioVolumeState: (...args: unknown[]) => setBlobAudioVolumeStateMock(...args),
}));

function createInput(overrides: Partial<Parameters<typeof useLiveLogMonitorSurfaceSync>[0]> = {}) {
  const masterGainSetValueAtTime = vi.fn();
  const backgroundGainSetValueAtTime = vi.fn();
  const backgroundDrySetValueAtTime = vi.fn();
  const backgroundWetSetValueAtTime = vi.fn();
  const filterSetValueAtTime = vi.fn();

  return {
    repositoryId: "repo-1",
    basePlaylist: [],
    selectedStyleProfileId: "style-1",
    selectedMutationProfileId: "mutation-1",
    masterVolume: 0.7,
    activeBlobAudioElements: new Set(),
    audioContextRef: { current: { currentTime: 12 } as AudioContext },
    masterGainRef: { current: { gain: { setValueAtTime: masterGainSetValueAtTime } } as GainNode },
    syncTailListRef: { current: { scrollTop: 0, scrollHeight: 480 } as HTMLDivElement },
    syncTailRowCount: 3,
    previousAudibleVolumeRef: { current: 0.4 },
    backgroundGainRef: { current: { gain: { setValueAtTime: backgroundGainSetValueAtTime } } as GainNode },
    backgroundDryGainRef: { current: { gain: { setValueAtTime: backgroundDrySetValueAtTime } } as GainNode },
    backgroundDriveWetGainRef: { current: { gain: { setValueAtTime: backgroundWetSetValueAtTime } } as GainNode },
    filterNodeRef: { current: { frequency: { setValueAtTime: filterSetValueAtTime } } as BiquadFilterNode },
    selectedStyleProfile: {
      backgroundGain: 0.8,
      filterCeilingHz: 1200,
    },
    ...overrides,
  };
}

describe("useLiveLogMonitorSurfaceSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists monitor prefs and syncs volume, tail scroll, and audio nodes", () => {
    const input = createInput();

    renderHook(() => useLiveLogMonitorSurfaceSync(input));

    expect(saveMonitorPrefsMock).toHaveBeenCalledWith(
      "repo-1",
      expect.objectContaining({
        basePlaylist: [],
        selectedStyleProfileId: "style-1",
        selectedMutationProfileId: "mutation-1",
        masterVolume: 0.7,
      }),
    );
    expect(input.masterGainRef.current?.gain.setValueAtTime).toHaveBeenCalledWith(0.7, 12);
    expect(setBlobAudioVolumeStateMock).toHaveBeenCalledWith(input.activeBlobAudioElements, 0.7);
    expect(input.syncTailListRef.current?.scrollTop).toBe(480);
    expect(input.previousAudibleVolumeRef.current).toBe(0.7);
    expect(input.backgroundGainRef.current?.gain.setValueAtTime).toHaveBeenCalledWith(0.8, 12);
    expect(input.backgroundDryGainRef.current?.gain.setValueAtTime).toHaveBeenCalledWith(1, 12);
    expect(input.backgroundDriveWetGainRef.current?.gain.setValueAtTime).toHaveBeenCalledWith(
      0.0001,
      12,
    );
    expect(input.filterNodeRef.current?.frequency.setValueAtTime).toHaveBeenCalledWith(
      1200,
      12,
    );
  });

  it("does not overwrite the last audible volume when muted", () => {
    const input = createInput({
      masterVolume: 0,
      previousAudibleVolumeRef: { current: 0.55 },
    });

    renderHook(() => useLiveLogMonitorSurfaceSync(input));

    expect(input.previousAudibleVolumeRef.current).toBe(0.55);
  });
});
