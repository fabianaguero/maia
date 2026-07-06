import { describe, expect, it } from "vitest";

import type { CompositionResultRecord } from "../../../../src/types/library";
import {
  numberField,
  resolveArrangementSections,
  resolveCuePoints,
  resolveRenderPreview,
  stringField,
} from "../../../../src/features/analyzer/components/compositionPreview";

function createComposition(
  overrides: Partial<CompositionResultRecord> = {},
  metrics: Record<string, unknown> = {},
): CompositionResultRecord {
  return {
    id: "composition-1",
    title: "Preview composition",
    sourcePath: "/exports/preview.plan.json",
    exportPath: null,
    previewAudioPath: null,
    sourceKind: "generated",
    importedAt: "2026-06-30T12:00:00.000Z",
    baseAssetId: "asset-1",
    baseAssetTitle: "Foundation asset",
    baseAssetCategoryId: "pad-texture",
    baseAssetCategoryLabel: "Pad texture",
    basePlaylistId: null,
    basePlaylistName: null,
    referenceType: "repo",
    referenceAssetId: "repo-1",
    referenceTitle: "Observability repo",
    referenceSourcePath: "/repos/observability",
    targetBpm: 128,
    confidence: 0.92,
    strategy: "pattern-translation",
    summary: "Layered preview",
    analyzerStatus: "ready",
    notes: [],
    tags: [],
    metrics,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    ...overrides,
  };
}

