import type {
  BaseAssetRecord,
  CompositionResultRecord,
  LiveLogCue,
} from "../../../types/library";
import {
  resolveArrangementSections,
  resolveCuePoints,
  resolveRenderPreview,
} from "./compositionPreview";

type SceneRouteKey = "info" | "warn" | "error" | "anomaly";

interface CategoryProfile {
  baseWaveform: OscillatorType;
  warnWaveform: OscillatorType;
  errorWaveform: OscillatorType;
  anomalyWaveform: OscillatorType;
  noteMultiplier: number;
  durationScale: number;
  gainScale: number;
  panBias: number;
  descriptor: string;
}

interface StrategyProfile {
  noteMultiplier: number;
  durationScale: number;
  gainScale: number;
  panBias: number;
  descriptor: string;
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
}

const CATEGORY_PROFILES: Record<string, CategoryProfile> = {
  collection: {
    baseWaveform: "triangle",
    warnWaveform: "triangle",
    errorWaveform: "sawtooth",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 1,
    durationScale: 1,
    gainScale: 1,
    panBias: 0,
    descriptor: "balanced reusable collection",
  },
  "drum-kit": {
    baseWaveform: "square",
    warnWaveform: "triangle",
    errorWaveform: "square",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 0.76,
    durationScale: 0.78,
    gainScale: 1.12,
    panBias: 0,
    descriptor: "tight transient kit",
  },
  "bass-motif": {
    baseWaveform: "sawtooth",
    warnWaveform: "triangle",
    errorWaveform: "sawtooth",
    anomalyWaveform: "square",
    noteMultiplier: 0.64,
    durationScale: 0.92,
    gainScale: 1.08,
    panBias: -0.04,
    descriptor: "low-end anchor",
  },
  "pad-texture": {
    baseWaveform: "sine",
    warnWaveform: "triangle",
    errorWaveform: "triangle",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 1.08,
    durationScale: 1.34,
    gainScale: 0.88,
    panBias: -0.12,
    descriptor: "atmospheric bed",
  },
  "fx-palette": {
    baseWaveform: "triangle",
    warnWaveform: "sawtooth",
    errorWaveform: "sawtooth",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 1.24,
    durationScale: 0.72,
    gainScale: 1.06,
    panBias: 0.18,
    descriptor: "transition accent pack",
  },
  "vocal-hook": {
    baseWaveform: "square",
    warnWaveform: "triangle",
    errorWaveform: "square",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 1.28,
    durationScale: 1.08,
    gainScale: 0.96,
    panBias: 0.08,
    descriptor: "hook-forward topline layer",
  },
  "code-pattern": {
    baseWaveform: "triangle",
    warnWaveform: "triangle",
    errorWaveform: "square",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 0.94,
    durationScale: 0.94,
    gainScale: 1,
    panBias: 0,
    descriptor: "structural pattern motif",
  },
};

const STRATEGY_PROFILES: Record<string, StrategyProfile> = {
  "rhythm-foundation": {
    noteMultiplier: 0.92,
    durationScale: 0.84,
    gainScale: 1.1,
    panBias: 0,
    descriptor: "rhythm-first routing",
  },
  "low-end-anchor": {
    noteMultiplier: 0.78,
    durationScale: 0.9,
    gainScale: 1.12,
    panBias: -0.04,
    descriptor: "low-end led routing",
  },
  "harmonic-bed": {
    noteMultiplier: 1.08,
    durationScale: 1.28,
    gainScale: 0.9,
    panBias: -0.08,
    descriptor: "harmonic sustain routing",
  },
  "transition-accent": {
    noteMultiplier: 1.18,
    durationScale: 0.74,
    gainScale: 1.08,
    panBias: 0.1,
    descriptor: "transition-focused routing",
  },
  "hook-framing": {
    noteMultiplier: 1.22,
    durationScale: 1.04,
    gainScale: 0.98,
    panBias: 0.06,
    descriptor: "hook-framing routing",
  },
  "pattern-translation": {
    noteMultiplier: 1,
    durationScale: 0.92,
    gainScale: 1.04,
    panBias: 0,
    descriptor: "pattern translation routing",
  },
  "structure-follow": {
    noteMultiplier: 0.98,
    durationScale: 0.96,
    gainScale: 1,
    panBias: 0,
    descriptor: "structure-follow routing",
  },
  "layered-pack": {
    noteMultiplier: 1,
    durationScale: 1,
    gainScale: 1,
    panBias: 0,
    descriptor: "layered reusable routing",
  },
};

const PLAYABLE_AUDIO_EXTENSIONS = new Set([
  ".wav",
  ".mp3",
  ".flac",
  ".ogg",
  ".oga",
  ".aif",
  ".aiff",
]);

