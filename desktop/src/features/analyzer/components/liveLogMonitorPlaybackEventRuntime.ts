import type { RoutedLiveCue, ArrangementTrack } from "./liveSonificationScene";
import {
  buildCuePlaybackPlan,
  resolveCuePlaybackEngine,
  resolveExternalCueLayerVolume,
} from "./liveLogMonitorCuePlaybackRuntime";
import {
  appendBounceCueWindows,
  buildCueGraphSchedulePlan,
  buildExternalCueLayerPlan,
} from "./liveLogMonitorCueExecutionRuntime";
import { renderCuesToWav, MAX_BOUNCE_WINDOWS } from "./wavRenderer";
import { resolveBackgroundTrackSecond } from "./liveLogMonitorSyncRuntime";
import {
  scheduleSampleCue,
  scheduleSynthCue,
  scheduleTrackSliceCue,
} from "./liveLogMonitorCueScheduleRuntime";
import { buildSequencerPreviewCues } from "./liveLogMonitorSessionRuntime";
import {
  buildSequencerPlaybackPlan,
  resolveSequencerPreviewVolume,
} from "./liveLogMonitorSequencerRuntime";
import type { LibraryTrack } from "../../../types/library";
import type { BeatClock } from "./liveLogMonitorBeatRuntime";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
import type { LiveMutationState } from "./liveLogMonitorAudioRuntime";

export interface LiveLogMonitorPlaybackLogger {
  info: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
}

export interface LiveLogMonitorPlaybackEventInput {
  cues: RoutedLiveCue[];
  liveBpm?: number | null;
  audioContext: AudioContext | null;
  masterGain: GainNode | null;
  backgroundDeck: BackgroundDeckState | null;
  sampleBuffers: ReadonlyMap<string, AudioBuffer>;
  beatClock: BeatClock | null;
  bounceCueWindows: RoutedLiveCue[][];
  masterVolume: number;
  scene: {
    preset: {
      maxCuesPerWindow: number;
      useBeatGrid: boolean;
      rhythmDivision: number;
      scheduleGapMs: number;
    };
    mutationProfile: {
      arrangementDepth: string;
    };
  };
  effectiveLiveMutationState: LiveMutationState;
  sampleStatus: "unavailable" | "loading" | "ready" | "error";
  playableBaseTracks: LibraryTrack[];
  playRenderedBlobThroughGraph: (blob: Blob, volume: number) => Promise<void>;
  logger: LiveLogMonitorPlaybackLogger;
}

export interface LiveLogMonitorPlaybackEventResult {
  nextBounceCueWindows: RoutedLiveCue[][];
  bounceWindowCount: number | null;
  emittedVoiceCount: number;
}

