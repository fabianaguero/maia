import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorOrchestrator } from "../../../../src/features/analyzer/components/useLiveLogMonitorOrchestrator";

const {
  buildRecentCueHistoryMock,
  buildRecentExplanationHistoryMock,
  buildRecentMarkerHistoryMock,
  buildRecentMonitorVoicesMock,
  resolveActiveTailWindowIdMock,
  resolveSelectedMonitorExplanationIdMock,
  buildMonitorUpdateDerivationMock,
  appendSyncTailRowsMock,
  buildSyncTailRowsMock,
  resolveBackgroundTrackSecondMock,
  resolveBeatClockLiveSyncMock,
} = vi.hoisted(() => ({
  buildRecentCueHistoryMock: vi.fn(),
  buildRecentExplanationHistoryMock: vi.fn(),
  buildRecentMarkerHistoryMock: vi.fn(),
  buildRecentMonitorVoicesMock: vi.fn(),
  resolveActiveTailWindowIdMock: vi.fn(),
  resolveSelectedMonitorExplanationIdMock: vi.fn(),
  buildMonitorUpdateDerivationMock: vi.fn(),
  appendSyncTailRowsMock: vi.fn(),
  buildSyncTailRowsMock: vi.fn(),
  resolveBackgroundTrackSecondMock: vi.fn(),
  resolveBeatClockLiveSyncMock: vi.fn(),
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorStreamUpdateRuntime", () => ({
  buildRecentCueHistory: (...args: unknown[]) => buildRecentCueHistoryMock(...args),
  buildRecentExplanationHistory: (...args: unknown[]) => buildRecentExplanationHistoryMock(...args),
  buildRecentMarkerHistory: (...args: unknown[]) => buildRecentMarkerHistoryMock(...args),
  buildRecentMonitorVoices: (...args: unknown[]) => buildRecentMonitorVoicesMock(...args),
  resolveActiveTailWindowId: (...args: unknown[]) => resolveActiveTailWindowIdMock(...args),
  resolveSelectedMonitorExplanationId: (...args: unknown[]) =>
    resolveSelectedMonitorExplanationIdMock(...args),
}));

vi.mock(
  "../../../../src/features/analyzer/components/liveLogMonitorUpdateDerivationRuntime",
  () => ({
    buildMonitorUpdateDerivation: (...args: unknown[]) => buildMonitorUpdateDerivationMock(...args),
  }),
);

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorSyncRuntime", () => ({
  appendSyncTailRows: (...args: unknown[]) => appendSyncTailRowsMock(...args),
  buildSyncTailRows: (...args: unknown[]) => buildSyncTailRowsMock(...args),
  resolveBackgroundTrackSecond: (...args: unknown[]) => resolveBackgroundTrackSecondMock(...args),
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorBeatRuntime", () => ({
  resolveBeatClockLiveSync: (...args: unknown[]) => resolveBeatClockLiveSyncMock(...args),
}));

function createInput(overrides: Record<string, unknown> = {}) {
  return {
    repositoryId: "repo-1",
    sessionRepoId: "repo-1",
    audioContextRef: { current: { currentTime: 12 } },
    backgroundDeckRef: { current: null },
    beatClockRef: { current: { bpm: 120 } },
    panelAudioProbePlayedRef: { current: false },
    scene: {
      preset: { useBeatGrid: true },
      mutationProfile: { arrangementDepth: "full" },
    },
    availableTracks: [],
    componentOverrides: new Map(),
    replayActive: false,
    knownComponentsRef: { current: [] },
    setLastUpdate: vi.fn(),
    setRecentWarnings: vi.fn(),
    setError: vi.fn(),
    setSyncTailRows: vi.fn(),
    setActiveTailWindowId: vi.fn(),
    setIsAnomalyFlash: vi.fn(),
    setEmittedCueCount: vi.fn(),
    setRecentCues: vi.fn(),
    setRecentMarkers: vi.fn(),
    setRecentExplanations: vi.fn(),
    setBackgroundPlayheadSecond: vi.fn(),
    setSelectedExplanationId: vi.fn(),
    setRecentVoices: vi.fn(),
    setKnownComponents: vi.fn(),
    setBeatClockBpm: vi.fn(),
    monitor: { isPlayback: false },
    ensureAudioReady: vi.fn(async () => ({ currentTime: 12 })),
    playWithCurrentEngine: vi.fn(),
    applyLogModulation: vi.fn(),
    playPanelTestTone: vi.fn(async () => undefined),
    logger: {
      trace: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
    },
    ...overrides,
  } as never;
}

describe("useLiveLogMonitorOrchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildRecentCueHistoryMock.mockReturnValue(["cue-history"]);
    buildRecentExplanationHistoryMock.mockReturnValue(["exp-history"]);
    buildRecentMarkerHistoryMock.mockReturnValue(["marker-history"]);
    buildRecentMonitorVoicesMock.mockReturnValue(["voice-history"]);
    resolveActiveTailWindowIdMock.mockReturnValue("tail-1");
    resolveSelectedMonitorExplanationIdMock.mockReturnValue("exp-1");
    appendSyncTailRowsMock.mockReturnValue(["tail-row"]);
    buildSyncTailRowsMock.mockReturnValue([{ id: "tail-row-1" }]);
    resolveBackgroundTrackSecondMock.mockReturnValue(33);
    resolveBeatClockLiveSyncMock.mockReturnValue({
      changed: true,
      nextClock: { bpm: 126 },
      nextDisplayBpm: 126,
    });
    buildMonitorUpdateDerivationMock.mockReturnValue({
      knownComponents: ["api"],
      knownComponentsChanged: true,
      routedCues: [{ id: "cue-1" }],
      nextExplanations: [{ id: "exp-1" }],
      primaryLine: "line-1",
    });
  });

  it("skips updates when the session repo does not match the panel repo", () => {
    const input = createInput({
      sessionRepoId: "repo-2",
    });
    const { result } = renderHook(() => useLiveLogMonitorOrchestrator(input));

    act(() => {
      result.current.onStreamUpdate({
        hasData: true,
        lineCount: 5,
        sonificationCues: [],
      } as never);
    });

    expect(input.logger.debug).toHaveBeenCalled();
    expect(buildMonitorUpdateDerivationMock).not.toHaveBeenCalled();
    expect(input.playWithCurrentEngine).not.toHaveBeenCalled();
  });

  it("derives UI/audio updates and triggers live playback for matching live updates", async () => {
    vi.useFakeTimers();
    const input = createInput();
    const { result } = renderHook(() => useLiveLogMonitorOrchestrator(input));
    const update = {
      hasData: true,
      lineCount: 5,
      sonificationCues: [{ id: "cue-raw" }],
      warnings: ["warn-a", "warn-b"],
      anomalyCount: 2,
      anomalyMarkers: [{ id: "marker-a" }],
      suggestedBpm: 126,
      levelCounts: { WARN: 1, ERROR: 1 },
    };

    act(() => {
      result.current.onStreamUpdate(update as never);
    });

    expect(buildMonitorUpdateDerivationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        update,
        currentTrackSecond: 33,
      }),
    );
    expect(input.setKnownComponents).toHaveBeenCalledWith(["api"]);
    expect(input.setLastUpdate).toHaveBeenCalledWith(update);
    expect(input.setRecentWarnings).toHaveBeenCalledWith(["warn-a", "warn-b"]);
    expect(input.setError).toHaveBeenCalledWith(null);
    expect(input.setSyncTailRows).toHaveBeenCalledWith(expect.any(Function));
    expect(input.setActiveTailWindowId).toHaveBeenCalledWith("tail-1");
    expect(input.setIsAnomalyFlash).toHaveBeenCalledWith(true);
    expect(input.setEmittedCueCount).toHaveBeenCalledWith(expect.any(Function));
    expect(input.setRecentCues).toHaveBeenCalledWith(expect.any(Function));
    expect(input.setRecentMarkers).toHaveBeenCalledWith(expect.any(Function));
    expect(input.setRecentExplanations).toHaveBeenCalledWith(expect.any(Function));
    expect(input.setBackgroundPlayheadSecond).toHaveBeenCalledWith(33);
    expect(input.setSelectedExplanationId).toHaveBeenCalledWith(expect.any(Function));
    expect(input.setRecentVoices).toHaveBeenCalledWith(["voice-history"]);
    expect(input.ensureAudioReady).toHaveBeenCalled();
    expect(input.setBeatClockBpm).toHaveBeenCalledWith(126);
    expect(input.playPanelTestTone).toHaveBeenCalled();
    expect(input.playWithCurrentEngine).toHaveBeenCalledWith([{ id: "cue-1" }], 126);
    expect(input.applyLogModulation).toHaveBeenCalledWith(update);

    vi.runAllTimers();

    expect(input.setIsAnomalyFlash).toHaveBeenCalledWith(false);
    vi.useRealTimers();
  });
});
