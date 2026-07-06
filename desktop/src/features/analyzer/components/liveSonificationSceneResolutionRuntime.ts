import type { BaseAssetRecord, CompositionResultRecord } from "../../../types/library";
import { resolveMutationProfile, resolveStyleProfile } from "../../../config/liveProfiles";
import {
  resolveArrangementSections,
  resolveCuePoints,
  resolveRenderPreview,
} from "./compositionPreview";
import {
  fallbackCategoryProfile,
  fallbackGenreProfile,
  fallbackSequencerPreset,
  fallbackStrategyProfile,
  resolveGenreId,
  withMutationPreset,
} from "./liveSonificationSceneProfiles";
import type { ReferenceAnchor } from "./liveSonificationSceneTypes";

export function resolveLiveSonificationSceneInputs(input: {
  baseAsset: BaseAssetRecord | null;
  composition: CompositionResultRecord | null;
  styleProfileId?: string | null;
  mutationProfileId?: string | null;
  referenceAnchor?: ReferenceAnchor | null;
}) {
  const styleProfile = resolveStyleProfile(input.styleProfileId);
  const mutationProfile = resolveMutationProfile(input.mutationProfileId);
  const genreId = resolveGenreId(styleProfile.genreId, input.referenceAnchor);
  const presetId =
    input.referenceAnchor && (styleProfile.presetId === "balanced" || !styleProfile.presetId)
      ? input.referenceAnchor.suggestedPresetId
      : styleProfile.presetId;
  const preset = withMutationPreset(fallbackSequencerPreset(presetId), mutationProfile);
  const genreProfile = fallbackGenreProfile(genreId);
  const categoryId =
    input.baseAsset?.categoryId ?? input.composition?.baseAssetCategoryId ?? "collection";
  const categoryLabel =
    input.baseAsset?.categoryLabel ?? input.composition?.baseAssetCategoryLabel ?? "Collection";
  const strategy = input.composition?.strategy ?? "layered-pack";
  const referenceTitle = input.composition?.referenceTitle ?? "Live log signal";
  const categoryProfile = fallbackCategoryProfile(categoryId);
  const strategyProfile = fallbackStrategyProfile(strategy);
  const renderPreview = input.composition ? resolveRenderPreview(input.composition) : null;
  const sections = input.composition ? resolveArrangementSections(input.composition) : [];
  const cuePoints = input.composition ? resolveCuePoints(input.composition) : [];

  return {
    styleProfile,
    mutationProfile,
    genreId,
    presetId,
    preset,
    genreProfile,
    categoryId,
    categoryLabel,
    strategy,
    referenceTitle,
    categoryProfile,
    strategyProfile,
    renderPreview,
    sections,
    cuePoints,
  };
}