export function executeLiveLogMonitorPlaybackWindow(
  input: LiveLogMonitorPlaybackEventInput,
): LiveLogMonitorPlaybackEventResult {
  input.logger.info(
    "playWithCurrentEngine cues=%d bpm=%s vol=%s",
    input.cues.length,
    input.liveBpm,
    input.masterVolume,
  );

  if (input.cues.length === 0) {
    input.logger.debug("playWithCurrentEngine — skipped (0 cues)");
    return {
      nextBounceCueWindows: input.bounceCueWindows,
      bounceWindowCount: null,
      emittedVoiceCount: 0,
    };
  }

  const preferGuideTrackMutation =
    input.playableBaseTracks.length > 0 && input.backgroundDeck !== null;
  const preset = input.scene.preset;
  const playbackPlan = buildCuePlaybackPlan({
    cues: input.cues,
    arrangementDepth: input.scene.mutationProfile.arrangementDepth as Parameters<
      typeof buildCuePlaybackPlan
    >[0]["arrangementDepth"],
    maxCuesPerWindow: preset.maxCuesPerWindow,
    hasGuideTrackMutation: preferGuideTrackMutation,
    effectiveLiveMutationState: input.effectiveLiveMutationState,
  });

  const externalCueLayerPlan = buildExternalCueLayerPlan(playbackPlan);
  if (externalCueLayerPlan.shouldRender) {
    const wavBlob = renderCuesToWav(playbackPlan.audibleVoicedCues, 1);
    if (wavBlob) {
      input.logger.info(
        "WAV blob rendered size=%d voices=%d audibleVoices=%d — playing",
        wavBlob.size,
        playbackPlan.voicedCues.length,
        playbackPlan.audibleVoicedCues.length,
      );
      void input.playRenderedBlobThroughGraph(
        wavBlob,
        resolveExternalCueLayerVolume({
          preferGuideTrackMutation: playbackPlan.preferGuideTrackMutation,
          masterVolume: input.masterVolume,
        }),
      );
    } else {
      input.logger.warn(
        "renderCuesToWav returned null for %d audible cues",
        playbackPlan.audibleVoicedCues.length,
      );
    }
  }

  const nextBounceCueWindows =
    playbackPlan.voicedCues.length > 0
      ? appendBounceCueWindows(
          input.bounceCueWindows,
          playbackPlan.voicedCues,
          MAX_BOUNCE_WINDOWS,
        )
      : input.bounceCueWindows;

  const graphSchedulePlan = buildCueGraphSchedulePlan({
    playbackPlan,
    contextState: input.audioContext?.state ?? null,
    currentTime: input.audioContext?.currentTime ?? null,
    beatClock: input.beatClock,
    liveBpm: input.liveBpm,
    preset,
  });

  if (input.audioContext && graphSchedulePlan.shouldSchedule && input.masterGain) {
    const currentTrackSecond = resolveBackgroundTrackSecond(input.audioContext, input.backgroundDeck);
    for (const scheduledEvent of graphSchedulePlan.events) {
      const entry = scheduledEvent.entry;
      const voice = entry.voice;
      const sampleBuffer =
        input.sampleStatus === "ready" && voice.cue.samplePath && voice.track === "foundation"
          ? (input.sampleBuffers.get(voice.cue.samplePath) ?? null)
          : null;
      const playbackEngine = resolveCuePlaybackEngine({
        sampleBufferReady: sampleBuffer !== null,
        preferGuideTrackMutation: playbackPlan.preferGuideTrackMutation,
        currentDeckAvailable: input.backgroundDeck !== null,
        effectiveLiveMutationState: input.effectiveLiveMutationState,
        voiceTrack: voice.track,
        voicedCue: entry.voicedCue,
      });
      if (playbackEngine === "sample" && sampleBuffer) {
        scheduleSampleCue(
          input.audioContext,
          entry.voicedCue,
          sampleBuffer,
          scheduledEvent.cueStartAt,
          input.masterGain,
        );
      } else if (playbackEngine === "track-slice" && input.backgroundDeck) {
        scheduleTrackSliceCue(
          input.audioContext,
          entry.voicedCue,
          input.backgroundDeck,
          scheduledEvent.cueStartAt,
          input.masterGain,
          currentTrackSecond,
        );
      } else {
        scheduleSynthCue(
          input.audioContext,
          entry.voicedCue,
          scheduledEvent.cueStartAt,
          input.masterGain,
        );
      }
    }
  } else if (graphSchedulePlan.shouldResumeSuspendedContext && input.audioContext) {
    void input.audioContext.resume();
  }

  return {
    nextBounceCueWindows,
    bounceWindowCount:
      playbackPlan.voicedCues.length > 0 ? nextBounceCueWindows.length : null,
    emittedVoiceCount: playbackPlan.voicedCues.length,
  };
}

export function playLiveLogMonitorSequencerPreview(input: {
  firings: Array<{
    track: ArrangementTrack;
    step: number;
    humanizeOffsetMs: number;
  }>;
  masterVolume: number;
  playRenderedBlobThroughGraph: (blob: Blob, volume: number) => Promise<void>;
}): void {
  const playbackPlan = buildSequencerPlaybackPlan(input.firings);

  function playFirings(
    batch: Array<{
      track: ArrangementTrack;
      step: number;
      humanizeOffsetMs: number;
    }>,
  ) {
    const cues: RoutedLiveCue[] = buildSequencerPreviewCues(batch);
    const blob = renderCuesToWav(cues, 1);
    if (blob) {
      void input.playRenderedBlobThroughGraph(
        blob,
        resolveSequencerPreviewVolume(input.masterVolume),
      );
    }
  }

  if (playbackPlan.immediate.length > 0) {
    playFirings(playbackPlan.immediate);
  }

  for (const firing of playbackPlan.deferred) {
    globalThis.setTimeout(() => playFirings([firing]), firing.humanizeOffsetMs);
  }
}
