import type {
  CompositionReferenceType,
  CompositionResultRecord,
  ImportCompositionInput,
} from "../types/library";
import { getPlaylistMedianBpm } from "../utils/playlist";
import { listMockBaseAssets } from "./mockBaseAssets";
import { listMockPlaylists, listMockTracks } from "./mockLibrary";
import { listMockRepositories } from "./mockRepositories";

const STORAGE_KEY = "maia.library.compositions.v1";
let memoryStore: CompositionResultRecord[] = [];

function normalizeComposition(
  composition: CompositionResultRecord,
): CompositionResultRecord {
  return {
    ...composition,
    basePlaylistId: composition.basePlaylistId ?? null,
    basePlaylistName: composition.basePlaylistName ?? null,
    exportPath: composition.exportPath ?? null,
    previewAudioPath: composition.previewAudioPath ?? null,
  };
}

function readCompositions(): CompositionResultRecord[] {
  if (typeof window === "undefined") {
    return memoryStore.map(normalizeComposition);
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return (JSON.parse(raw) as CompositionResultRecord[]).map(normalizeComposition);
  } catch {
    return [];
  }
}

function writeCompositions(compositions: CompositionResultRecord[]): void {
  if (typeof window === "undefined") {
    memoryStore = compositions.map(normalizeComposition);
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(compositions.map(normalizeComposition)),
  );
}

