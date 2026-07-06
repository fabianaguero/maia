import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyLiveLogMonitorPlaybackUpdate,
  applyLiveLogMonitorVisualUpdate,
} from "../../../../src/features/analyzer/components/liveLogMonitorOrchestratorEffectRuntime";

const {
  buildLiveLogMonitorEmittedCueCountUpdaterMock,
  buildLiveLogMonitorRecentCuesUpdaterMock,
  buildLiveLogMonitorRecentExplanationsUpdaterMock,
  buildLiveLogMonitorRecentMarkersUpdaterMock,
  buildLiveLogMonitorRecentVoicesMock,
  buildLiveLogMonitorRecentWarningsMock,
  buildLiveLogMonitorSelectedExplanationUpdaterMock,
  buildLiveLogMonitorSyncTailRowsUpdaterMock,
  buildLiveLogMonitorBeatClockPlanMock,
  shouldPlayLiveLogMonitorPanelProbeMock,
} = vi.hoisted(() => ({
  buildLiveLogMonitorEmittedCueCountUpdaterMock: vi.fn(),
  buildLiveLogMonitorRecentCuesUpdaterMock: vi.fn(),
  buildLiveLogMonitorRecentExplanationsUpdaterMock: vi.fn(),
  buildLiveLogMonitorRecentMarkersUpdaterMock: vi.fn(),
  buildLiveLogMonitorRecentVoicesMock: vi.fn(),
  buildLiveLogMonitorRecentWarningsMock: vi.fn(),
  buildLiveLogMonitorSelectedExplanationUpdaterMock: vi.fn(),
  buildLiveLogMonitorSyncTailRowsUpdaterMock: vi.fn(),
  buildLiveLogMonitorBeatClockPlanMock: vi.fn(),
  shouldPlayLiveLogMonitorPanelProbeMock: vi.fn(),
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorOrchestratorRuntime", () => ({
  buildLiveLogMonitorBeatClockPlan: (...args: unknown[]) =>
    buildLiveLogMonitorBeatClockPlanMock(...args),
  buildLiveLogMonitorDerivedUpdate: vi.fn(),
  buildLiveLogMonitorEmittedCueCountUpdater: (...args: unknown[]) =>
    buildLiveLogMonitorEmittedCueCountUpdaterMock(...args),
  buildLiveLogMonitorRecentCuesUpdater: (...args: unknown[]) =>
    buildLiveLogMonitorRecentCuesUpdaterMock(...args),
  buildLiveLogMonitorRecentExplanationsUpdater: (...args: unknown[]) =>
    buildLiveLogMonitorRecentExplanationsUpdaterMock(...args),
  buildLiveLogMonitorRecentMarkersUpdater: (...args: unknown[]) =>
    buildLiveLogMonitorRecentMarkersUpdaterMock(...args),
  buildLiveLogMonitorRecentVoices: (...args: unknown[]) =>
    buildLiveLogMonitorRecentVoicesMock(...args),
  buildLiveLogMonitorRecentWarnings: (...args: unknown[]) =>
    buildLiveLogMonitorRecentWarningsMock(...args),
  buildLiveLogMonitorSelectedExplanationUpdater: (...args: unknown[]) =>
    buildLiveLogMonitorSelectedExplanationUpdaterMock(...args),
  buildLiveLogMonitorSyncTailRowsUpdater: (...args: unknown[]) =>
    buildLiveLogMonitorSyncTailRowsUpdaterMock(...args),
  resolveLiveLogMonitorCurrentTrackSecond: vi.fn(),
  shouldIgnoreLiveLogMonitorUpdate: vi.fn(),
  shouldPlayLiveLogMonitorPanelProbe: (...args: unknown[]) =>
    shouldPlayLiveLogMonitorPanelProbeMock(...args),
}));

function createDerivedUpdate() {
  return {
    nextTailRows: [{ id: "tail-1" }],
    activeTailWindowId: "window-1",
    updateDerivation: {
      routedCues: [{ id: "cue-1" }],
      nextExplanations: [{ id: "exp-1" }],
      primaryLine: "line-1",
    },
  } as never;
}

describe("liveLogMonitorOrchestratorEffectRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildLiveLogMonitorRecentWarningsMock.mockReturnValue(["warn-1"]);
    buildLiveLogMonitorSyncTailRowsUpdaterMock.mockReturnValue(() => ["tail-row"]);
    buildLiveLogMonitorEmittedCueCountUpdaterMock.mockReturnValue(() => 5);
    buildLiveLogMonitorRecentCuesUpdaterMock.mockReturnValue(() => ["cue-history"]);
    buildLiveLogMonitorRecentMarkersUpdaterMock.mockReturnValue(() => ["marker-history"]);
    buildLiveLogMonitorRecentExplanationsUpdaterMock.mockReturnValue(() => ["exp-history"]);
    buildLiveLogMonitorSelectedExplanationUpdaterMock.mockReturnValue(() => "exp-1");
    buildLiveLogMonitorRecentVoicesMock.mockReturnValue(["voice-history"]);
    buildLiveLogMonitorBeatClockPlanMock.mockReturnValue({
      changed: true,
      nextClock: { bpm: 126 },
      nextDisplayBpm: 126,
    });
    shouldPlayLiveLogMonitorPanelProbeMock.mockReturnValue(true);
  });

  it("applies visual monitor updates for active live data", () => {
    const input = {
      update: {
        hasData: true,
        anomalyCount: 2,
        anomalyMarkers: [{ id: "marker-1" }],
        warnings: ["warn-1"],
      },
      derivedUpdate: createDerivedUpdate(),
      currentTrackSecond: 42,
      replayActive: false,
      isPlayback: false,
      arrangementDepth: "stacked",
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
      scheduleAnomalyFlashReset: vi.fn(),
    } as never;

    applyLiveLogMonitorVisualUpdate(input);

    expect(input.setLastUpdate).toHaveBeenCalledWith(input.update);
    expect(input.setRecentWarnings).toHaveBeenCalledWith(["warn-1"]);
    expect(input.setError).toHaveBeenCalledWith(null);
    expect(input.setSyncTailRows).toHaveBeenCalledWith(expect.any(Function));
    expect(input.setActiveTailWindowId).toHaveBeenCalledWith("window-1");
    expect(input.setIsAnomalyFlash).toHaveBeenCalledWith(true);
    expect(input.scheduleAnomalyFlashReset).toHaveBeenCalled();
    expect(input.setEmittedCueCount).toHaveBeenCalledWith(expect.any(Function));
    expect(input.setRecentCues).toHaveBeenCalledWith(expect.any(Function));
    expect(input.setRecentMarkers).toHaveBeenCalledWith(expect.any(Function));
    expect(input.setRecentExplanations).toHaveBeenCalledWith(expect.any(Function));
    expect(input.setBackgroundPlayheadSecond).toHaveBeenCalledWith(42);
    expect(input.setSelectedExplanationId).toHaveBeenCalledWith(expect.any(Function));
    expect(input.setRecentVoices).toHaveBeenCalledWith(["voice-history"]);
  });

  it("skips playback mutations when there is no live data or replay is active", () => {
    const input = {
      update: { hasData: false, suggestedBpm: 126 },
      replayActive: false,
      panelAudioProbePlayedRef: { current: false },
      hasBackgroundDeck: false,
      beatClockRef: { current: null },
      useBeatGrid: true,
      audioCurrentTime: 12,
      setBeatClockBpm: vi.fn(),
      ensureAudioReady: vi.fn(),
      playPanelTestTone: vi.fn(),
      playWithCurrentEngine: vi.fn(),
      applyLogModulation: vi.fn(),
      logger: { info: vi.fn() },
      derivedUpdate: createDerivedUpdate(),
    } as never;

    applyLiveLogMonitorPlaybackUpdate(input);

    expect(input.ensureAudioReady).not.toHaveBeenCalled();
    expect(input.playWithCurrentEngine).not.toHaveBeenCalled();
  });

  it("applies beat sync and playback side effects for active live data", () => {
    const input = {
      update: { hasData: true, suggestedBpm: 126 },
      replayActive: false,
      panelAudioProbePlayedRef: { current: false },
      hasBackgroundDeck: false,
      beatClockRef: { current: { bpm: 120 } },
      useBeatGrid: true,
      audioCurrentTime: 12,
      setBeatClockBpm: vi.fn(),
      ensureAudioReady: vi.fn(async () => null),
      playPanelTestTone: vi.fn(async () => undefined),
      playWithCurrentEngine: vi.fn(),
      applyLogModulation: vi.fn(),
      logger: { info: vi.fn() },
      derivedUpdate: createDerivedUpdate(),
    } as never;

    applyLiveLogMonitorPlaybackUpdate(input);

    expect(input.ensureAudioReady).toHaveBeenCalled();
    expect(input.setBeatClockBpm).toHaveBeenCalledWith(126);
    expect(input.playPanelTestTone).toHaveBeenCalled();
    expect(input.playWithCurrentEngine).toHaveBeenCalledWith([{ id: "cue-1" }], 126);
    expect(input.applyLogModulation).toHaveBeenCalledWith(input.update);
  });
});