function fallbackCategoryProfile(categoryId: string): CategoryProfile {
  return CATEGORY_PROFILES[categoryId] ?? CATEGORY_PROFILES.collection;
}

function fallbackStrategyProfile(strategy: string): StrategyProfile {
  return STRATEGY_PROFILES[strategy] ?? STRATEGY_PROFILES["layered-pack"];
}

function clampPan(pan: number): number {
  return Math.max(-1, Math.min(1, pan));
}

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

function resolveSceneSampleSources(baseAsset: BaseAssetRecord | null): {
  sources: Array<{ path: string; label: string }>;
  mode: "single-sample" | "multi-sample" | "synth";
  detail: string;
} {
  if (!baseAsset) {
    return {
      sources: [],
      mode: "synth",
      detail: "No base asset selected, so live cues stay on internal synthesis.",
    };
  }

  if (baseAsset.storagePath.startsWith("browser-fallback://")) {
    return {
      sources: [],
      mode: "synth",
      detail:
        "Browser fallback cannot expose a managed on-disk sample, so live cues stay on internal synthesis.",
    };
  }

  if (baseAsset.sourceKind === "file" && isPlayableAudioPath(baseAsset.storagePath)) {
    return {
      sources: [{ path: baseAsset.storagePath, label: baseAsset.title }],
      mode: "single-sample",
      detail: "Live cues can trigger the managed base-asset file directly.",
    };
  }

  if (baseAsset.sourceKind === "directory") {
    const playableEntries = [
      ...metricPlayableAudioEntries(baseAsset),
      ...metricPreviewEntries(baseAsset),
    ].filter((entry, index, entries) => isPlayableAudioPath(entry) && entries.indexOf(entry) === index);

    if (playableEntries.length > 0) {
      const sources = playableEntries.slice(0, 4).map((entry) => ({
        path: joinManagedPath(baseAsset.storagePath, entry),
        label: entry,
      }));

      if (sources.length === 1) {
        return {
          sources,
          mode: "single-sample",
          detail:
            "Live cues use the only playable entry exposed by the managed base-asset folder.",
        };
      }

      return {
        sources,
        mode: "multi-sample",
        detail:
          "Live cues distribute across multiple playable entries from the managed base-asset folder.",
      };
    }
  }

  return {
    sources: [],
    mode: "synth",
    detail:
      "The selected base asset does not expose a playable managed audio file, so live cues stay on internal synthesis.",
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
    return sampleSources[0]
      ? { samplePath: sampleSources[0].path, sampleLabel: sampleSources[0].label }
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

export function resolveLiveSonificationScene(
  baseAsset: BaseAssetRecord | null,
  composition: CompositionResultRecord | null,
): ResolvedLiveSonificationScene {
  const categoryId =
    baseAsset?.categoryId ??
    composition?.baseAssetCategoryId ??
    "collection";
  const categoryLabel =
    baseAsset?.categoryLabel ??
    composition?.baseAssetCategoryLabel ??
    "Collection";
  const strategy = composition?.strategy ?? "layered-pack";
  const referenceTitle = composition?.referenceTitle ?? "Live log signal";
  const categoryProfile = fallbackCategoryProfile(categoryId);
  const strategyProfile = fallbackStrategyProfile(strategy);
  const renderPreview = composition ? resolveRenderPreview(composition) : null;
  const sampleSource = resolveSceneSampleSources(baseAsset);
  const sections = composition ? resolveArrangementSections(composition) : [];
  const cuePoints = composition ? resolveCuePoints(composition) : [];
  const foundationStem = renderPreview?.stems.find((stem) => stem.role === "foundation")
    ?? renderPreview?.stems[0];
  const supportStem = renderPreview?.stems.find((stem) => stem.role === "support")
    ?? renderPreview?.stems[1]
    ?? foundationStem;
  const glueStem = renderPreview?.stems.find((stem) => stem.role === "glue")
    ?? renderPreview?.stems[renderPreview.stems.length - 1]
    ?? supportStem
    ?? foundationStem;
  const spotlightStem = renderPreview?.stems.find((stem) => stem.role === "spotlight")
    ?? glueStem
    ?? foundationStem;
  const introSection = sections[0];
  const buildSection = sections[1] ?? introSection;
  const mainSection = sections[2] ?? buildSection ?? introSection;
  const outroSection = sections[3] ?? mainSection ?? buildSection ?? introSection;
  const introCue = cuePoints[0];
  const buildCue = cuePoints[1] ?? introCue;
  const mainCue = cuePoints[2] ?? buildCue ?? introCue;
  const outroCue = cuePoints[cuePoints.length - 1] ?? mainCue ?? buildCue ?? introCue;

  const routes: LiveSonificationRoute[] = ([
    {
      key: "info",
      label: "Steady pulse",
      stemLabel: foundationStem?.label ?? `${categoryLabel} foundation`,
      sectionLabel: introSection?.label ?? "Baseline window",
      cueLabel: introCue?.label ?? "Baseline cue",
      focus:
        foundationStem?.focus ??
        "Keep a continuous representation of nominal system activity in the background.",
      waveform: categoryProfile.baseWaveform,
      noteMultiplier: 0.96,
      durationScale: 1,
      gainScale: 0.92,
      pan: foundationStem?.pan ?? 0,
      samplePath: null,
      sampleLabel: null,
    },
    {
      key: "warn",
      label: "Tension rise",
      stemLabel: supportStem?.label ?? `${categoryLabel} motion`,
      sectionLabel: buildSection?.label ?? "Build window",
      cueLabel: buildCue?.label ?? "Build cue",
      focus:
        supportStem?.focus ??
        "Push warning pressure forward before the system crosses into a harder anomaly state.",
      waveform: categoryProfile.warnWaveform,
      noteMultiplier: 1.08,
      durationScale: 1.06,
      gainScale: 1.08,
      pan: supportStem?.pan ?? 0.08,
      samplePath: null,
      sampleLabel: null,
    },
    {
      key: "error",
      label: "Critical surge",
      stemLabel: spotlightStem?.label ?? `${categoryLabel} impact`,
      sectionLabel: mainSection?.label ?? "Impact window",
      cueLabel: mainCue?.label ?? "Impact cue",
      focus:
        spotlightStem?.focus ??
        "Make clear when the live stream shifts from pressure into a real failure state.",
      waveform: categoryProfile.errorWaveform,
      noteMultiplier: 1.22,
      durationScale: 0.96,
      gainScale: 1.16,
      pan: spotlightStem?.pan ?? 0,
      samplePath: null,
      sampleLabel: null,
    },
    {
      key: "anomaly",
      label: "Anomaly accent",
      stemLabel: glueStem?.label ?? `${categoryLabel} anomaly accent`,
      sectionLabel: outroSection?.label ?? "Accent window",
      cueLabel: outroCue?.label ?? "Accent cue",
      focus:
        glueStem?.focus ??
        "Mark bursts, exceptions, or drift spikes with a clearly distinct accent.",
      waveform: categoryProfile.anomalyWaveform,
      noteMultiplier: 1.38,
      durationScale: 0.84,
      gainScale: 1.24,
      pan: glueStem?.pan ?? 0.18,
      samplePath: null,
      sampleLabel: null,
    },
  ] satisfies LiveSonificationRoute[]).map((route) => ({
    ...route,
    pan: clampPan(route.pan + categoryProfile.panBias + strategyProfile.panBias),
    ...routeSampleAssignment(sampleSource.sources, route.key),
  }));

  const summary = composition
    ? `Live log windows route through ${categoryProfile.descriptor} with ${strategyProfile.descriptor}, using ${composition.title} as the structure overlay.`
    : `Live log windows route through ${categoryProfile.descriptor} using ${baseAsset?.title ?? categoryLabel} as the reusable timbral vocabulary.`;

  return {
    baseAsset,
    composition,
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
  };
}

export function routeCueThroughScene(
  cue: LiveLogCue,
  scene: ResolvedLiveSonificationScene,
  index: number,
): RoutedLiveCue {
  const routeKey = routeKeyForCue(cue);
  const route = scene.routes.find((candidate) => candidate.key === routeKey) ?? scene.routes[0];
  const categoryProfile = fallbackCategoryProfile(scene.categoryId);
  const strategyProfile = fallbackStrategyProfile(scene.strategy);
  const indexOffsetMultiplier = 1 + ((index % 3) - 1) * 0.015;
  const noteHz = cue.noteHz * categoryProfile.noteMultiplier * strategyProfile.noteMultiplier * route.noteMultiplier * indexOffsetMultiplier;
  const durationMs = cue.durationMs * categoryProfile.durationScale * strategyProfile.durationScale * route.durationScale;
  const gain = cue.gain * categoryProfile.gainScale * strategyProfile.gainScale * route.gainScale;

  return {
    ...cue,
    noteHz: Number(noteHz.toFixed(2)),
    durationMs: Math.max(90, Math.round(durationMs)),
    gain: Number(Math.min(0.34, Math.max(0.05, gain)).toFixed(3)),
    waveform: route.waveform,
    pan: route.pan,
    routeKey,
    routeLabel: route.label,
    stemLabel: route.stemLabel,
    sectionLabel: route.sectionLabel,
    focus: route.focus,
    samplePath: route.samplePath,
    sampleLabel: route.sampleLabel,
  };
}
