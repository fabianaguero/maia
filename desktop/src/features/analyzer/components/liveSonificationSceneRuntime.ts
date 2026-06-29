import type {
  BaseAssetRecord,
  CompositionResultRecord,
  LiveLogCue,
} from "../../../types/library";
import { resolveMutationProfile, resolveStyleProfile } from "../../../config/liveProfiles";
import {
  resolveArrangementSections,
  resolveCuePoints,
  resolveRenderPreview,
} from "./compositionPreview";
import {
  clampPan,
  fallbackCategoryProfile,
  fallbackGenreProfile,
  fallbackSequencerPreset,
  fallbackStrategyProfile,
  resolveComponentRoute,
  resolveGenreId,
  withMutationPreset,
} from "./liveSonificationSceneProfiles";
import type {
  ComponentOverride,
  LiveSonificationRoute,
  ReferenceAnchor,
  ResolvedLiveSonificationScene,
  RoutedLiveCue,
  SceneRouteKey,
} from "./liveSonificationSceneTypes";

const PLAYABLE_AUDIO_EXTENSIONS = new Set([
  ".wav",
  ".mp3",
  ".flac",
  ".ogg",
  ".oga",
  ".aif",
  ".aiff",
  ".m4a",
  ".aac",
  ".mp4",
]);

function fileExtension(path: string | null | undefined): string {
  if (!path) {
    return "";
  }

  const cleaned = path.trim().toLowerCase();
  const dotIndex = cleaned.lastIndexOf(".");
  if (dotIndex < 0) {
    return "";
  }

  return cleaned.slice(dotIndex);
}

function isPlayableAudioPath(path: string | null | undefined): boolean {
  return PLAYABLE_AUDIO_EXTENSIONS.has(fileExtension(path));
}

function metricPreviewEntries(baseAsset: BaseAssetRecord | null): string[] {
  const raw = baseAsset?.metrics.previewEntries;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((entry): entry is string => typeof entry === "string");
}

function metricPlayableAudioEntries(baseAsset: BaseAssetRecord | null): string[] {
  const raw = baseAsset?.metrics.playableAudioEntries;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((entry): entry is string => typeof entry === "string");
}

function joinManagedPath(rootPath: string, relativeEntry: string): string {
  const separator = rootPath.includes("\\") ? "\\" : "/";
  const trimmedRoot = rootPath.replace(/[\\/]+$/, "");
  const normalizedEntry = relativeEntry.replace(/[\\/]+/g, separator);
  return `${trimmedRoot}${separator}${normalizedEntry}`;
}

function resolveSceneSampleSources(
  baseAsset: BaseAssetRecord | null,
  composition: CompositionResultRecord | null,
): {
  sources: Array<{ path: string; label: string }>;
  mode: "single-sample" | "multi-sample" | "synth";
  detail: string;
} {
  if (baseAsset && !baseAsset.storagePath.startsWith("browser-fallback://")) {
    if (baseAsset.sourceKind === "file" && isPlayableAudioPath(baseAsset.storagePath)) {
      return {
        sources: [{ path: baseAsset.storagePath, label: baseAsset.title }],
        mode: "single-sample",
        detail: "Live cues trigger the managed base-asset file directly.",
      };
    }

    if (baseAsset.sourceKind === "directory") {
      const playableEntries = [
        ...metricPlayableAudioEntries(baseAsset),
        ...metricPreviewEntries(baseAsset),
      ].filter(
        (entry, index, entries) => isPlayableAudioPath(entry) && entries.indexOf(entry) === index,
      );

      if (playableEntries.length > 0) {
        const sources = playableEntries.slice(0, 4).map((entry) => ({
          path: joinManagedPath(baseAsset.storagePath, entry),
          label: entry,
        }));

        return {
          sources,
          mode: sources.length === 1 ? "single-sample" : "multi-sample",
          detail:
            sources.length === 1
              ? "Live cues use the only playable entry from the managed base-asset folder."
              : "Live cues distribute across multiple playable entries from the managed base-asset folder.",
        };
      }
    }
  }

  if (
    composition?.previewAudioPath &&
    !composition.previewAudioPath.startsWith("browser-fallback://") &&
    isPlayableAudioPath(composition.previewAudioPath)
  ) {
    return {
      sources: [{ path: composition.previewAudioPath, label: composition.title }],
      mode: "single-sample",
      detail: "Live cues trigger the composition preview WAV — hybrid mixer mode.",
    };
  }

  return {
    sources: [],
    mode: "synth",
    detail: "No playable managed audio found; live cues stay on internal synthesis.",
  };
}

