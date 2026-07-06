import type { MutationProfileOption } from "../../../types/music";
import type {
  ComponentRoute,
  ReferenceAnchor,
  SequencerPreset,
} from "./liveSonificationSceneTypes";
import {
  BALANCED_PRESET,
  CATEGORY_PROFILES,
  COMPONENT_NOTE_SPREAD,
  COMPONENT_PAN_SPREAD,
  GENRE_PROFILES,
  SEQUENCER_PRESETS,
  STRATEGY_PROFILES,
  type CategoryProfile,
  type GenreProfile,
  type StrategyProfile,
} from "./liveSonificationSceneProfileData";

export type {
  CategoryProfile,
  GenreProfile,
  StrategyProfile,
} from "./liveSonificationSceneProfileData";

export function fallbackSequencerPreset(presetId: string | null | undefined): SequencerPreset {
  return SEQUENCER_PRESETS[presetId ?? ""] ?? SEQUENCER_PRESETS.balanced ?? BALANCED_PRESET;
}

export function withMutationPreset(
  preset: SequencerPreset,
  mutationProfile: MutationProfileOption,
): SequencerPreset {
  const density = Math.max(0.45, mutationProfile.cueDensityMultiplier);
  const spacing = Math.max(0.4, mutationProfile.cueSpacingMultiplier);

  return {
    ...preset,
    maxCuesPerWindow: Math.max(3, Math.round(preset.maxCuesPerWindow * density)),
    scheduleGapMs: Math.max(22, Math.round(preset.scheduleGapMs * spacing)),
    infoGainMultiplier: Number(
      (preset.infoGainMultiplier * mutationProfile.routeGainMultiplier).toFixed(2),
    ),
    warnGainMultiplier: Number(
      (preset.warnGainMultiplier * mutationProfile.routeGainMultiplier).toFixed(2),
    ),
    errorGainMultiplier: Number(
      (preset.errorGainMultiplier * mutationProfile.routeGainMultiplier).toFixed(2),
    ),
    anomalyGainMultiplier: Number(
      (
        preset.anomalyGainMultiplier *
        mutationProfile.routeGainMultiplier *
        mutationProfile.anomalyBoostMultiplier
      ).toFixed(2),
    ),
  };
}

export function resolveComponentRoute(
  component: string,
  knownComponents: readonly string[],
): ComponentRoute {
  const index = knownComponents.indexOf(component);
  if (index < 0) {
    return { component, pan: 0, noteMultiplier: 1.0 };
  }

  const slot = index % COMPONENT_PAN_SPREAD.length;
  return {
    component,
    pan: COMPONENT_PAN_SPREAD[slot] ?? 0,
    noteMultiplier: COMPONENT_NOTE_SPREAD[slot] ?? 1.0,
  };
}

export function hasGenreProfile(genreId: string | null | undefined): genreId is string {
  return Boolean(genreId?.trim() && GENRE_PROFILES[genreId]);
}

export function fallbackGenreProfile(genreId: string | null | undefined): GenreProfile {
  return GENRE_PROFILES[genreId ?? ""] ?? GENRE_PROFILES.house;
}

export function fallbackCategoryProfile(categoryId: string): CategoryProfile {
  return CATEGORY_PROFILES[categoryId] ?? CATEGORY_PROFILES.collection;
}

export function fallbackStrategyProfile(strategy: string): StrategyProfile {
  return STRATEGY_PROFILES[strategy] ?? STRATEGY_PROFILES["layered-pack"];
}

export function clampPan(pan: number): number {
  return Math.max(-1, Math.min(1, pan));
}

export function resolveGenreId(
  styleGenreId: string,
  referenceAnchor: ReferenceAnchor | null | undefined,
): string {
  return hasGenreProfile(referenceAnchor?.musicStyleId)
    ? referenceAnchor.musicStyleId
    : styleGenreId;
}
