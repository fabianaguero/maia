import type {
  AudibleVoiceEntry,
  CuePlaybackPlan,
} from "./liveLogMonitorCuePlaybackRuntime";
import { nextBeatTime, type BeatClock } from "./liveLogMonitorBeatRuntime";
import type { RoutedLiveCue, SequencerPreset } from "./liveSonificationScene";

export interface ExternalCueLayerPlan {
  shouldRender: boolean;
  cueCount: number;
}

export interface ScheduledCueEvent {
  entry: AudibleVoiceEntry;
  cuePriority: number;
  cueStartAt: number;
}

export interface CueGraphSchedulePlan {
  shouldSchedule: boolean;
  shouldResumeSuspendedContext: boolean;
  activeBpm: number | null;
  useBeatGrid: boolean;
  firstCueAt: number | null;
  gapSeconds: number | null;
  events: ScheduledCueEvent[];
}

export function buildExternalCueLayerPlan(playbackPlan: CuePlaybackPlan): ExternalCueLayerPlan {
  return {
    shouldRender:
      playbackPlan.allowExternalCueLayer && playbackPlan.audibleVoicedCues.length > 0,
    cueCount: playbackPlan.audibleVoicedCues.length,
  };
}

export function appendBounceCueWindows(
  currentWindows: RoutedLiveCue[][],
  nextWindow: RoutedLiveCue[],
  maxWindows: number,
): RoutedLiveCue[][] {
  if (nextWindow.length === 0) {
    return currentWindows;
  }

  return [...currentWindows, nextWindow].slice(-maxWindows);
}

export function buildCueGraphSchedulePlan(input: {
  playbackPlan: CuePlaybackPlan;
  contextState: AudioContextState | null;
  currentTime: number | null;
  beatClock: BeatClock | null;
  liveBpm: number | null | undefined;
  preset: Pick<SequencerPreset, "useBeatGrid" | "rhythmDivision" | "scheduleGapMs">;
}): CueGraphSchedulePlan {
  const currentTime = input.currentTime;
  const contextRunning = input.contextState === "running" && typeof currentTime === "number";
  if (!contextRunning) {
    return {
      shouldSchedule: false,
      shouldResumeSuspendedContext: input.contextState === "suspended",
      activeBpm: null,
      useBeatGrid: false,
      firstCueAt: null,
      gapSeconds: null,
      events: [],
    };
  }

  const activeBpm =
    input.beatClock?.bpm ??
    (typeof input.liveBpm === "number" && input.liveBpm > 0 ? input.liveBpm : null);
  const useBeatGrid =
    input.preset.useBeatGrid && activeBpm !== null && input.beatClock !== null;
  const firstCueAt = useBeatGrid
    ? nextBeatTime(
        currentTime,
        input.beatClock!.originTime,
        activeBpm!,
        input.preset.rhythmDivision,
        0.04,
      )
    : currentTime + 0.04;
  const gapSeconds = useBeatGrid
    ? 60 / activeBpm! / Math.max(1, input.preset.rhythmDivision / 4)
    : input.preset.scheduleGapMs / 1000;
  const cuePriorityById = new Map(
    input.playbackPlan.cappedCues.map((cue, index) => [cue.id, index] as const),
  );

  return {
    shouldSchedule: true,
    shouldResumeSuspendedContext: false,
    activeBpm,
    useBeatGrid,
    firstCueAt,
    gapSeconds,
    events: input.playbackPlan.audibleVoiceEntriesForPlayback.map((entry) => {
      const cuePriority = cuePriorityById.get(entry.voice.cue.id) ?? 0;
      return {
        entry,
        cuePriority,
        cueStartAt: firstCueAt + cuePriority * gapSeconds + entry.voice.timeOffsetMs / 1000,
      };
    }),
  };
}
