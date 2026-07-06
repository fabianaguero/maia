import type { BaseAssetRecord, CompositionResultRecord, LiveLogCue } from "../../../types/library";
import { routeLiveCueThroughScene } from "./liveSonificationCueRoutingRuntime";
import { buildLiveSonificationRoutes } from "./liveSonificationRouteRuntime";
import { resolveLiveSonificationSceneInputs } from "./liveSonificationSceneResolutionRuntime";
import { resolveSceneSampleSources } from "./liveSonificationSampleSourceRuntime";
import { buildLiveSonificationSceneSummary } from "./liveSonificationSceneSummaryRuntime";
import type {
  ComponentOverride,
  ReferenceAnchor,
  ResolvedLiveSonificationScene,
  RoutedLiveCue,
} from "./liveSonificationSceneTypes";

export function resolveLiveSonificationScene(
  baseAsset: BaseAssetRecord | null,
  composition: CompositionResultRecord | null,
  styleProfileId?: string | null,
  mutationProfileId?: string | null,
  referenceAnchor?: ReferenceAnchor | null,
): ResolvedLiveSonificationScene {
  const resolved = resolveLiveSonificationSceneInputs({
    baseAsset,
    composition,
    styleProfileId,
    mutationProfileId,
    referenceAnchor,
  });
  const sampleSource = resolveSceneSampleSources(baseAsset, composition);
  const routes = buildLiveSonificationRoutes({
    genreId: resolved.genreId,
    categoryId: resolved.categoryId,
    categoryLabel: resolved.categoryLabel,
    strategy: resolved.strategy,
    sections: resolved.sections,
    cuePoints: resolved.cuePoints,
    renderPreview: resolved.renderPreview,
    sampleSources: sampleSource.sources,
  });

  return {
    baseAsset,
    composition,
    styleProfile: resolved.styleProfile,
    mutationProfile: resolved.mutationProfile,
    genreId: resolved.genreId,
    genreLabel: resolved.genreProfile.label,
    categoryId: resolved.categoryId,
    categoryLabel: resolved.categoryLabel,
    strategy: resolved.strategy,
    referenceTitle: resolved.referenceTitle,
    headroomDb: resolved.renderPreview?.headroomDb ?? null,
    masterChain: resolved.renderPreview?.masterChain ?? [],
    summary: buildLiveSonificationSceneSummary({
      baseAsset,
      composition,
      styleLabel: resolved.styleProfile.label,
      mutationLabel: resolved.mutationProfile.label,
      genreProfile: resolved.genreProfile,
      preset: resolved.preset,
      categoryProfile: resolved.categoryProfile,
      strategyProfile: resolved.strategyProfile,
      categoryLabel: resolved.categoryLabel,
      referenceAnchor,
    }),
    sampleSources: sampleSource.sources,
    sampleSourceMode: sampleSource.mode,
    sampleSourceCount: sampleSource.sources.length,
    sampleSourceDetail: sampleSource.detail,
    routes,
    presetId: resolved.presetId,
    presetLabel: resolved.preset.label,
    preset: resolved.preset,
    referenceAnchor: referenceAnchor ?? null,
  };
}

export function routeCueThroughScene(
  cue: LiveLogCue,
  scene: ResolvedLiveSonificationScene,
  index: number,
  knownComponents?: readonly string[],
  componentOverrides?: ReadonlyMap<string, ComponentOverride>,
): RoutedLiveCue {
  return routeLiveCueThroughScene(cue, scene, index, knownComponents, componentOverrides);
}