function routeSampleAssignment(
  sampleSources: Array<{ path: string; label: string }>,
  routeKey: SceneRouteKey,
): { samplePath: string | null; sampleLabel: string | null } {
  if (sampleSources.length === 0) {
    return { samplePath: null, sampleLabel: null };
  }

  if (sampleSources.length === 1) {
    const onlySource = sampleSources[0];
    return onlySource
      ? { samplePath: onlySource.path, sampleLabel: onlySource.label }
      : { samplePath: null, sampleLabel: null };
  }

  const index =
    routeKey === "info"
      ? 0
      : routeKey === "warn"
        ? Math.min(1, sampleSources.length - 1)
        : routeKey === "error"
          ? Math.min(2, sampleSources.length - 1)
          : sampleSources.length - 1;

  const selected = sampleSources[index] ?? sampleSources[0];
  return selected
    ? { samplePath: selected.path, sampleLabel: selected.label }
    : { samplePath: null, sampleLabel: null };
}

function routeKeyForCue(cue: LiveLogCue): SceneRouteKey {
  if (cue.accent === "anomaly") {
    return "anomaly";
  }
  if (cue.level === "error") {
    return "error";
  }
  if (cue.level === "warn") {
    return "warn";
  }
  return "info";
}

function buildSceneRoutes(input: {
  genreId: string;
  categoryLabel: string;
  sections: ReturnType<typeof resolveArrangementSections>;
  cuePoints: ReturnType<typeof resolveCuePoints>;
  renderPreview: ReturnType<typeof resolveRenderPreview> | null;
  sampleSources: Array<{ path: string; label: string }>;
  categoryId: string;
  strategy: string;
}): LiveSonificationRoute[] {
  const { categoryLabel, sections, cuePoints, renderPreview, sampleSources, genreId } = input;
  const genreProfile = fallbackGenreProfile(genreId);
  const categoryProfile = fallbackCategoryProfile(input.categoryId);
  const strategyProfile = fallbackStrategyProfile(input.strategy);
  const foundationStem =
    renderPreview?.stems.find((stem) => stem.role === "foundation") ?? renderPreview?.stems[0];
  const supportStem =
    renderPreview?.stems.find((stem) => stem.role === "support") ??
    renderPreview?.stems[1] ??
    foundationStem;
  const glueStem =
    renderPreview?.stems.find((stem) => stem.role === "glue") ??
    renderPreview?.stems[renderPreview.stems.length - 1] ??
    supportStem ??
    foundationStem;
  const spotlightStem =
    renderPreview?.stems.find((stem) => stem.role === "spotlight") ?? glueStem ?? foundationStem;
  const introSection = sections[0];
  const buildSection = sections[1] ?? introSection;
  const mainSection = sections[2] ?? buildSection ?? introSection;
  const outroSection = sections[3] ?? mainSection ?? buildSection ?? introSection;
  const introCue = cuePoints[0];
  const buildCue = cuePoints[1] ?? introCue;
  const mainCue = cuePoints[2] ?? buildCue ?? introCue;
  const outroCue = cuePoints[cuePoints.length - 1] ?? mainCue ?? buildCue ?? introCue;

  return (
    [
      {
        key: "info",
        label: genreProfile.infoLabel,
        stemLabel: foundationStem?.label ?? `${categoryLabel} foundation`,
        sectionLabel: introSection?.label ?? "Baseline window",
        cueLabel: introCue?.label ?? "Baseline cue",
        focus:
          foundationStem?.focus ??
          "Keep a continuous representation of nominal system activity in the background.",
        waveform: genreProfile.infoWaveform,
        noteMultiplier: 0.96,
        durationScale: 1,
        gainScale: 0.92,
        pan: foundationStem?.pan ?? 0,
        samplePath: null,
        sampleLabel: null,
      },
      {
        key: "warn",
        label: genreProfile.warnLabel,
        stemLabel: supportStem?.label ?? `${categoryLabel} motion`,
        sectionLabel: buildSection?.label ?? "Build window",
        cueLabel: buildCue?.label ?? "Build cue",
        focus:
          supportStem?.focus ??
          "Push warning pressure forward before the system crosses into a harder anomaly state.",
        waveform: genreProfile.warnWaveform,
        noteMultiplier: 1.08,
        durationScale: 1.06,
        gainScale: 1.08,
        pan: supportStem?.pan ?? 0.08,
        samplePath: null,
        sampleLabel: null,
      },
      {
        key: "error",
        label: genreProfile.errorLabel,
        stemLabel: spotlightStem?.label ?? `${categoryLabel} impact`,
        sectionLabel: mainSection?.label ?? "Impact window",
        cueLabel: mainCue?.label ?? "Impact cue",
        focus:
          spotlightStem?.focus ??
          "Make clear when the live stream shifts from pressure into a real failure state.",
        waveform: genreProfile.errorWaveform,
        noteMultiplier: 1.22,
        durationScale: 0.96,
        gainScale: 1.16,
        pan: spotlightStem?.pan ?? 0,
        samplePath: null,
        sampleLabel: null,
      },
      {
        key: "anomaly",
        label: genreProfile.anomalyLabel,
        stemLabel: glueStem?.label ?? `${categoryLabel} anomaly accent`,
        sectionLabel: outroSection?.label ?? "Accent window",
        cueLabel: outroCue?.label ?? "Accent cue",
        focus:
          glueStem?.focus ??
          "Mark bursts, exceptions, or drift spikes with a clearly distinct accent.",
        waveform: genreProfile.anomalyWaveform,
        noteMultiplier: 1.38,
        durationScale: 0.84,
        gainScale: 1.24,
        pan: glueStem?.pan ?? 0.18,
        samplePath: null,
        sampleLabel: null,
      },
    ] satisfies LiveSonificationRoute[]
  ).map((route) => ({
    ...route,
    pan: clampPan(route.pan + categoryProfile.panBias + strategyProfile.panBias),
    ...routeSampleAssignment(sampleSources, route.key),
  }));
}

