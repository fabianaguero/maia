import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorPlayback } from "../../../../src/features/analyzer/components/useLiveLogMonitorPlayback";

const {
  buildCuePlaybackPlanMock,
  resolveExternalCueLayerVolumeMock,
  resolveCuePlaybackEngineMock,
  appendBounceCueWindowsMock,
  buildCueGraphSchedulePlanMock,
  buildExternalCueLayerPlanMock,
  renderCuesToWavMock,
  resolveBackgroundTrackSecondMock,
  scheduleSampleCueMock,
  scheduleSynthCueMock,
  scheduleTrackSliceCueMock,
  buildSequencerPreviewCuesMock,
  buildSequencerPlaybackPlanMock,
  resolveSequencerPreviewVolumeMock,
} = vi.hoisted(() => ({
  buildCuePlaybackPlanMock: vi.fn(),
  resolveExternalCueLayerVolumeMock: vi.fn(),
  resolveCuePlaybackEngineMock: vi.fn(),
  appendBounceCueWindowsMock: vi.fn(),
  buildCueGraphSchedulePlanMock: vi.fn(),
  buildExternalCueLayerPlanMock: vi.fn(),
  renderCuesToWavMock: vi.fn(),
  resolveBackgroundTrackSecondMock: vi.fn(),
  scheduleSampleCueMock: vi.fn(),
  scheduleSynthCueMock: vi.fn(),
  scheduleTrackSliceCueMock: vi.fn(),
  buildSequencerPreviewCuesMock: vi.fn(),
  buildSequencerPlaybackPlanMock: vi.fn(),
  resolveSequencerPreviewVolumeMock: vi.fn(),
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorCuePlaybackRuntime", () => ({
  buildCuePlaybackPlan: (...args: unknown[]) => buildCuePlaybackPlanMock(...args),
  resolveCuePlaybackEngine: (...args: unknown[]) => resolveCuePlaybackEngineMock(...args),
  resolveExternalCueLayerVolume: (...args: unknown[]) => resolveExternalCueLayerVolumeMock(...args),
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorCueExecutionRuntime", () => ({
  appendBounceCueWindows: (...args: unknown[]) => appendBounceCueWindowsMock(...args),
  buildCueGraphSchedulePlan: (...args: unknown[]) => buildCueGraphSchedulePlanMock(...args),
  buildExternalCueLayerPlan: (...args: unknown[]) => buildExternalCueLayerPlanMock(...args),
}));

vi.mock("../../../../src/features/analyzer/components/wavRenderer", () => ({
  renderCuesToWav: (...args: unknown[]) => renderCuesToWavMock(...args),
  MAX_BOUNCE_WINDOWS: 4,
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorPanelRuntime", () => ({
  resolveBackgroundTrackSecond: (...args: unknown[]) => resolveBackgroundTrackSecondMock(...args),
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorCueScheduleRuntime", () => ({
  scheduleSampleCue: (...args: unknown[]) => scheduleSampleCueMock(...args),
  scheduleSynthCue: (...args: unknown[]) => scheduleSynthCueMock(...args),
  scheduleTrackSliceCue: (...args: unknown[]) => scheduleTrackSliceCueMock(...args),
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorSessionRuntime", () => ({
  buildSequencerPreviewCues: (...args: unknown[]) => buildSequencerPreviewCuesMock(...args),
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorSequencerRuntime", () => ({
  buildSequencerPlaybackPlan: (...args: unknown[]) => buildSequencerPlaybackPlanMock(...args),
  resolveSequencerPreviewVolume: (...args: unknown[]) => resolveSequencerPreviewVolumeMock(...args),
}));

function createInput() {
  return {
    audioContextRef: { current: { state: "running", currentTime: 12, resume: vi.fn() } },
    masterGainRef: { current: { id: "gain" } },
    backgroundDeckRef: { current: { id: "deck" } },
    sampleBuffersRef: { current: new Map([["kick.wav", { id: "buffer" }]]) },
    beatClockRef: { current: { bpm: 126 } },
    bounceCuesRef: { current: [] },
    masterVolume: 0.7,
    scene: {
      preset: {
        maxCuesPerWindow: 8,
        useBeatGrid: true,
        rhythmDivision: 4,
        scheduleGapMs: 180,
      },
      mutationProfile: {
        arrangementDepth: "full",
      },
    },
    effectiveLiveMutationState: "steady",
    sampleStatus: "ready",
    playableBaseTracks: [{ id: "track-1" }],
    playRenderedBlobThroughGraph: vi.fn(),
    setBounceWindowCount: vi.fn(),
    setEmittedVoiceCount: vi.fn(),
    logger: {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    },
  } as never;
}

