import type { MutationArrangementDepth } from "../../../types/music";
import {
  clampPan,
  resolveArrangementVoices,
  type ArrangementVoice,
  type ArrangementTrack,
  type RoutedLiveCue,
} from "./liveSonificationScene";
import type { LiveMutationState } from "./liveLogMonitorAudioRuntime";

export interface AudibleVoiceEntry {
  voice: ArrangementVoice;
  voicedCue: RoutedLiveCue;
}

export type CuePlaybackEngine = "sample" | "track-slice" | "oscillator";

export interface CuePlaybackPlan {
  preferGuideTrackMutation: boolean;
  cueIntensityMultiplier: number;
  allowExternalCueLayer: boolean;
  cappedCues: RoutedLiveCue[];
  voices: ArrangementVoice[];
  voicedCues: RoutedLiveCue[];
  audibleVoiceEntries: AudibleVoiceEntry[];
  audibleVoiceEntriesForPlayback: AudibleVoiceEntry[];
  audibleVoicedCues: RoutedLiveCue[];
}

export function buildCuePlaybackPlan(input: {
  cues: RoutedLiveCue[];
  arrangementDepth: MutationArrangementDepth;
  maxCuesPerWindow: number;
  hasGuideTrackMutation: boolean;
  effectiveLiveMutationState: LiveMutationState;
}): CuePlaybackPlan {
  const preferGuideTrackMutation = input.hasGuideTrackMutation;
  const cueIntensityMultiplier = !preferGuideTrackMutation
    ? 1
    : input.effectiveLiveMutationState === "critical"
      ? 0.34
      : input.effectiveLiveMutationState === "warning"
        ? 0.18
        : 0.08;
  const allowExternalCueLayer =
    !preferGuideTrackMutation || input.effectiveLiveMutationState === "critical";

  const cappedCues = input.cues.slice(0, input.maxCuesPerWindow);
  const voices = resolveArrangementVoices(cappedCues, input.arrangementDepth);
  const voicedCues: RoutedLiveCue[] = voices.map((voice) => ({
    ...voice.cue,
    noteHz: Number((voice.cue.noteHz * voice.noteMultiplier).toFixed(2)),
    gain: Number(
      Math.min(0.34, Math.max(0.005, voice.cue.gain * voice.gainMultiplier)).toFixed(3),
    ),
    pan: clampPan(voice.cue.pan + voice.panOffset),
  }));

  const audibleVoiceEntries = voices
    .map((voice, index) => {
      const voicedCue = voicedCues[index];
      if (!voicedCue) {
        return null;
      }

      if (
        preferGuideTrackMutation &&
        voicedCue.routeKey === "info" &&
        voicedCue.accent !== "anomaly"
      ) {
        return null;
      }

      return {
        voice,
        voicedCue: preferGuideTrackMutation
          ? {
              ...voicedCue,
              noteHz: Number((voicedCue.noteHz * 0.42).toFixed(2)),
              gain: Number(
                Math.min(0.08, Math.max(0.002, voicedCue.gain * cueIntensityMultiplier)).toFixed(
                  3,
                ),
              ),
              waveform: voicedCue.accent === "anomaly" ? "triangle" : voicedCue.waveform,
              durationMs:
                input.effectiveLiveMutationState === "critical"
                  ? voicedCue.durationMs
                  : Math.max(70, Math.round(voicedCue.durationMs * 0.72)),
            }
          : {
              ...voicedCue,
              gain: Number(Math.min(0.52, Math.max(0.03, voicedCue.gain * 1.9)).toFixed(3)),
              durationMs: Math.max(120, Math.round(voicedCue.durationMs * 1.2)),
            },
      };
    })
    .filter((entry): entry is AudibleVoiceEntry => entry !== null);

  const audibleVoiceEntriesForPlayback = audibleVoiceEntries.filter(
    (entry) =>
      !preferGuideTrackMutation ||
      input.effectiveLiveMutationState === "critical" ||
      entry.voicedCue.accent === "anomaly" ||
      entry.voicedCue.routeKey === "error" ||
      entry.voicedCue.gain >= 0.008,
  );

  const audibleVoicedCues = audibleVoiceEntriesForPlayback
    .map((entry) => entry.voicedCue)
    .filter(
      (cue) =>
        !preferGuideTrackMutation ||
        input.effectiveLiveMutationState === "critical" ||
        cue.accent === "anomaly" ||
        cue.gain >= 0.008,
    );

  return {
    preferGuideTrackMutation,
    cueIntensityMultiplier,
    allowExternalCueLayer,
    cappedCues,
    voices,
    voicedCues,
    audibleVoiceEntries,
    audibleVoiceEntriesForPlayback,
    audibleVoicedCues,
  };
}

export function resolveExternalCueLayerVolume(input: {
  preferGuideTrackMutation: boolean;
  masterVolume: number;
}): number {
  return input.preferGuideTrackMutation
    ? Math.min(0.14, input.masterVolume * 0.3)
    : Math.max(0.22, Math.min(0.92, input.masterVolume * 1.35));
}

export function resolveCuePlaybackEngine(input: {
  sampleBufferReady: boolean;
  preferGuideTrackMutation: boolean;
  currentDeckAvailable: boolean;
  effectiveLiveMutationState: LiveMutationState;
  voiceTrack: ArrangementTrack;
  voicedCue: Pick<RoutedLiveCue, "accent" | "routeKey">;
}): CuePlaybackEngine {
  if (input.sampleBufferReady && input.voiceTrack === "foundation") {
    return "sample";
  }

  const shouldUseTrackSlice =
    input.preferGuideTrackMutation &&
    input.currentDeckAvailable &&
    input.voiceTrack !== "accent" &&
    (input.effectiveLiveMutationState === "critical" ||
      input.voicedCue.accent === "anomaly" ||
      input.voicedCue.routeKey === "error" ||
      (input.effectiveLiveMutationState === "warning" &&
        input.voiceTrack === "foundation"));

  return shouldUseTrackSlice ? "track-slice" : "oscillator";
}
