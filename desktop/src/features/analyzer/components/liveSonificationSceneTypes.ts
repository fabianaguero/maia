import type {
  BaseAssetRecord,
  CompositionResultRecord,
  LibraryTrack,
  LiveLogCue,
} from "../../../types/library";
import type { MutationProfileOption, StyleProfileOption } from "../../../types/music";

export interface ReferenceAnchor {
  trackId: string;
  trackTitle: string;
  musicStyleId: string | null;
  bpm: number | null;
  energyLevel: number;
  suggestedPresetId: string;
}

function waveformEnergy(bins: number[]): number {
  if (bins.length === 0) {
    return 0.5;
  }
  const avg = bins.reduce((a, b) => a + b, 0) / bins.length;
  return Math.max(0, Math.min(1, avg));
}

function suggestPresetFromBpm(bpm: number | null): string {
  if (!bpm) {
    return "balanced";
  }
  if (bpm < 80) {
    return "sparse";
  }
  if (bpm < 120) {
    return "balanced";
  }
  if (bpm < 160) {
    return "beat-locked";
  }
  return "cascade";
}

export function deriveReferenceAnchor(track: LibraryTrack): ReferenceAnchor {
  return {
    trackId: track.id,
    trackTitle: track.tags.title,
    musicStyleId: track.tags.musicStyleId || null,
    bpm: track.analysis.bpm ?? null,
    energyLevel: waveformEnergy(track.analysis.waveformBins),
    suggestedPresetId: suggestPresetFromBpm(track.analysis.bpm ?? null),
  };
}

export function blendAnchors(anchors: readonly ReferenceAnchor[]): ReferenceAnchor {
  if (anchors.length === 0) {
    throw new Error("blendAnchors requires at least one anchor");
  }
  if (anchors.length === 1) {
    return {
      ...anchors[0],
      trackId: "playlist-blend",
      trackTitle: anchors[0].trackTitle,
    };
  }

  const bpms = anchors.map((a) => a.bpm).filter((b): b is number => b !== null);
  let blendedBpm: number | null = null;
  if (bpms.length > 0) {
    const sorted = [...bpms].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    blendedBpm = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  const blendedEnergy = anchors.reduce((sum, a) => sum + a.energyLevel, 0) / anchors.length;

  const styleCounts = new Map<string, number>();
  for (const anchor of anchors) {
    if (anchor.musicStyleId) {
      styleCounts.set(anchor.musicStyleId, (styleCounts.get(anchor.musicStyleId) ?? 0) + 1);
    }
  }

  let blendedStyleId: string | null = null;
  let topCount = 0;
  let tied = false;
  for (const [id, count] of styleCounts) {
    if (count > topCount) {
      topCount = count;
      blendedStyleId = id;
      tied = false;
    } else if (count === topCount) {
      tied = true;
    }
  }

  if (tied) {
    blendedStyleId = null;
  }

  return {
    trackId: "playlist-blend",
    trackTitle: `Playlist blend · ${anchors.length} tracks`,
    musicStyleId: blendedStyleId,
    bpm: blendedBpm !== null ? Number(blendedBpm.toFixed(1)) : null,
    energyLevel: Number(blendedEnergy.toFixed(3)),
    suggestedPresetId: suggestPresetFromBpm(blendedBpm),
  };
}

export type SceneRouteKey = "info" | "warn" | "error" | "anomaly";

export interface SequencerPreset {
  label: string;
  descriptor: string;
  maxCuesPerWindow: number;
  scheduleGapMs: number;
  infoGainMultiplier: number;
  warnGainMultiplier: number;
  errorGainMultiplier: number;
  anomalyGainMultiplier: number;
  useBeatGrid: boolean;
  rhythmDivision: number;
}

export interface ComponentRoute {
  component: string;
  pan: number;
  noteMultiplier: number;
}

export interface ComponentOverride {
  gainMult: number;
  muted: boolean;
}

export interface LiveSonificationRoute {
  key: SceneRouteKey;
  label: string;
  stemLabel: string;
  sectionLabel: string;
  cueLabel: string;
  focus: string;
  waveform: OscillatorType;
  noteMultiplier: number;
  durationScale: number;
  gainScale: number;
  pan: number;
  samplePath: string | null;
  sampleLabel: string | null;
}

export interface ResolvedLiveSonificationScene {
  baseAsset: BaseAssetRecord | null;
  composition: CompositionResultRecord | null;
  styleProfile: StyleProfileOption;
  mutationProfile: MutationProfileOption;
  genreId: string;
  genreLabel: string;
  categoryId: string;
  categoryLabel: string;
  strategy: string;
  referenceTitle: string;
  headroomDb: number | null;
  masterChain: string[];
  summary: string;
  sampleSources: Array<{ path: string; label: string }>;
  sampleSourceMode: "single-sample" | "multi-sample" | "synth";
  sampleSourceCount: number;
  sampleSourceDetail: string;
  routes: LiveSonificationRoute[];
  presetId: string;
  presetLabel: string;
  preset: SequencerPreset;
  referenceAnchor: ReferenceAnchor | null;
}

export interface RoutedLiveCue extends LiveLogCue {
  pan: number;
  routeKey: SceneRouteKey;
  routeLabel: string;
  stemLabel: string;
  sectionLabel: string;
  focus: string;
  samplePath: string | null;
  sampleLabel: string | null;
  logLine?: string;
}

export type ArrangementTrack = "foundation" | "motion" | "accent";

export interface ArrangementVoice {
  cue: RoutedLiveCue;
  track: ArrangementTrack;
  panOffset: number;
  noteMultiplier: number;
  gainMultiplier: number;
  timeOffsetMs: number;
}