export function resolveLiveSonificationScene(
  baseAsset: BaseAssetRecord | null,
  composition: CompositionResultRecord | null,
  styleProfileId?: string | null,
  mutationProfileId?: string | null,
  referenceAnchor?: ReferenceAnchor | null,
): ResolvedLiveSonificationScene {
  const styleProfile = resolveStyleProfile(styleProfileId);
  const mutationProfile = resolveMutationProfile(mutationProfileId);
  const genreId = resolveGenreId(styleProfile.genreId, referenceAnchor);
  const presetId =
    referenceAnchor && (styleProfile.presetId === "balanced" || !styleProfile.presetId)
      ? referenceAnchor.suggestedPresetId
      : styleProfile.presetId;
  const preset = withMutationPreset(fallbackSequencerPreset(presetId), mutationProfile);
  const genreProfile = fallbackGenreProfile(genreId);
  const categoryId = baseAsset?.categoryId ?? composition?.baseAssetCategoryId ?? "collection";
  const categoryLabel =
    baseAsset?.categoryLabel ?? composition?.baseAssetCategoryLabel ?? "Collection";
  const strategy = composition?.strategy ?? "layered-pack";
  const referenceTitle = composition?.referenceTitle ?? "Live log signal";
  const categoryProfile = fallbackCategoryProfile(categoryId);
  const strategyProfile = fallbackStrategyProfile(strategy);
  const renderPreview = composition ? resolveRenderPreview(composition) : null;
  const sampleSource = resolveSceneSampleSources(baseAsset, composition);
  const sections = composition ? resolveArrangementSections(composition) : [];
  const cuePoints = composition ? resolveCuePoints(composition) : [];
  const routes = buildSceneRoutes({
    genreId,
    categoryId,
    categoryLabel,
    strategy,
    sections,
    cuePoints,
    renderPreview,
    sampleSources: sampleSource.sources,
  });

  const anchorSuffix = referenceAnchor
    ? ` · based on ${referenceAnchor.trackTitle}${referenceAnchor.bpm ? ` @ ${referenceAnchor.bpm.toFixed(0)} BPM` : ""}`
    : "";
  const summary = composition
    ? `${styleProfile.label} / ${mutationProfile.label} — ${genreProfile.label} · ${preset.label}, ${categoryProfile.descriptor} with ${strategyProfile.descriptor}, using ${composition.title} as structure overlay.${anchorSuffix}`
    : `${styleProfile.label} / ${mutationProfile.label} — ${genreProfile.label} · ${preset.label}, ${genreProfile.descriptor} · ${baseAsset?.title ?? categoryLabel}.${anchorSuffix}`;

  return {
    baseAsset,
    composition,
    styleProfile,
    mutationProfile,
    genreId,
    genreLabel: genreProfile.label,
    categoryId,
    categoryLabel,
    strategy,
    referenceTitle,
    headroomDb: renderPreview?.headroomDb ?? null,
    masterChain: renderPreview?.masterChain ?? [],
    summary,
    sampleSources: sampleSource.sources,
    sampleSourceMode: sampleSource.mode,
    sampleSourceCount: sampleSource.sources.length,
    sampleSourceDetail: sampleSource.detail,
    routes,
    presetId,
    presetLabel: preset.label,
    preset,
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
