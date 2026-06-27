import { describe, expect, it, vi } from "vitest";

import { stopLiveMonitorAudioGraph } from "../../../../src/features/analyzer/components/liveLogMonitorAudioCleanupRuntime";

function createNodeRef() {
  return {
    current: {
      disconnect: vi.fn(),
    },
  };
}

describe("liveLogMonitorAudioCleanupRuntime", () => {
  it("disconnects managed nodes and triggers external stop hooks", () => {
    const backgroundGainRef = createNodeRef();
    const backgroundDryGainRef = createNodeRef();
    const backgroundDriveWetGainRef = createNodeRef();
    const backgroundDriveNodeRef = createNodeRef();
    const filterNodeRef = createNodeRef();
    const masterGainRef = createNodeRef();
    const analyserRef = createNodeRef();
    const stopBackgroundDeck = vi.fn();
    const stopBeatLooper = vi.fn();
    const muteManagedBlobAudio = vi.fn();

    stopLiveMonitorAudioGraph({
      stopBackgroundDeck,
      stopBeatLooper,
      muteManagedBlobAudio,
      backgroundGainRef,
      backgroundDryGainRef,
      backgroundDriveWetGainRef,
      backgroundDriveNodeRef,
      filterNodeRef,
      masterGainRef,
      analyserRef,
    });

    expect(stopBeatLooper).toHaveBeenCalledTimes(1);
    expect(stopBackgroundDeck).toHaveBeenCalledTimes(1);
    expect(muteManagedBlobAudio).toHaveBeenCalledTimes(1);
    expect(backgroundGainRef.current).toBeNull();
    expect(analyserRef.current).toBeNull();
  });
});
