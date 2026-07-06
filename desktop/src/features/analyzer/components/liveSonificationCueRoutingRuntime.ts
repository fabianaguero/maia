import type { LiveLogCue } from "../../../types/library";
import {
  clampPan,
  fallbackCategoryProfile,
  fallbackGenreProfile,
  fallbackStrategyProfile,
  resolveComponentRoute,
} from "./liveSonificationSceneProfiles";
import { routeKeyForCue } from "./liveSonificationSampleSourceRuntime";
import type {
  ComponentOverride,
  ResolvedLiveSonificationScene,
  RoutedLiveCue,
} from "./liveSonificationSceneTypes";

export function routeLiveCueThroughScene(
  cue: LiveLogCue,
  scene: ResolvedLiveSonificationScene,
  index: number,
  knownComponents?: readonly string[],
  componentOverrides?: ReadonlyMap<string, ComponentOverride>,
): RoutedLiveCue {
  const routeKey = routeKeyForCue(cue);
  const route = scene.routes.find((candidate) => candidate.key === routeKey) ?? scene.routes[0];
  const categoryProfile = fallbackCategoryProfile(scene.categoryId);
  const strategyProfile = fallbackStrategyProfile(scene.strategy);
  const genreProfile = fallbackGenreProfile(scene.genreId);
  const presetGainMultiplier =
    routeKey === "info"
      ? scene.preset.infoGainMultiplier
      : routeKey === "warn"
        ? scene.preset.warnGainMultiplier
        : routeKey === "error"
          ? scene.preset.errorGainMultiplier
          : scene.preset.anomalyGainMultiplier;
  const componentRoute =
    knownComponents && knownComponents.length > 0
      ? resolveComponentRoute(cue.component, knownComponents)
      : null;
  const indexOffsetMultiplier = 1 + ((index % 3) - 1) * 0.015;
  const noteHz =
    cue.noteHz *
    categoryProfile.noteMultiplier *
    strategyProfile.noteMultiplier *
    genreProfile.noteMultiplier *
    route.noteMultiplier *
    scene.mutationProfile.noteMotionMultiplier *
    indexOffsetMultiplier *
    (componentRoute?.noteMultiplier ?? 1.0);
  const durationMs =
    cue.durationMs *
    categoryProfile.durationScale *
    strategyProfile.durationScale *
    genreProfile.durationScale *
    route.durationScale;
  const anchorEnergyGain = scene.referenceAnchor
    ? 0.7 + scene.referenceAnchor.energyLevel * 0.6
    : 1.0;
  const override = componentOverrides?.get(cue.component);

  if (override?.muted) {
    return {
      ...cue,
      noteHz: cue.noteHz,
      durationMs: 0,
      gain: 0,
      waveform: "sine",
      pan: 0,
      routeKey,
      routeLabel: "muted",
      stemLabel: "",
      sectionLabel: "",
      focus: "",
      samplePath: null,
      sampleLabel: null,
    };
  }

  const gain =
    cue.gain *
    categoryProfile.gainScale *
    strategyProfile.gainScale *
    genreProfile.gainScale *
    route.gainScale *
    presetGainMultiplier *
    anchorEnergyGain *
    (routeKey === "anomaly"
      ? scene.mutationProfile.anomalyBoostMultiplier
      : scene.mutationProfile.routeGainMultiplier) *
    (override?.gainMult ?? 1.0);
  const pan =
    componentRoute && knownComponents && knownComponents.length > 1
      ? clampPan(route.pan * 0.4 + componentRoute.pan * 0.6)
      : route.pan;

  return {
    ...cue,
    noteHz: Number(noteHz.toFixed(2)),
    durationMs: Math.max(90, Math.round(durationMs)),
    gain: Number(Math.min(0.34, Math.max(0.05, gain)).toFixed(3)),
    waveform: route.waveform,
    pan,
    routeKey,
    routeLabel: route.label,
    stemLabel: route.stemLabel,
    sectionLabel: route.sectionLabel,
    focus: route.focus,
    samplePath: route.samplePath,
    sampleLabel: route.sampleLabel,
  };
}