describe("useLiveLogMonitorPlayback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips empty cue windows without building a playback plan", () => {
    const input = createInput();
    const { result } = renderHook(() => useLiveLogMonitorPlayback(input));

    result.current.playWithCurrentEngine([], 126);

    expect(buildCuePlaybackPlanMock).not.toHaveBeenCalled();
    expect(input.logger.debug).toHaveBeenCalledWith("playWithCurrentEngine — skipped (0 cues)");
  });

  it("renders external layers, appends bounce windows, and schedules cue playback", () => {
    const input = createInput();
    const cue = {
      samplePath: "kick.wav",
      gain: 0.2,
      durationMs: 120,
      routeKey: "warn",
      level: "WARN",
    };
    const playbackPlan = {
      preferGuideTrackMutation: true,
      voicedCues: [cue],
      audibleVoicedCues: [cue],
      audibleVoiceEntriesForPlayback: [
        {
          voice: { cue, track: "foundation" },
          voicedCue: cue,
        },
      ],
    };
    buildCuePlaybackPlanMock.mockReturnValue(playbackPlan);
    buildExternalCueLayerPlanMock.mockReturnValue({ shouldRender: true });
    renderCuesToWavMock.mockReturnValue(new Blob(["wav"]));
    resolveExternalCueLayerVolumeMock.mockReturnValue(0.5);
    appendBounceCueWindowsMock.mockReturnValue([[cue]]);
    buildCueGraphSchedulePlanMock.mockReturnValue({
      shouldSchedule: true,
      shouldResumeSuspendedContext: false,
      events: [
        {
          entry: playbackPlan.audibleVoiceEntriesForPlayback[0],
          cueStartAt: 12.5,
        },
      ],
    });
    resolveBackgroundTrackSecondMock.mockReturnValue(3.2);
    resolveCuePlaybackEngineMock.mockReturnValue("sample");

    const { result } = renderHook(() => useLiveLogMonitorPlayback(input));

    result.current.playWithCurrentEngine([cue], 126);

    expect(buildCuePlaybackPlanMock).toHaveBeenCalledWith(
      expect.objectContaining({
        cues: [cue],
        hasGuideTrackMutation: true,
      }),
    );
    expect(input.playRenderedBlobThroughGraph).toHaveBeenCalledWith(expect.any(Blob), 0.5);
    expect(input.setBounceWindowCount).toHaveBeenCalledWith(1);
    expect(resolveCuePlaybackEngineMock).toHaveBeenCalled();
    expect(scheduleSampleCueMock).toHaveBeenCalledWith(
      input.audioContextRef.current,
      cue,
      { id: "buffer" },
      12.5,
      input.masterGainRef.current,
    );
    expect(input.setEmittedVoiceCount).toHaveBeenCalledWith(expect.any(Function));
  });

  it("plays immediate and deferred sequencer firings through the blob graph", () => {
    vi.useFakeTimers();
    const input = createInput();
    buildSequencerPlaybackPlanMock.mockReturnValue({
      immediate: [{ track: "foundation", step: 0, humanizeOffsetMs: 0 }],
      deferred: [{ track: "accent", step: 1, humanizeOffsetMs: 12 }],
    });
    buildSequencerPreviewCuesMock.mockReturnValue([{ id: "cue-1" }]);
    renderCuesToWavMock.mockReturnValue(new Blob(["preview"]));
    resolveSequencerPreviewVolumeMock.mockReturnValue(0.12);

    const { result } = renderHook(() => useLiveLogMonitorPlayback(input));

    result.current.handleSequencerStepFire([
      { track: "foundation", step: 0, humanizeOffsetMs: 0 },
      { track: "accent", step: 1, humanizeOffsetMs: 12 },
    ]);

    expect(input.playRenderedBlobThroughGraph).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(12);

    expect(input.playRenderedBlobThroughGraph).toHaveBeenCalledTimes(2);
    expect(resolveSequencerPreviewVolumeMock).toHaveBeenCalledWith(0.7);
    vi.useRealTimers();
  });
});
