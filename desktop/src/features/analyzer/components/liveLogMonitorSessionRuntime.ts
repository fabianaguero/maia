import type {
  RepositoryAnalysis,
  StartSessionInput,
} from "../../../types/library";
import type { ArrangementTrack, RoutedLiveCue } from "./liveSonificationScene";
import { resolveBeatLooperStartBpm } from "./liveLogMonitorControlRuntime";

export interface BeatClockSeed {
  originTime: number;
  bpm: number;
}

export interface LiveMonitorStartResetState {
  emittedCueCount: number;
  backgroundPlayheadSecond: number;
  activeTailWindowId: string | null;
  error: string | null;
  isStarting: boolean;
  bounceWindowCount: number;
}

export interface LiveMonitorStartAudioPlan {
  beatClockSeed: BeatClockSeed | null;
  beatClockBpm: number | null;
  shouldStartBeatLooper: boolean;
  beatLooperBpm: number | null;
}

export function createLiveMonitorSessionInput(
  repository: RepositoryAnalysis,
  sessionId: string,
): StartSessionInput {
  return {
    sessionId,
    adapterKind: "file",
    source: repository.sourcePath,
    label: repository.title,
    startFromBeginning: true,
  };
}

export function resolveBeatClockSeed(
  contextTime: number | null,
  anchorBpm: number | null,
): BeatClockSeed | null {
  if (contextTime === null || anchorBpm === null || anchorBpm <= 0) {
    return null;
  }

  return {
    originTime: contextTime,
    bpm: anchorBpm,
  };
}

export function buildLiveMonitorStartResetState(): LiveMonitorStartResetState {
  return {
    emittedCueCount: 0,
    backgroundPlayheadSecond: 0,
    activeTailWindowId: null,
    error: null,
    isStarting: true,
    bounceWindowCount: 0,
  };
}

export function resolveLiveMonitorStartAudioPlan(input: {
  contextTime: number | null;
  anchorBpm: number | null;
  useBeatGrid: boolean;
  fallbackBpm?: number;
}): LiveMonitorStartAudioPlan {
  const beatClockSeed = resolveBeatClockSeed(input.contextTime, input.anchorBpm);

  return {
    beatClockSeed,
    beatClockBpm: beatClockSeed?.bpm ?? null,
    shouldStartBeatLooper: input.useBeatGrid && input.contextTime !== null,
    beatLooperBpm: input.useBeatGrid
      ? resolveBeatLooperStartBpm(input.anchorBpm, input.fallbackBpm)
      : null,
  };
}

export function resolveLiveDeckStatusLabel(input: {
  replayActive: boolean;
  liveEnabled: boolean;
  replayLabel: string;
  liveLabel: string;
  stoppedLabel: string;
}): string {
  if (input.replayActive) {
    return input.replayLabel;
  }

  if (input.liveEnabled) {
    return input.liveLabel;
  }

  return input.stoppedLabel;
}

export function resolveLiveMonitorCtaMeta(input: {
  hasBaseListeningBed: boolean;
  baseTrackCount: number;
  soundsLabel: string;
  armedLabel: string;
  notArmedLabel: string;
  basePlaylistLabel: string;
  styleLabel: string;
  mutationLabel: string;
}): string {
  const deckLabel = input.hasBaseListeningBed
    ? `${input.baseTrackCount} ${input.soundsLabel.toLowerCase()} ${input.armedLabel.toLowerCase()}`
    : `${input.basePlaylistLabel} ${input.notArmedLabel.toLowerCase()}`;

  return `${deckLabel} · ${input.styleLabel} · ${input.mutationLabel}`;
}

const SEQ_TRACK_CONFIG: Record<
  ArrangementTrack,
  { noteHz: number; waveform: OscillatorType; gainFactor: number; durationMs: number }
> = {
  foundation: { noteHz: 80, waveform: "square", gainFactor: 0.22, durationMs: 115 },
  motion: { noteHz: 280, waveform: "triangle", gainFactor: 0.14, durationMs: 75 },
  accent: { noteHz: 1800, waveform: "sine", gainFactor: 0.08, durationMs: 40 },
};

export function buildSequencerPreviewCues(
  firings: Array<{ track: ArrangementTrack; step: number; humanizeOffsetMs: number }>,
): RoutedLiveCue[] {
  return firings.map(({ track }, index) => {
    const cfg = SEQ_TRACK_CONFIG[track];

    return {
      id: `seq-${track}-${index}`,
      eventIndex: index,
      level: "info",
      component: "",
      excerpt: "",
      noteHz: cfg.noteHz,
      durationMs: cfg.durationMs,
      gain: cfg.gainFactor,
      waveform: cfg.waveform,
      accent: "none",
      pan: 0,
      routeKey: "info",
      routeLabel: track,
      stemLabel: "",
      sectionLabel: "",
      focus: "",
      samplePath: null,
      sampleLabel: null,
    };
  });
}
