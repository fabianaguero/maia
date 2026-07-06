import type { CompositionResultRecord } from "../../../types/library";
import { numberField, stringField } from "./compositionPreviewFieldsRuntime";
import type { ArrangementSection, CuePoint } from "./compositionPreviewTypes";

export function resolveCompositionPreviewCategoryId(composition: CompositionResultRecord): string {
  return stringField(composition.metrics.baseAssetCategory) ?? composition.baseAssetCategoryId;
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
  const categoryId = resolveCompositionPreviewCategoryId(composition);
  const referenceType = composition.referenceType;
  const strategy = composition.strategy;
  const definitions = [
    { id: "intro", label: "Intro lock", energy: "low" },
    {
      id: categoryId === "fx-palette" ? "lift" : referenceType === "repo" ? "translation" : "build",
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
