import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorPanelAudioEffects } from "../../../../src/features/analyzer/components/useLiveLogMonitorPanelAudioEffects";

const {
  useLiveLogMonitorSampleBankMock,
  useLiveLogMonitorSurfaceSyncMock,
  useLiveLogMonitorBackgroundLifecycleMock,
} = vi.hoisted(() => ({
  useLiveLogMonitorSampleBankMock: vi.fn(),
  useLiveLogMonitorSurfaceSyncMock: vi.fn(),
  useLiveLogMonitorBackgroundLifecycleMock: vi.fn(),
}));

vi.mock("../../../../src/features/analyzer/components/useLiveLogMonitorSampleBank", () => ({
  useLiveLogMonitorSampleBank: (...args: unknown[]) => useLiveLogMonitorSampleBankMock(...args),
}));

vi.mock("../../../../src/features/analyzer/components/useLiveLogMonitorSurfaceSync", () => ({
  useLiveLogMonitorSurfaceSync: (...args: unknown[]) => useLiveLogMonitorSurfaceSyncMock(...args),
}));

vi.mock(
  "../../../../src/features/analyzer/components/useLiveLogMonitorBackgroundLifecycle",
  () => ({
    useLiveLogMonitorBackgroundLifecycle: (...args: unknown[]) =>
      useLiveLogMonitorBackgroundLifecycleMock(...args),
  }),
);

function createInput() {
  const audioContextRef = { current: null };
  return {
    repositoryId: "repo-1",
    liveEnabled: true,
    surfaceState: {
      audioContextRef,
      sampleBuffersRef: { current: new Map() },
      setSampleStatus: vi.fn(),
      basePlaylist: [],
      selectedStyleProfileId: "style-1",
      selectedMutationProfileId: "mutation-1",
      masterVolume: 0.7,
      masterGainRef: { current: null },
      syncTailListRef: { current: null },
      syncTailRows: [],
      previousAudibleVolumeRef: { current: 0.5 },
      backgroundGainRef: { current: null },
      backgroundDryGainRef: { current: null },
      backgroundDriveWetGainRef: { current: null },
      filterNodeRef: { current: null },
      backgroundDeckRef: { current: null },
      setBackgroundNowPlayingId: vi.fn(),
      setBackgroundTransitionPlan: vi.fn(),
    },
    viewState: {
      scene: {
        sampleSources: [{ id: "sample-1" }],
      },
      selectedStyleProfile: {
        backgroundGain: 0.8,
        filterCeilingHz: 1200,
      },
      playableBaseTracks: [{ id: "track-1" }],
      playableBaseTrackIdsKey: "track-1",
    },
    activeBlobAudioElements: { stopAll: vi.fn() },
    sampleBuffersRef: { current: new Map([["sample-1", {}]]) },
    setSampleStatus: vi.fn(),
    handleSampleLoadError: vi.fn(),
    backgroundDeckControl: {
      stopBackgroundDeck: vi.fn(),
      startBackgroundDeck: vi.fn(),
      scheduleBackgroundTransition: vi.fn(),
    },
  } as never;
}

describe("useLiveLogMonitorPanelAudioEffects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wires sample bank, surface sync, and background lifecycle from panel state", () => {
    const input = createInput();

    renderHook(() => useLiveLogMonitorPanelAudioEffects(input));

    expect(useLiveLogMonitorSampleBankMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sampleSources: [{ id: "sample-1" }],
        audioContextRef: input.surfaceState.audioContextRef,
        sampleBuffersRef: input.sampleBuffersRef,
        setSampleStatus: input.setSampleStatus,
        onLoadError: input.handleSampleLoadError,
        createAudioContext: expect.any(Function),
      }),
    );

    const sampleBankCall = useLiveLogMonitorSampleBankMock.mock.calls[0]?.[0];
    expect(sampleBankCall.createAudioContext()).toBeNull();

    expect(useLiveLogMonitorSurfaceSyncMock).toHaveBeenCalledWith(
      expect.objectContaining({
        repositoryId: "repo-1",
        activeBlobAudioElements: input.activeBlobAudioElements,
        selectedStyleProfileId: "style-1",
        selectedMutationProfileId: "mutation-1",
        selectedStyleProfile: {
          backgroundGain: 0.8,
          filterCeilingHz: 1200,
        },
      }),
    );

    expect(useLiveLogMonitorBackgroundLifecycleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        liveEnabled: true,
        playableBaseTracks: [{ id: "track-1" }],
        playableBaseTrackIdsKey: "track-1",
        stopBackgroundDeck: input.backgroundDeckControl.stopBackgroundDeck,
        startBackgroundDeck: input.backgroundDeckControl.startBackgroundDeck,
        scheduleBackgroundTransition: input.backgroundDeckControl.scheduleBackgroundTransition,
      }),
    );
  });
});
