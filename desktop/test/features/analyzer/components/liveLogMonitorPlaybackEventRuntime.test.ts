import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  executeLiveLogMonitorPlaybackWindow,
  playLiveLogMonitorSequencerPreview,
} from "../../../../src/features/analyzer/components/liveLogMonitorPlaybackEventRuntime";

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

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorSyncRuntime", () => ({
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

function createPlaybackInput() {
  return {
    cues: [],
    liveBpm: 126,
    audioContext: { state: "running", currentTime: 12, resume: vi.fn() } as never,
    masterGain: { id: "gain" } as never,
    backgroundDeck: { id: "deck" } as never,
    sampleBuffers: new Map([["kick.wav", { id: "buffer" }]]),
    beatClock: { bpm: 126 } as never,
    bounceCueWindows: [],
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
    effectiveLiveMutationState: "steady" as const,
    sampleStatus: "ready" as const,
    playableBaseTracks: [{ id: "track-1" }] as never,
    playRenderedBlobThroughGraph: vi.fn(),
    logger: {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    },
  };
}

describe("liveLogMonitorPlaybackEventRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a no-op result for empty cue windows", () => {
    const input = createPlaybackInput();

    const result = executeLiveLogMonitorPlaybackWindow(input);

    expect(result).toEqual({
      nextBounceCueWindows: [],
      bounceWindowCount: null,
      emittedVoiceCount: 0,
    });
    expect(input.logger.debug).toHaveBeenCalledWith("playWithCurrentEngine — skipped (0 cues)");
    expect(buildCuePlaybackPlanMock).not.toHaveBeenCalled();
  });

  it("renders, appends and schedules a voiced cue window", () => {
    const cue = {
      id: "cue-1",
      samplePath: "kick.wav",
      gain: 0.2,
      durationMs: 120,
      routeKey: "warn",
      level: "WARN",
    };
    const input = {
      ...createPlaybackInput(),
      cues: [cue],
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
      events: [{ entry: playbackPlan.audibleVoiceEntriesForPlayback[0], cueStartAt: 12.5 }],
    });
    resolveBackgroundTrackSecondMock.mockReturnValue(3.2);
    resolveCuePlaybackEngineMock.mockReturnValue("sample");

    const result = executeLiveLogMonitorPlaybackWindow(input);

    expect(result).toEqual({
      nextBounceCueWindows: [[cue]],
      bounceWindowCount: 1,
      emittedVoiceCount: 1,
    });
    expect(input.playRenderedBlobThroughGraph).toHaveBeenCalledWith(expect.any(Blob), 0.5);
    expect(scheduleSampleCueMock).toHaveBeenCalledWith(
      input.audioContext,
      cue,
      { id: "buffer" },
      12.5,
      input.masterGain,
    );
  });

  it("plays immediate and deferred sequencer preview batches", () => {
    vi.useFakeTimers();
    const playRenderedBlobThroughGraph = vi.fn();
    buildSequencerPlaybackPlanMock.mockReturnValue({
      immediate: [{ track: "foundation", step: 0, humanizeOffsetMs: 0 }],
      deferred: [{ track: "accent", step: 1, humanizeOffsetMs: 12 }],
    });
    buildSequencerPreviewCuesMock.mockReturnValue([{ id: "cue-1" }]);
    renderCuesToWavMock.mockReturnValue(new Blob(["preview"]));
    resolveSequencerPreviewVolumeMock.mockReturnValue(0.12);

    playLiveLogMonitorSequencerPreview({
      firings: [
        { track: "foundation", step: 0, humanizeOffsetMs: 0 },
        { track: "accent", step: 1, humanizeOffsetMs: 12 },
      ],
      masterVolume: 0.7,
      playRenderedBlobThroughGraph,
    });

    expect(playRenderedBlobThroughGraph).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(12);
    expect(playRenderedBlobThroughGraph).toHaveBeenCalledTimes(2);
    expect(resolveSequencerPreviewVolumeMock).toHaveBeenCalledWith(0.7);
    vi.useRealTimers();
  });
});