describe("compositionPreview runtime", () => {
  it("normalizes primitive helper fields", () => {
    expect(numberField(42)).toBe(42);
    expect(numberField(Number.NaN)).toBeNull();
    expect(numberField("42")).toBeNull();

    expect(stringField(" Groove ")).toBe(" Groove ");
    expect(stringField("")).toBeNull();
    expect(stringField("   ")).toBeNull();
    expect(stringField(42)).toBeNull();
  });

  it("reads persisted arrangement sections and cue points while filtering invalid entries", () => {
    const composition = createComposition(
      {},
      {
        arrangementSections: [
          {
            label: "Opening",
            startBar: 1,
            endBar: 4,
            startSecond: 0,
            endSecond: 7.5,
          },
          {
            id: "hook",
            role: "drop",
            label: "Hook section",
            energy: "high",
            startBar: 9,
            endBar: 12,
            startSecond: 15,
            endSecond: 22.5,
            focus: "land the hook",
          },
          {
            id: "bad-entry",
            label: "Broken",
            startBar: "x",
          },
        ],
        cuePoints: [
          {
            label: "Lift",
            bar: 5,
            second: 7.5,
          },
          {
            id: "cue-hook",
            role: "drop",
            label: "Hook",
            bar: 9,
            second: 15,
          },
          {
            id: "bad-cue",
            label: null,
            bar: 12,
            second: 24,
          },
        ],
      },
    );

    const sections = resolveArrangementSections(composition);
    expect(sections).toEqual([
      {
        id: "section-0",
        role: "section",
        label: "Opening",
        energy: "steady",
        startBar: 1,
        endBar: 4,
        startSecond: 0,
        endSecond: 7.5,
        focus: "Phrase guidance",
      },
      {
        id: "hook",
        role: "drop",
        label: "Hook section",
        energy: "high",
        startBar: 9,
        endBar: 12,
        startSecond: 15,
        endSecond: 22.5,
        focus: "land the hook",
      },
    ]);

    expect(resolveCuePoints(composition)).toEqual([
      {
        id: "cue-0",
        label: "Lift",
        role: "cue",
        bar: 5,
        second: 7.5,
      },
      {
        id: "cue-hook",
        label: "Hook",
        role: "drop",
        bar: 9,
        second: 15,
      },
    ]);
  });

  it("derives arrangement sections and cue points from category, reference type, and strategy", () => {
    const composition = createComposition({
      baseAssetCategoryId: "bass-motif",
      referenceType: "repo",
      strategy: "pattern-translation",
      targetBpm: 120,
    });

    const sections = resolveArrangementSections(composition);
    expect(sections.map((section) => section.id)).toEqual([
      "intro",
      "translation",
      "pattern",
      "outro",
    ]);
    expect(sections[1]?.label).toBe("Structure translation");
    expect(sections[2]?.focus).toBe("surface the reusable pattern in its clearest form");
    expect(sections[3]?.endSecond).toBe(32);

    expect(resolveCuePoints(composition)).toEqual([
      { id: "cue-intro", label: "Intro lock", role: "intro", bar: 1, second: 0 },
      {
        id: "cue-translation",
        label: "Structure translation",
        role: "translation",
        bar: 5,
        second: 8,
      },
      {
        id: "cue-pattern",
        label: "Pattern reveal",
        role: "pattern",
        bar: 9,
        second: 16,
      },
      {
        id: "cue-outro",
        label: "Transition out",
        role: "outro",
        bar: 13,
        second: 24,
      },
      { id: "cue-end", label: "Preview end", role: "end", bar: 17, second: 32 },
    ]);
  });

  it("reads persisted render previews and sanitizes invalid nested entries", () => {
    const composition = createComposition(
      {},
      {
        renderPreview: {
          mode: "",
          headroomDb: -7.5,
          masterChain: ["bus comp", 42, "soft clip"],
          exportTargets: ["preview-loop", null, "arrangement-audit"],
          stems: [
            {
              label: "Foundation stem",
              gainDb: -6,
              pan: 0.1,
              sectionIds: ["intro", 42, "drop"],
            },
            {
              id: "stem-2",
              role: "glue",
              source: "reference",
              focus: "Glue the groove",
              label: "Reference glue",
              gainDb: -10,
              pan: 0,
              sectionIds: ["build"],
            },
            {
              label: "Broken stem",
              gainDb: "x",
              pan: 0,
            },
          ],
          automation: [
            {
              target: "stem-motion",
              move: "filter open",
              sectionId: "build",
              startBar: 5,
              endBar: 8,
            },
            {
              id: "automation-2",
              target: "master",
              move: "release",
              sectionId: "outro",
              startBar: 13,
              endBar: 16,
            },
            {
              target: "broken",
              move: null,
              sectionId: "drop",
              startBar: 9,
              endBar: 12,
            },
          ],
        },
      },
    );

    expect(resolveRenderPreview(composition)).toEqual({
      mode: "deterministic-stem-preview",
      headroomDb: -7.5,
      masterChain: ["bus comp", "soft clip"],
      exportTargets: ["preview-loop", "arrangement-audit"],
      stems: [
        {
          id: "stem-0",
          label: "Foundation stem",
          role: "stem",
          source: "base-asset",
          focus: "Render preview stem",
          gainDb: -6,
          pan: 0.1,
          sectionIds: ["intro", "drop"],
        },
        {
          id: "stem-2",
          label: "Reference glue",
          role: "glue",
          source: "reference",
          focus: "Glue the groove",
          gainDb: -10,
          pan: 0,
          sectionIds: ["build"],
        },
      ],
      automation: [
        {
          id: "automation-0",
          target: "stem-motion",
          move: "filter open",
          sectionId: "build",
          startBar: 5,
          endBar: 8,
        },
        {
          id: "automation-2",
          target: "master",
          move: "release",
          sectionId: "outro",
          startBar: 13,
          endBar: 16,
        },
      ],
    });
  });

  it("falls back to derived render previews for invalid or missing stem payloads and adapts by category", () => {
    const invalidPersisted = createComposition(
      {
        baseAssetCategoryId: "vocal-hook",
        referenceType: "track",
        strategy: "direct-arrangement",
      },
      {
        renderPreview: {
          stems: [{ label: "Broken", gainDb: null, pan: 0 }],
        },
      },
    );

    const derivedFromInvalid = resolveRenderPreview(invalidPersisted);
    expect(derivedFromInvalid.mode).toBe("deterministic-stem-preview");
    expect(derivedFromInvalid.stems.map((stem) => stem.id)).toEqual([
      "stem-foundation",
      "stem-motion",
      "stem-reference-glue",
      "stem-spotlight",
    ]);
    expect(derivedFromInvalid.stems[1]?.label).toBe("Energy motion");
    expect(derivedFromInvalid.stems[2]).toMatchObject({
      label: "Base groove glue",
      source: "reference",
    });
    expect(derivedFromInvalid.stems[3]).toMatchObject({
      label: "Hook spotlight",
      pan: 0.08,
      sectionIds: ["hook"],
    });

    const fxPalette = createComposition(
      {
        baseAssetCategoryId: "fx-palette",
        referenceType: "manual",
        targetBpm: 100,
      },
      {},
    );

    const fxPreview = resolveRenderPreview(fxPalette);
    expect(fxPreview.headroomDb).toBe(-7.5);
    expect(fxPreview.masterChain).toContain("transition tame limiter");
    expect(fxPreview.stems[1]).toMatchObject({
      label: "Transition motion",
    });
    expect(fxPreview.automation[0]).toMatchObject({
      move: "riser emphasis",
      sectionId: "lift",
    });
    expect(fxPreview.stems[2]).toMatchObject({
      label: "Tempo guide glue",
      source: "manual",
    });
  });
});
