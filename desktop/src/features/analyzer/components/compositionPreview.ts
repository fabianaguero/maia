import type { CompositionResultRecord } from "../../../types/library";

export interface ArrangementSection {
  id: string;
  role: string;
  label: string;
  energy: string;
  startBar: number;
  endBar: number;
  startSecond: number;
  endSecond: number;
  focus: string;
}

export interface CuePoint {
  id: string;
  label: string;
  role: string;
  bar: number;
  second: number;
}

export interface RenderStem {
  id: string;
  label: string;
  role: string;
  source: string;
  focus: string;
  gainDb: number;
  pan: number;
  sectionIds: string[];
}

export interface RenderAutomationMove {
  id: string;
  target: string;
  move: string;
  sectionId: string;
  startBar: number;
  endBar: number;
}

export interface RenderPreview {
  mode: string;
  headroomDb: number;
  masterChain: string[];
  exportTargets: string[];
  stems: RenderStem[];
  automation: RenderAutomationMove[];
}

export function numberField(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function resolvedCategoryId(composition: CompositionResultRecord): string {
  return (
    stringField(composition.metrics.baseAssetCategory) ?? composition.baseAssetCategoryId
  );
}

function previewDurationSeconds(composition: CompositionResultRecord): number {
  return (
    numberField(composition.metrics.previewDurationSeconds) ??
    Number(((16 * 4 * 60) / composition.targetBpm).toFixed(3))
  );
}

function derivedSections(composition: CompositionResultRecord): ArrangementSection[] {
  const previewDuration = previewDurationSeconds(composition);
  const secondsPerBar = (4 * 60) / composition.targetBpm;
  const categoryId = resolvedCategoryId(composition);
  const referenceType = composition.referenceType;
  const strategy = composition.strategy;
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
      endSecond: Number(Math.min(previewDuration, endBar * secondsPerBar).toFixed(3)),
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

function readSections(metrics: Record<string, unknown>): ArrangementSection[] {
  const raw = metrics.arrangementSections;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const startBar = numberField(record.startBar);
      const endBar = numberField(record.endBar);
      const startSecond = numberField(record.startSecond);
      const endSecond = numberField(record.endSecond);
      const label = stringField(record.label);

      if (
        startBar === null ||
        endBar === null ||
        startSecond === null ||
        endSecond === null ||
        label === null
      ) {
        return null;
      }

      return {
        id: stringField(record.id) ?? `section-${index}`,
        role: stringField(record.role) ?? "section",
        label,
        energy: stringField(record.energy) ?? "steady",
        startBar,
        endBar,
        startSecond,
        endSecond,
        focus: stringField(record.focus) ?? "Phrase guidance",
      };
    })
    .filter((entry): entry is ArrangementSection => entry !== null);
}

function derivedCuePoints(sections: ArrangementSection[]): CuePoint[] {
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
      bar: (sections[sections.length - 1]?.endBar ?? 16) + 1,
      second: sections[sections.length - 1]?.endSecond ?? 0,
    },
  ];
}

function readCuePoints(metrics: Record<string, unknown>): CuePoint[] {
  const raw = metrics.cuePoints;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const label = stringField(record.label);
      const bar = numberField(record.bar);
      const second = numberField(record.second);

      if (label === null || bar === null || second === null) {
        return null;
      }

      return {
        id: stringField(record.id) ?? `cue-${index}`,
        label,
        role: stringField(record.role) ?? "cue",
        bar,
        second,
      };
    })
    .filter((entry): entry is CuePoint => entry !== null);
}

function derivedRenderPreview(composition: CompositionResultRecord): RenderPreview {
  const categoryId = resolvedCategoryId(composition);
  const referenceType = composition.referenceType;
  const strategy = composition.strategy;
  const sections = resolveArrangementSections(composition);
  const mainSections = sections.filter((section) => section.role !== "outro");
  const peakSection = sections[2]?.id ?? "drop";

  const stems: RenderStem[] = [
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

function readRenderPreview(metrics: Record<string, unknown>): RenderPreview | null {
  const raw = metrics.renderPreview;
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const stemsRaw = Array.isArray(record.stems) ? record.stems : [];
  const automationRaw = Array.isArray(record.automation) ? record.automation : [];
  const masterChainRaw = Array.isArray(record.masterChain) ? record.masterChain : [];
  const exportTargetsRaw = Array.isArray(record.exportTargets) ? record.exportTargets : [];

  const stems = stemsRaw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const stem = entry as Record<string, unknown>;
      const label = stringField(stem.label);
      const gainDb = numberField(stem.gainDb);
      const pan = numberField(stem.pan);
      const sectionIds = Array.isArray(stem.sectionIds)
        ? stem.sectionIds.filter((sectionId): sectionId is string => typeof sectionId === "string")
        : [];

      if (label === null || gainDb === null || pan === null) {
        return null;
      }

      return {
        id: stringField(stem.id) ?? `stem-${index}`,
        label,
        role: stringField(stem.role) ?? "stem",
        source: stringField(stem.source) ?? "base-asset",
        focus: stringField(stem.focus) ?? "Render preview stem",
        gainDb,
        pan,
        sectionIds,
      };
    })
    .filter((entry): entry is RenderStem => entry !== null);

  const automation = automationRaw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const move = entry as Record<string, unknown>;
      const target = stringField(move.target);
      const action = stringField(move.move);
      const sectionId = stringField(move.sectionId);
      const startBar = numberField(move.startBar);
      const endBar = numberField(move.endBar);

      if (
        target === null ||
        action === null ||
        sectionId === null ||
        startBar === null ||
        endBar === null
      ) {
        return null;
      }

      return {
        id: stringField(move.id) ?? `automation-${index}`,
        target,
        move: action,
        sectionId,
        startBar,
        endBar,
      };
    })
    .filter((entry): entry is RenderAutomationMove => entry !== null);

  if (stems.length === 0) {
    return null;
  }

  return {
    mode: stringField(record.mode) ?? "deterministic-stem-preview",
    headroomDb: numberField(record.headroomDb) ?? -6,
    masterChain: masterChainRaw.filter((item): item is string => typeof item === "string"),
    exportTargets: exportTargetsRaw.filter((item): item is string => typeof item === "string"),
    stems,
    automation,
  };
}

export function resolveArrangementSections(
  composition: CompositionResultRecord,
): ArrangementSection[] {
  return readSections(composition.metrics).length > 0
    ? readSections(composition.metrics)
    : derivedSections(composition);
}

export function resolveCuePoints(composition: CompositionResultRecord): CuePoint[] {
  return readCuePoints(composition.metrics).length > 0
    ? readCuePoints(composition.metrics)
    : derivedCuePoints(resolveArrangementSections(composition));
}

export function resolveRenderPreview(
  composition: CompositionResultRecord,
): RenderPreview {
  return readRenderPreview(composition.metrics) ?? derivedRenderPreview(composition);
}
