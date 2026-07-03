import type { LibraryTrack } from "../../types/library";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { MonitorCueBatchPlayer } from "./monitorCueBatchTypes";
import type { MonitorDeckControls } from "./monitorDeckControls";
import type { MonitorLogLine } from "./monitorLogParsing";
import { buildMonitorLiveStreamUpdateState } from "./monitorLiveStreamOrchestrationRuntime";
import type { MonitorLogSignalPoint } from "./monitorLiveStreamRuntime";
import { shouldEmitMonitorCueAccent } from "./monitorLiveStreamRuntime";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";

export interface ApplyMonitorLiveStreamSubscriptionUpdateInput {
  update: LiveLogStreamUpdate;
  currentTrack: LibraryTrack | null;
  activeAudio: HTMLAudioElement | null;
  currentAudioContext: AudioContext | null;
  fallbackDurationSeconds: number | null;
  fallbackProgress: number;
  controls: MonitorDeckControls;
  maxLiveLines: number;
  liveSuggestedBpm: number | null;
  selectedAnomalyId: string | null;
  previousLiveLines: MonitorLogLine[];
  previousWaveformAnomalies: WaveformAnomalyMarker[];
  previousLogSignalBuffer: MonitorLogSignalPoint[];
  hasBackgroundTrack: boolean;
  audioProbePlayed: boolean;
  lastCueAccentAtMs: number;
  nowMs: number;
  ensureBackgroundGraph: (audio: HTMLAudioElement, context: AudioContext) => unknown;
  applyTrackMutation: (update: LiveLogStreamUpdate) => void;
  playTestTone: () => void;
  playCueBatch: MonitorCueBatchPlayer;
}

export interface ApplyMonitorLiveStreamSubscriptionUpdateResult {
  nextLiveSuggestedBpm: number | null;
  nextAudioProbePlayed: boolean;
  nextLastCueAccentAtMs: number;
  shouldTrackStreamEventAt: boolean;
  nextLiveLines: MonitorLogLine[] | null;
  nextWaveformAnomalies: WaveformAnomalyMarker[] | null;
  nextSelectedAnomalyId: string | null;
  nextLogSignalBuffer: MonitorLogSignalPoint[] | null;
}

export function applyMonitorLiveStreamSubscriptionUpdate(
  input: ApplyMonitorLiveStreamSubscriptionUpdateInput,
): ApplyMonitorLiveStreamSubscriptionUpdateResult {
  const updateState = buildMonitorLiveStreamUpdateState({
    update: input.update,
    currentTrack: input.currentTrack,
    activeAudio: input.activeAudio,
    fallbackDurationSeconds: input.fallbackDurationSeconds,
    fallbackProgress: input.fallbackProgress,
    liveSuggestedBpm: input.liveSuggestedBpm,
    selectedAnomalyId: input.selectedAnomalyId,
    controls: input.controls,
    maxLiveLines: input.maxLiveLines,
    previousLiveLines: input.previousLiveLines,
    previousWaveformAnomalies: input.previousWaveformAnomalies,
    previousLogSignalBuffer: input.previousLogSignalBuffer,
  });
  const { cueBatch, hasRealLines, hasMeaningfulUpdate } = updateState.normalizedUpdate;

  let nextAudioProbePlayed = input.audioProbePlayed;
  let nextLastCueAccentAtMs = input.lastCueAccentAtMs;

  if (input.currentAudioContext?.state === "running") {
    if (!nextAudioProbePlayed) {
      nextAudioProbePlayed = true;
      input.playTestTone();
    }
    if (input.activeAudio && hasMeaningfulUpdate) {
      input.ensureBackgroundGraph(input.activeAudio, input.currentAudioContext);
      input.applyTrackMutation(input.update);
    }
    if (
      shouldEmitMonitorCueAccent({
        update: input.update,
        cueBatch,
        controls: input.controls,
        hasMeaningfulUpdate,
        hasBackgroundTrack: input.hasBackgroundTrack,
        lastCueAccentAtMs: input.lastCueAccentAtMs,
        nowMs: input.nowMs,
      })
    ) {
      nextLastCueAccentAtMs = input.nowMs;
      input.playCueBatch(cueBatch);
    }
  }

  return {
    nextLiveSuggestedBpm: updateState.nextLiveSuggestedBpm,
    nextAudioProbePlayed,
    nextLastCueAccentAtMs,
    shouldTrackStreamEventAt: hasMeaningfulUpdate,
    nextLiveLines: hasRealLines ? updateState.nextLiveLines : null,
    nextWaveformAnomalies: hasRealLines ? updateState.nextWaveformAnomalies : null,
    nextSelectedAnomalyId: hasRealLines
      ? updateState.nextSelectedAnomalyId
      : input.selectedAnomalyId,
    nextLogSignalBuffer: hasRealLines ? updateState.nextLogSignalBuffer : null,
  };
}
