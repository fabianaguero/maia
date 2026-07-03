import { describe, expect, it } from "vitest";

import {
  clampPan,
  fallbackCategoryProfile,
  fallbackGenreProfile,
  fallbackSequencerPreset,
  fallbackStrategyProfile,
  hasGenreProfile,
  resolveComponentRoute,
  resolveGenreId,
  withMutationPreset,
} from "../../../../src/features/analyzer/components/liveSonificationSceneProfiles";

describe("liveSonificationSceneProfiles", () => {
  it("falls back to balanced and scales a preset through the mutation profile", () => {
    const preset = fallbackSequencerPreset("missing-preset");
    const mutated = withMutationPreset(preset, {
      id: "mutation",
      label: "Mutation",
      description: "test",
      cueDensityMultiplier: 0.5,
      cueSpacingMultiplier: 0.25,
      routeGainMultiplier: 1.1,
      anomalyBoostMultiplier: 1.25,
    });

    expect(preset.label).toBe("Balanced");
    expect(mutated.maxCuesPerWindow).toBe(4);
    expect(mutated.scheduleGapMs).toBe(32);
    expect(mutated.infoGainMultiplier).toBe(1.1);
    expect(mutated.anomalyGainMultiplier).toBe(1.38);
  });

  it("resolves component spread and clamps pan values", () => {
    expect(resolveComponentRoute("api", ["db", "api", "queue"])).toEqual({
      component: "api",
      pan: -0.36,
      noteMultiplier: 0.96,
    });
    expect(resolveComponentRoute("missing", ["db", "api"])).toEqual({
      component: "missing",
      pan: 0,
      noteMultiplier: 1,
    });
    expect(clampPan(-4)).toBe(-1);
    expect(clampPan(4)).toBe(1);
  });

  it("falls back to default genre/category/strategy profiles and honors anchor genre overrides", () => {
    expect(hasGenreProfile("house")).toBe(true);
    expect(hasGenreProfile("unknown-genre")).toBe(false);
    expect(fallbackGenreProfile("unknown-genre").label).toBe("House");
    expect(fallbackCategoryProfile("unknown-category").descriptor).toBe(
      "balanced reusable collection",
    );
    expect(fallbackStrategyProfile("unknown-strategy").descriptor).toBe("layered reusable routing");
    expect(
      resolveGenreId("techno", {
        trackId: "t-1",
        trackTitle: "Anchor",
        musicStyleId: "trance",
      }),
    ).toBe("trance");
    expect(
      resolveGenreId("techno", {
        trackId: "t-1",
        trackTitle: "Anchor",
        musicStyleId: "missing",
      }),
    ).toBe("techno");
  });
});
