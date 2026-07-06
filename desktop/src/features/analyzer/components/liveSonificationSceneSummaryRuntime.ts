import type { BaseAssetRecord, CompositionResultRecord } from "../../../types/library";
import type {
  CategoryProfile,
  GenreProfile,
  StrategyProfile,
} from "./liveSonificationSceneProfiles";
import type { ReferenceAnchor, SequencerPreset } from "./liveSonificationSceneTypes";

export function buildLiveSonificationSceneSummary(input: {
  baseAsset: BaseAssetRecord | null;
  composition: CompositionResultRecord | null;
  styleLabel: string;
  mutationLabel: string;
  genreProfile: GenreProfile;
  preset: SequencerPreset;
  categoryProfile: CategoryProfile;
  strategyProfile: StrategyProfile;
  categoryLabel: string;
  referenceAnchor: ReferenceAnchor | null | undefined;
}): string {
  const anchorSuffix = input.referenceAnchor
    ? ` · based on ${input.referenceAnchor.trackTitle}${input.referenceAnchor.bpm ? ` @ ${input.referenceAnchor.bpm.toFixed(0)} BPM` : ""}`
    : "";

  if (input.composition) {
    return `${input.styleLabel} / ${input.mutationLabel} — ${input.genreProfile.label} · ${input.preset.label}, ${input.categoryProfile.descriptor} with ${input.strategyProfile.descriptor}, using ${input.composition.title} as structure overlay.${anchorSuffix}`;
  }

  return `${input.styleLabel} / ${input.mutationLabel} — ${input.genreProfile.label} · ${input.preset.label}, ${input.genreProfile.descriptor} · ${input.baseAsset?.title ?? input.categoryLabel}.${anchorSuffix}`;
}
