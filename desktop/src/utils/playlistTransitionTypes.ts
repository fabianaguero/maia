import type { LibraryTrack } from "../types/library";
import type { MutationProfileOption, StyleProfileOption } from "../types/music";

export type PlaylistTransitionMode = "cue-start" | "smooth-blend" | "phrase-bridge" | "reset-mix";

export interface PlaylistTransitionPlan {
  currentTrackId: string | null;
  nextTrackId: string;
  mode: PlaylistTransitionMode;
  crossfadeSeconds: number;
  entrySecond: number;
  entryLabel: string;
  phraseSpanBeats: number;
  phraseLabel: string;
  tempoRatio: number;
  tempoAdjustPercent: number;
  harmonicLabel: string;
  bpmDelta: number | null;
  energyDelta: number | null;
  summary: string;
}

export interface PlaylistEntryPoint {
  second: number;
  label: string;
}

export interface PlaylistTransitionOptions {
  styleProfile?: Pick<StyleProfileOption, "playlistCrossfadeSeconds" | "transitionFeel"> | null;
  mutationProfile?: Pick<MutationProfileOption, "transitionTightness"> | null;
}

export interface PlaylistDelayAlignmentOptions {
  track: LibraryTrack;
  entrySecond: number;
  playbackRate: number;
  crossfadeSeconds: number;
  phraseSpanBeats: number;
  fallbackDurationSeconds?: number | null;
}
