import { describe, expect, it } from "vitest";

import { buildLiveSonificationRoutes } from "../../../../src/features/analyzer/components/liveSonificationRouteRuntime";

describe("liveSonificationRouteRuntime", () => {
  it("builds four routed lanes with sample assignment and pan bias applied", () => {
    const routes = buildLiveSonificationRoutes({
      genreId: "house",
      categoryId: "fx-palette",
      categoryLabel: "FX Palette",
      strategy: "transition-accent",
      sections: [
        { label: "Intro window" },
        { label: "Build window" },
        { label: "Impact window" },
      ] as never,
      cuePoints: [{ label: "Cue A" }, { label: "Cue B" }, { label: "Cue C" }] as never,
      renderPreview: {
        stems: [
          { role: "foundation", label: "Foundation", pan: -0.1, focus: "steady" },
          { role: "support", label: "Support", pan: 0.05, focus: "build" },
          { role: "glue", label: "Glue", pan: 0.12, focus: "accent" },
          { role: "spotlight", label: "Spotlight", pan: -0.02, focus: "impact" },
        ],
      } as never,
      sampleSources: [
        { path: "/kit/info.wav", label: "info" },
        { path: "/kit/warn.wav", label: "warn" },
        { path: "/kit/error.wav", label: "error" },
        { path: "/kit/anomaly.wav", label: "anomaly" },
      ],
    });

    expect(routes).toHaveLength(4);
    expect(routes.map((route) => route.key)).toEqual(["info", "warn", "error", "anomaly"]);
    expect(routes[0]).toMatchObject({
      stemLabel: "Foundation",
      sectionLabel: "Intro window",
      cueLabel: "Cue A",
      samplePath: "/kit/info.wav",
      sampleLabel: "info",
    });
    expect(routes[1]!.samplePath).toBe("/kit/warn.wav");
    expect(routes[2]!.samplePath).toBe("/kit/error.wav");
    expect(routes[3]!.samplePath).toBe("/kit/anomaly.wav");
    expect(routes[0]!.pan).not.toBe(-0.1);
  });

  it("falls back to default labels when sections, cues or stems are missing", () => {
    const routes = buildLiveSonificationRoutes({
      genreId: "techno",
      categoryId: "collection",
      categoryLabel: "Collection",
      strategy: "layered-pack",
      sections: [],
      cuePoints: [],
      renderPreview: null,
      sampleSources: [],
    });

    expect(routes[0]).toMatchObject({
      stemLabel: "Collection foundation",
      sectionLabel: "Baseline window",
      cueLabel: "Baseline cue",
      samplePath: null,
      sampleLabel: null,
    });
    expect(routes[3]!.sectionLabel).toBe("Accent window");
    expect(routes[3]!.cueLabel).toBe("Accent cue");
  });
});