function stableHash(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createWaveformBins(seed: number, length = 56): number[] {
  let state = seed || 1;

  return Array.from({ length }, (_, index) => {
    state = Math.imul(state ^ (state >>> 13), 1274126177) >>> 0;
    const raw = ((state >>> 8) & 0xff) / 255;
    const envelope =
      0.42 + Math.sin((index / Math.max(1, length - 1)) * Math.PI) * 0.58;

    return Number(Math.min(1, raw * envelope).toFixed(3));
  });
}

function createBeatGrid(targetBpm: number, durationSeconds: number) {
  if (targetBpm <= 0 || durationSeconds <= 0) {
    return [];
  }

  const beatPeriod = 60 / targetBpm;
  const beatCount = Math.max(1, Math.floor(durationSeconds / beatPeriod));

  return Array.from({ length: beatCount + 1 }, (_, index) => ({
    index,
    second: Number((index * beatPeriod).toFixed(3)),
  })).filter((beat) => beat.second <= durationSeconds);
}

function createBpmCurve(targetBpm: number, durationSeconds: number) {
  return [0, durationSeconds / 2, durationSeconds].map((second) => ({
    second: Number(second.toFixed(3)),
    bpm: Number(targetBpm.toFixed(3)),
  }));
}

function resolveStrategy(categoryId: string, referenceType: CompositionReferenceType): string {
  if (categoryId === "drum-kit") {
    return "rhythm-foundation";
  }
  if (categoryId === "bass-motif") {
    return "low-end-anchor";
  }
  if (categoryId === "pad-texture") {
    return "harmonic-bed";
  }
  if (categoryId === "fx-palette") {
    return "transition-accent";
  }
  if (categoryId === "vocal-hook") {
    return "hook-framing";
  }
  if (categoryId === "code-pattern") {
    return "pattern-translation";
  }
  return referenceType === "repo" ? "structure-follow" : "layered-pack";
}

function buildArrangementPlan(
  categoryLabel: string,
  referenceTitle: string,
  referenceType: CompositionReferenceType,
  reusable: boolean,
): string[] {
  const plan = [
    `Lock the base groove to ${referenceTitle} before layering.`,
    `Use the ${categoryLabel} material in a 16-bar preview section first.`,
  ];

  if (referenceType === "repo") {
    plan.push("Treat repository BPM as structural pacing instead of literal audio timing.");
  } else if (referenceType === "manual") {
    plan.push("Replace the manual tempo with a real track or playlist reference when one is available.");
  }

  if (!reusable) {
    plan.push("Keep the result as a local sketch because the base asset is reference-only.");
  }

  return plan;
}

function previewDurationSeconds(targetBpm: number): number {
  return Number(((16 * 4 * 60) / targetBpm).toFixed(3));
}

function arrangementSections(
  durationSeconds: number,
  targetBpm: number,
  categoryId: string,
  referenceType: CompositionReferenceType,
  strategy: string,
) {
  const secondsPerBar = (4 * 60) / targetBpm;
  const definitions = [
    { id: "intro", label: "Intro lock", energy: "low" },
    {
      id:
        categoryId === "fx-palette"
          ? "lift"
          : referenceType === "repo"
            ? "translation"
            : "build",
      label:
        categoryId === "pad-texture"
          ? "Texture rise"
          : categoryId === "vocal-hook"
            ? "Hook setup"
            : referenceType === "repo"
              ? "Structure translation"
              : "Energy build",
      energy: "rising",
    },
    {
      id:
        strategy === "pattern-translation"
          ? "pattern"
          : categoryId === "vocal-hook"
            ? "hook"
            : "drop",
      label:
        strategy === "pattern-translation"
          ? "Pattern reveal"
          : categoryId === "bass-motif"
            ? "Low-end focus"
            : categoryId === "vocal-hook"
              ? "Hook release"
              : "Main section",
      energy: "high",
    },
    { id: "outro", label: "Transition out", energy: "medium" },
  ] as const;

  return definitions.map((definition, index) => {
    const startBar = index * 4 + 1;
    const endBar = startBar + 3;
    return {
      id: definition.id,
      role: definition.id,
      label: definition.label,
      energy: definition.energy,
      startBar,
      endBar,
      startSecond: Number(((startBar - 1) * secondsPerBar).toFixed(3)),
      endSecond: Number(Math.min(durationSeconds, endBar * secondsPerBar).toFixed(3)),
      focus:
        definition.id === "intro"
          ? "tempo lock and phrase alignment"
          : definition.id === "outro"
            ? "set up the next transition or render pass"
            : definition.id === "translation"
              ? "translate structural pacing into musical tension"
              : definition.id === "lift"
                ? "stack transitions without crowding the groove"
                : definition.id === "pattern"
                  ? "surface the reusable pattern in its clearest form"
                  : definition.id === "hook"
                    ? "land the hook after the groove is fully established"
                    : definition.id === "drop" && categoryId === "bass-motif"
                      ? "anchor the low-end transient and keep the kick clear"
                      : "present the strongest layer combination",
    };
  });
}

function cuePoints(
  sections: Array<{
    id: string;
    role: string;
    label: string;
    startBar: number;
    endBar: number;
    startSecond: number;
    endSecond: number;
  }>,
) {
  return [
    ...sections.map((section) => ({
      id: `cue-${section.id}`,
      label: section.label,
      role: section.role,
      bar: section.startBar,
      second: section.startSecond,
    })),
    {
      id: "cue-end",
      label: "Preview end",
      role: "end",
      bar: sections[sections.length - 1]?.endBar ?? 17,
      second: sections[sections.length - 1]?.endSecond ?? 0,
    },
  ];
}

function renderPreview(
  sections: Array<{
    id: string;
    role: string;
    startBar: number;
    endBar: number;
  }>,
  categoryId: string,
  referenceType: CompositionReferenceType,
  strategy: string,
) {
  const mainSections = sections.filter((section) => section.role !== "outro");
  const peakSection = sections[2]?.id ?? "drop";
  const stems = [
    {
      id: "stem-foundation",
      label:
        categoryId === "drum-kit"
          ? "Rhythm foundation"
          : categoryId === "code-pattern"
            ? "Pattern foundation"
            : "Base foundation",
      role: "foundation",
      source: "base-asset",
      focus: "carry the groove and preserve the reusable source identity",
      gainDb: -6.5,
      pan: 0,
      sectionIds: sections.map((section) => section.id),
    },
    {
      id: "stem-motion",
      label:
        categoryId === "fx-palette"
          ? "Transition motion"
          : categoryId === "pad-texture"
            ? "Texture motion"
            : "Energy motion",
      role: "support",
      source: "base-asset",
      focus: "increase motion through the middle sections without masking the foundation",
      gainDb: -9,
      pan: categoryId === "pad-texture" ? -0.18 : 0.12,
      sectionIds: mainSections.map((section) => section.id),
    },
    {
      id: "stem-reference-glue",
      label:
        referenceType === "repo"
          ? "Structural glue"
          : referenceType === "track" || referenceType === "playlist"
            ? "Base groove glue"
            : "Tempo guide glue",
      role: "glue",
      source: referenceType === "manual" ? "manual" : "reference",
      focus:
        referenceType === "repo"
          ? "translate structure pacing into arrangement density"
          : referenceType === "track" || referenceType === "playlist"
            ? "keep section changes aligned with the base groove"
            : "stabilize the typed tempo through each section boundary",
      gainDb: -11,
      pan: 0,
      sectionIds: [sections[1]?.id ?? "build", peakSection],
    },
  ];

  if (categoryId === "vocal-hook" || categoryId === "bass-motif") {
    stems.push({
      id: "stem-spotlight",
      label: categoryId === "vocal-hook" ? "Hook spotlight" : "Low-end spotlight",
      role: "spotlight",
      source: "base-asset",
      focus:
        categoryId === "vocal-hook"
          ? "reserve space for the hook entry at the main section"
          : "push the bass motif forward without collapsing headroom",
      gainDb: -7.5,
      pan: categoryId === "vocal-hook" ? 0.08 : 0,
      sectionIds: [peakSection],
    });
  }

  return {
    mode: "deterministic-stem-preview",
    headroomDb: categoryId === "fx-palette" ? -7.5 : -6,
    masterChain: [
      "sub cleanup",
      referenceType === "repo" ? "structural glue compression" : "glue compression",
      categoryId === "fx-palette" ? "transition tame limiter" : "soft clip guard",
    ],
    exportTargets: ["preview-loop", "stem-balance-pass", "arrangement-audit"],
    stems,
    automation: [
      {
        id: "auto-build-rise",
        target: "stem-motion",
        move: categoryId === "fx-palette" ? "riser emphasis" : "filter open",
        sectionId: sections[1]?.id ?? "build",
        startBar: sections[1]?.startBar ?? 5,
        endBar: sections[1]?.endBar ?? 8,
      },
      {
        id: "auto-main-impact",
        target: "stem-foundation",
        move: strategy === "pattern-translation" ? "pattern spotlight" : "transient lift",
        sectionId: peakSection,
        startBar: sections[2]?.startBar ?? 9,
        endBar: sections[2]?.endBar ?? 12,
      },
      {
        id: "auto-outro-clear",
        target: "master",
        move: "headroom release",
        sectionId: sections[3]?.id ?? "outro",
        startBar: sections[3]?.startBar ?? 13,
        endBar: sections[3]?.endBar ?? 16,
      },
    ],
  };
}

async function resolveReference(
  input: ImportCompositionInput,
): Promise<{
  basePlaylistId: string | null;
  basePlaylistName: string | null;
  referenceAssetId: string | null;
  referenceTitle: string;
  referenceSourcePath: string | null;
  targetBpm: number;
}> {
  const [tracks, playlists] = await Promise.all([
    listMockTracks(),
    listMockPlaylists(),
  ]);

  let basePlaylistId: string | null = null;
  let basePlaylistName: string | null = null;
  let baseReferenceAssetId: string | null = null;
  let baseReferenceTitle: string | null = null;
  let baseReferenceSourcePath: string | null = null;
  let baseBpm: number | null = null;

  if (input.playlistId) {
    const playlist = playlists.find((entry) => entry.id === input.playlistId);
    if (!playlist) {
      throw new Error("Select a saved playlist before composing.");
    }

    const playlistBpm = getPlaylistMedianBpm(playlist, tracks);
    if (typeof playlistBpm !== "number") {
      throw new Error(
        "Select a playlist with at least one analyzed BPM before composing.",
      );
    }

    basePlaylistId = playlist.id;
    basePlaylistName = playlist.name;
    baseReferenceAssetId = playlist.id;
    baseReferenceTitle = playlist.name;
    baseReferenceSourcePath = null;
    baseBpm = playlistBpm;
  } else if (input.trackId) {
    const track = tracks.find((entry) => entry.id === input.trackId);
    if (!track || typeof track.analysis.bpm !== "number") {
      throw new Error("Select a track with stored BPM before composing.");
    }

    baseReferenceAssetId = track.id;
    baseReferenceTitle = track.tags.title;
    baseReferenceSourcePath = track.file.sourcePath;
    baseBpm = track.analysis.bpm;
  }

  if (input.structureId || input.referenceType === "repo") {
    const repositories = await listMockRepositories();
    const repository = repositories.find(
      (entry) => entry.id === (input.structureId ?? input.referenceAssetId),
    );
    if (!repository) {
      throw new Error("Select a repository with suggested BPM before composing.");
    }

    return {
      basePlaylistId,
      basePlaylistName,
      referenceAssetId: repository.id,
      referenceTitle: baseReferenceTitle
        ? `${baseReferenceTitle} (structured by ${repository.title})`
        : repository.title,
      referenceSourcePath: repository.sourcePath,
      targetBpm: repository.suggestedBpm ?? baseBpm ?? repository.suggestedBpm ?? 124,
    };
  }

  if (baseReferenceTitle && typeof baseBpm === "number") {
    return {
      basePlaylistId,
      basePlaylistName,
      referenceAssetId: baseReferenceAssetId,
      referenceTitle: baseReferenceTitle,
      referenceSourcePath: baseReferenceSourcePath,
      targetBpm: baseBpm,
    };
  }

  if (typeof input.manualBpm !== "number" || input.manualBpm <= 0) {
    throw new Error("Manual composition mode requires a positive BPM.");
  }

  return {
    basePlaylistId: null,
    basePlaylistName: null,
    referenceAssetId: null,
    referenceTitle: `Manual ${input.manualBpm.toFixed(0)} BPM`,
    referenceSourcePath: null,
    targetBpm: input.manualBpm,
  };
}

async function createComposition(
  input: ImportCompositionInput,
): Promise<CompositionResultRecord> {
  const baseAssets = await listMockBaseAssets();
  const baseAsset = baseAssets.find((entry) => entry.id === input.baseAssetId);
  if (!baseAsset) {
    throw new Error("Select a base asset before composing.");
  }

  const reference = await resolveReference(input);
  const seed = stableHash(
    [
      baseAsset.id,
      input.referenceType,
      reference.referenceTitle,
      reference.targetBpm.toFixed(3),
      input.label?.trim() ?? "",
    ].join(":"),
  );
  const targetBpm = Number(reference.targetBpm.toFixed(3));
  const durationSeconds = previewDurationSeconds(targetBpm);
  const strategy = resolveStrategy(baseAsset.categoryId, input.referenceType);
  const arrangementPlan = buildArrangementPlan(
    baseAsset.categoryLabel,
    reference.referenceTitle,
    input.referenceType,
    baseAsset.reusable,
  );
  const sections = arrangementSections(
    durationSeconds,
    targetBpm,
    baseAsset.categoryId,
    input.referenceType,
    strategy,
  );
  const title =
    input.label?.trim() || `${baseAsset.title} x ${reference.referenceTitle}`;
  const compositionId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `composition-${Date.now()}-${seed}`;
  const exportPath = `browser-fallback://compositions/${compositionId}/plan.json`;
  const previewAudioPath = `browser-fallback://compositions/${compositionId}/preview.wav`;

  return {
    id: compositionId,
    title,
    sourcePath: baseAsset.sourcePath,
    exportPath,
    previewAudioPath,
    sourceKind: baseAsset.sourceKind,
    importedAt: new Date().toISOString(),
    baseAssetId: baseAsset.id,
    baseAssetTitle: baseAsset.title,
    baseAssetCategoryId: baseAsset.categoryId,
    baseAssetCategoryLabel: baseAsset.categoryLabel,
    basePlaylistId: reference.basePlaylistId,
    basePlaylistName: reference.basePlaylistName,
    referenceType: input.referenceType,
    referenceAssetId: reference.referenceAssetId,
    referenceTitle: reference.referenceTitle,
    referenceSourcePath: reference.referenceSourcePath,
    targetBpm,
    confidence: Number((0.58 + (seed % 22) / 100).toFixed(2)),
    strategy,
    summary: `Composition plan prepared for ${baseAsset.title} using ${reference.referenceTitle} at ${targetBpm.toFixed(0)} BPM with ${strategy} strategy.`,
    analyzerStatus:
      input.referenceType === "track"
        ? "Track-referenced composition plan"
        : input.referenceType === "playlist"
          ? "Playlist-referenced composition plan"
        : input.referenceType === "repo"
          ? "Repository-referenced composition plan"
          : "Manual-tempo composition plan",
    notes: [
      "Browser fallback is active because Tauri is unavailable.",
      `Built from base asset ${baseAsset.title} (${baseAsset.categoryLabel}) at ${targetBpm.toFixed(0)} BPM.`,
      `Reference type is ${input.referenceType} using ${reference.referenceTitle}.`,
      ...(reference.basePlaylistName
        ? [`Base playlist is ${reference.basePlaylistName}.`]
        : []),
      `Composition plan snapshot is simulated at ${exportPath}.`,
      `Preview audio path is simulated at ${previewAudioPath}.`,
      ...(!baseAsset.reusable
        ? ["The selected base asset is reference-only, so the composition remains a local sketch."]
        : []),
    ],
    tags: [
      "composition-result",
      `category:${baseAsset.categoryId}`,
      `reference:${input.referenceType}`,
      `strategy:${strategy}`,
      ...(baseAsset.reusable ? ["reusable-base"] : []),
    ],
    metrics: {
      analysisMode: "composition-planner",
      baseAssetCategory: baseAsset.categoryId,
      baseAssetSourceKind: baseAsset.sourceKind,
      baseAssetReusable: baseAsset.reusable,
      baseAssetEntryCount: baseAsset.entryCount,
      basePlaylistId: reference.basePlaylistId,
      basePlaylistName: reference.basePlaylistName,
      referenceType: input.referenceType,
      referenceLabel: reference.referenceTitle,
      referenceBpm: targetBpm,
      targetBpm,
      strategy,
      managedPlanPath: exportPath,
      storageMode: "browser-fallback",
      intensityBand:
        targetBpm >= 132 ? "peak-time" : targetBpm <= 108 ? "warmup" : "steady",
      previewDurationSeconds: durationSeconds,
      recommendedBars: 16,
      recommendedLayerCount: Math.min(
        8,
        Math.max(2, 1 + Math.floor(baseAsset.entryCount / 4)),
      ),
      arrangementPlan,
      arrangementSections: sections,
      cuePoints: cuePoints(sections),
      renderPreview: renderPreview(
        sections,
        baseAsset.categoryId,
        input.referenceType,
        strategy,
      ),
      previewAudioPath,
      previewAudioFormat: "wav",
      previewAudioSampleRateHz: 22050,
      previewAudioDurationSeconds: durationSeconds,
    },
    waveformBins: createWaveformBins(seed),
    beatGrid: createBeatGrid(targetBpm, durationSeconds),
    bpmCurve: createBpmCurve(targetBpm, durationSeconds),
  };
}

export async function listMockCompositionResults(): Promise<CompositionResultRecord[]> {
  return readCompositions().sort((left, right) =>
    right.importedAt.localeCompare(left.importedAt),
  );
}

export async function importMockCompositionResult(
  input: ImportCompositionInput,
): Promise<CompositionResultRecord> {
  const nextComposition = await createComposition(input);
  const nextCompositions = [nextComposition, ...readCompositions()];
  writeCompositions(nextCompositions);
  return nextComposition;
}
