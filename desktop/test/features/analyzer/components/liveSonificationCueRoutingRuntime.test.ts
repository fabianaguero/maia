import { describe, expect, it } from "vitest";

import type { LiveLogCue } from "../../../../src/types/library";
import { routeLiveCueThroughScene } from "../../../../src/features/analyzer/components/liveSonificationCueRoutingRuntime";
import { resolveLiveSonificationScene } from "../../../../src/features/analyzer/components/liveSonificationScene";

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

describe("liveSonificationCueRoutingRuntime", () => {
  it("routes cues through scene gain, timing and pan transforms", () => {
    const scene = resolveLiveSonificationScene(null, null, "alert-techno", "volatile", null);

    const routed = routeLiveCueThroughScene(baseCue, scene, 1, ["worker", "api"], undefined);

    expect(routed.routeKey).toBe("error");
    expect(routed.routeLabel).toBeTruthy();
    expect(routed.noteHz).not.toBe(baseCue.noteHz);
    expect(routed.durationMs).toBeGreaterThanOrEqual(90);
    expect(routed.gain).toBeGreaterThan(baseCue.gain);
    expect(routed.pan).not.toBe(scene.routes.find((route) => route.key === "error")?.pan);
  });

  it("returns a muted cue shell when the component override mutes the route", () => {
    const scene = resolveLiveSonificationScene(null, null, "steady-house", "balanced", null);

    const muted = routeLiveCueThroughScene(
      { ...baseCue, accent: "anomaly", component: "worker", level: "info" },
      scene,
      0,
      ["worker", "api"],
      new Map([["worker", { muted: true, gainMult: 1 }]]),
    );

    expect(muted.routeLabel).toBe("muted");
    expect(muted.gain).toBe(0);
    expect(muted.durationMs).toBe(0);
    expect(muted.samplePath).toBeNull();
  });

  it("applies gain overrides without losing anomaly route identity", () => {
    const scene = resolveLiveSonificationScene(null, null, "alert-techno", "reactive", null);

    const routed = routeLiveCueThroughScene(
      { ...baseCue, accent: "anomaly", component: "worker", level: "warn" },
      scene,
      2,
      ["worker", "api"],
      new Map([["worker", { muted: false, gainMult: 1.4 }]]),
    );

    expect(routed.routeKey).toBe("anomaly");
    expect(routed.gain).toBeGreaterThan(baseCue.gain);
    expect(routed.sampleLabel).toBe(
      scene.routes.find((route) => route.key === "anomaly")?.sampleLabel ?? null,
    );
  });
});
