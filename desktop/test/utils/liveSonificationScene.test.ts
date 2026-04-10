import { describe, expect, it } from "vitest";

import type { LiveLogCue } from "../../src/types/library";
import {
  resolveArrangementVoices,
  resolveLiveSonificationScene,
  routeCueThroughScene,
} from "../../src/features/analyzer/components/liveSonificationScene";

const baseCue: LiveLogCue = {
  id: "cue-1",
  eventIndex: 0,
  level: "error",
  component: "api",
  excerpt: "500 response",
  noteHz: 220,
  durationMs: 180,
  gain: 0.16,
  waveform: "triangle",
  accent: "none",
};

describe("live sonification profiles", () => {
  it("resolves style and mutation profiles into the runtime scene", () => {
    const scene = resolveLiveSonificationScene(
      null,
      null,
      "alert-techno",
      "volatile",
      null,
    );

    expect(scene.styleProfile.id).toBe("alert-techno");
    expect(scene.mutationProfile.id).toBe("volatile");
    expect(scene.genreId).toBe("techno");
    expect(scene.preset.useBeatGrid).toBe(true);
    expect(scene.preset.maxCuesPerWindow).toBeGreaterThan(8);
    expect(scene.preset.scheduleGapMs).toBeLessThan(80);
  });

  it("amplifies cue motion and gain when the mutation profile is more aggressive", () => {
    const subtleScene = resolveLiveSonificationScene(
      null,
      null,
      "steady-house",
      "subtle",
      null,
    );
    const volatileScene = resolveLiveSonificationScene(
      null,
      null,
      "alert-techno",
      "volatile",
      null,
    );

    const subtleCue = routeCueThroughScene(baseCue, subtleScene, 0);
    const volatileCue = routeCueThroughScene(baseCue, volatileScene, 0);

    expect(volatileCue.noteHz).toBeGreaterThan(subtleCue.noteHz);
    expect(volatileCue.gain).toBeGreaterThan(subtleCue.gain);
    expect(volatileCue.routeLabel).toBeTruthy();
  });

  it("changes arrangement depth with the mutation profile", () => {
    const fullScene = resolveLiveSonificationScene(
      null,
      null,
      "steady-house",
      "balanced",
      null,
    );
    const stackedScene = resolveLiveSonificationScene(
      null,
      null,
      "steady-house",
      "volatile",
      null,
    );
    const routedCue = routeCueThroughScene(baseCue, fullScene, 0);

    const minimalVoices = resolveArrangementVoices([routedCue], "minimal");
    const fullVoices = resolveArrangementVoices([routedCue], fullScene.mutationProfile.arrangementDepth);
    const stackedVoices = resolveArrangementVoices([routedCue], stackedScene.mutationProfile.arrangementDepth);

    expect(minimalVoices).toHaveLength(1);
    expect(fullVoices.length).toBeGreaterThan(minimalVoices.length);
    expect(stackedVoices.length).toBeGreaterThan(fullVoices.length);
  });
});
