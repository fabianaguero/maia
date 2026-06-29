import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorPanelAudioRuntime } from "../../../../src/features/analyzer/components/useLiveLogMonitorPanelAudioRuntime";

const { useLiveLogMonitorPanelAudioCoreMock, useLiveLogMonitorPanelAudioEffectsMock } = vi.hoisted(
  () => ({
    useLiveLogMonitorPanelAudioCoreMock: vi.fn(),
    useLiveLogMonitorPanelAudioEffectsMock: vi.fn(),
  }),
);

vi.mock("../../../../src/features/analyzer/components/useLiveLogMonitorPanelAudioCore", () => ({
  useLiveLogMonitorPanelAudioCore: (...args: unknown[]) => useLiveLogMonitorPanelAudioCoreMock(...args),
}));

vi.mock(
  "../../../../src/features/analyzer/components/useLiveLogMonitorPanelAudioEffects",
  () => ({
    useLiveLogMonitorPanelAudioEffects: (...args: unknown[]) =>
      useLiveLogMonitorPanelAudioEffectsMock(...args),
  }),
);

function createInput() {
  return {
    repositoryId: "repo-1",
    liveEnabled: true,
    replayActive: false,
    monitorAudioContext: null,
    resumeSharedAudio: vi.fn(),
    surfaceState: {
      sampleBuffersRef: { current: new Map() },
      setSampleStatus: vi.fn(),
    },
    viewState: {},
    logger: {
      info: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  } as never;
}

describe("useLiveLogMonitorPanelAudioRuntime facade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLiveLogMonitorPanelAudioCoreMock.mockReturnValue({
      activeBlobAudioElements: { stopAll: vi.fn() },
      ensureAudioReady: vi.fn(),
      playPanelTestTone: vi.fn(),
      backgroundDeckControl: { stopBackgroundDeck: vi.fn() },
      resetActions: { applyRepositoryReset: vi.fn() },
      applyLogModulation: vi.fn(),
      playbackRuntime: { handleSequencerStepFire: vi.fn() },
      backgroundNowPlayingId: "track-1",
      liveMutationState: "steady",
      forcedLiveMutationState: "auto",
      sampleBuffersRef: { current: new Map([["kick", {}]]) },
      setSampleStatus: vi.fn(),
      handleSampleLoadError: vi.fn(),
    });
  });

  it("delegates core/effects wiring and returns the audio facade contract", () => {
    const input = createInput();

    const { result } = renderHook(() => useLiveLogMonitorPanelAudioRuntime(input));

    expect(useLiveLogMonitorPanelAudioCoreMock).toHaveBeenCalledWith({
      liveEnabled: true,
      replayActive: false,
      monitorAudioContext: null,
      resumeSharedAudio: input.resumeSharedAudio,
      surfaceState: input.surfaceState,
      viewState: input.viewState,
      logger: input.logger,
    });
    expect(useLiveLogMonitorPanelAudioEffectsMock).toHaveBeenCalledWith({
      repositoryId: "repo-1",
      liveEnabled: true,
      surfaceState: input.surfaceState,
      viewState: input.viewState,
      activeBlobAudioElements: expect.any(Object),
      sampleBuffersRef: { current: new Map([["kick", {}]]) },
      setSampleStatus: expect.any(Function),
      handleSampleLoadError: expect.any(Function),
      backgroundDeckControl: { stopBackgroundDeck: expect.any(Function) },
    });
    expect(result.current).toMatchObject({
      backgroundNowPlayingId: "track-1",
      liveMutationState: "steady",
      forcedLiveMutationState: "auto",
      playbackRuntime: { handleSequencerStepFire: expect.any(Function) },
      resetActions: { applyRepositoryReset: expect.any(Function) },
    });
  });
});
