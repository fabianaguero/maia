import {
  useEffectEvent,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
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
import {
  renderCuesToWav,
  MAX_BOUNCE_WINDOWS,
} from "./wavRenderer";
import {
  resolveBackgroundTrackSecond,
} from "./liveLogMonitorPanelRuntime";
import {
  scheduleSampleCue,
  scheduleSynthCue,
  scheduleTrackSliceCue,
} from "./liveLogMonitorCueScheduleRuntime";
import {
  buildSequencerPreviewCues,
} from "./liveLogMonitorSessionRuntime";
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

export interface LiveLogMonitorPlaybackInput {
  audioContextRef: MutableRefObject<AudioContext | null>;
  masterGainRef: MutableRefObject<GainNode | null>;
  backgroundDeckRef: MutableRefObject<BackgroundDeckState | null>;
  sampleBuffersRef: MutableRefObject<Map<string, AudioBuffer>>;
  beatClockRef: MutableRefObject<BeatClock | null>;
  bounceCuesRef: MutableRefObject<RoutedLiveCue[][]>;
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
  setBounceWindowCount: Dispatch<SetStateAction<number>>;
  setEmittedVoiceCount: Dispatch<SetStateAction<number>>;
  logger: LiveLogMonitorPlaybackLogger;
}

export function useLiveLogMonitorPlayback(input: LiveLogMonitorPlaybackInput) {
  const playWithCurrentEngine = useEffectEvent(
    (cues: RoutedLiveCue[], liveBpm?: number | null) => {
      input.logger.info(
        "playWithCurrentEngine cues=%d bpm=%s vol=%s",
        cues.length,
        liveBpm,
        input.masterVolume,
      );
      if (cues.length === 0) {
        input.logger.debug("playWithCurrentEngine — skipped (0 cues)");
        return;
      }

      const preferGuideTrackMutation =
        input.playableBaseTracks.length > 0 &&
        input.backgroundDeckRef.current !== null;
      const preset = input.scene.preset;
      const playbackPlan = buildCuePlaybackPlan({
        cues,
        arrangementDepth: input.scene.mutationProfile
          .arrangementDepth as Parameters<typeof buildCuePlaybackPlan>[0]["arrangementDepth"],
        maxCuesPerWindow: preset.maxCuesPerWindow,
        hasGuideTrackMutation: preferGuideTrackMutation,
        effectiveLiveMutationState: input.effectiveLiveMutationState,
      });

      const externalCueLayerPlan = buildExternalCueLayerPlan(playbackPlan);
      if (externalCueLayerPlan.shouldRender) {
        const wavBlob = renderCuesToWav(
          playbackPlan.audibleVoicedCues,
          1,
        );
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
              preferGuideTrackMutation:
                playbackPlan.preferGuideTrackMutation,
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

      if (playbackPlan.voicedCues.length > 0) {
        input.bounceCuesRef.current = appendBounceCueWindows(
          input.bounceCuesRef.current,
          playbackPlan.voicedCues,
          MAX_BOUNCE_WINDOWS,
        );
        input.setBounceWindowCount(input.bounceCuesRef.current.length);
      }

      const context = input.audioContextRef.current;
      const graphSchedulePlan = buildCueGraphSchedulePlan({
        playbackPlan,
        contextState: context?.state ?? null,
        currentTime: context?.currentTime ?? null,
        beatClock: input.beatClockRef.current,
        liveBpm,
        preset,
      });

      if (context && graphSchedulePlan.shouldSchedule && input.masterGainRef.current) {
        const dest = input.masterGainRef.current;
        const currentDeck = input.backgroundDeckRef.current;
        const currentTrackSecond = resolveBackgroundTrackSecond(
          context,
          currentDeck,
        );
        for (const scheduledEvent of graphSchedulePlan.events) {
          const entry = scheduledEvent.entry;
          const voice = entry.voice;
          const cueStartAt = scheduledEvent.cueStartAt;
          const voicedCue = entry.voicedCue;
          const sampleBuffer =
            input.sampleStatus === "ready" &&
            voice.cue.samplePath &&
            voice.track === "foundation"
              ? input.sampleBuffersRef.current.get(
                  voice.cue.samplePath,
                ) ?? null
              : null;
          const playbackEngine = resolveCuePlaybackEngine({
            sampleBufferReady: sampleBuffer !== null,
            preferGuideTrackMutation:
              playbackPlan.preferGuideTrackMutation,
            currentDeckAvailable: currentDeck !== null,
            effectiveLiveMutationState: input.effectiveLiveMutationState,
            voiceTrack: voice.track,
            voicedCue,
          });
          if (playbackEngine === "sample" && sampleBuffer) {
            scheduleSampleCue(
              context,
              voicedCue,
              sampleBuffer,
              cueStartAt,
              dest,
            );
          } else if (playbackEngine === "track-slice" && currentDeck) {
            scheduleTrackSliceCue(
              context,
              voicedCue,
              currentDeck,
              cueStartAt,
              dest,
              currentTrackSecond,
            );
          } else {
            scheduleSynthCue(context, voicedCue, cueStartAt, dest);
          }
        }
      } else if (
        graphSchedulePlan.shouldResumeSuspendedContext &&
        context
      ) {
        void context.resume();
      }

      input.setEmittedVoiceCount(
        (c) => c + playbackPlan.voicedCues.length,
      );
    },
  );

  const handleSequencerStepFire = useEffectEvent(
    (
      firings: Array<{
        track: ArrangementTrack;
        step: number;
        humanizeOffsetMs: number;
      }>,
    ) => {
      const playbackPlan = buildSequencerPlaybackPlan(firings);

      function playFirings(
        batch: typeof firings,
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

      for (const f of playbackPlan.deferred) {
        const delay = f.humanizeOffsetMs;
        setTimeout(() => playFirings([f]), delay);
      }
    },
  );

  return {
    playWithCurrentEngine,
    handleSequencerStepFire,
  };
}
