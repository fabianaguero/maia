import { describe, expect, it } from "vitest";

import {
  buildPadSequencerRulerCells,
  buildPadSequencerTrackRows,
  createEmptyPadSequencerGrid,
  createEmptyPadSequencerProbGrid,
  cyclePadSequencerProbability,
  resolvePadSequencerEffectiveBpm,
  resolvePadSequencerStepMs,
  seedPadSequencerFromVoices,
} from "../../src/features/analyzer/components/padSequencerPanelRuntime";
import type { ArrangementVoice } from "../../src/features/analyzer/components/liveSonificationScene";

function makeVoice(routeKey: string): ArrangementVoice {
  return {
    cue: {
      id: "v-1",
      eventIndex: 0,
      level: "info",
      component: "api",
      excerpt: "",
      noteHz: 220,
      durationMs: 120,
      gain: 0.1,
      waveform: "sine",
      accent: "none",
      pan: 0,
      routeKey: routeKey as ArrangementVoice["cue"]["routeKey"],
      routeLabel: routeKey,
      stemLabel: "",
      sectionLabel: "",
      focus: "",
      samplePath: null,
      sampleLabel: null,
    },
    noteMultiplier: 1,
    gainMultiplier: 1,
    panOffset: 0,
    timeOffsetMs: 0,
  };
}

describe("padSequencerPanelRuntime", () => {
  it("builds empty pattern and probability grids for all tracks and steps", () => {
    expect(createEmptyPadSequencerGrid()).toHaveLength(3);
    expect(createEmptyPadSequencerGrid()[0]).toHaveLength(16);
    expect(createEmptyPadSequencerProbGrid()[1]?.every((value) => value === 100)).toBe(true);
  });

  it("cycles probability values and resolves bpm helpers", () => {
    expect(cyclePadSequencerProbability(100)).toBe(75);
    expect(cyclePadSequencerProbability(25)).toBe(100);
    expect(resolvePadSequencerEffectiveBpm(0)).toBe(120);
    expect(resolvePadSequencerStepMs(0)).toBe(150);
    expect(resolvePadSequencerStepMs(480)).toBeCloseTo(31.25, 2);
  });

  it("seeds severity-aware patterns from recent voices", () => {
    const infoSeed = seedPadSequencerFromVoices([makeVoice("info")]);
    const warnSeed = seedPadSequencerFromVoices([makeVoice("warn")]);
    const errorSeed = seedPadSequencerFromVoices([makeVoice("error")]);

    expect(infoSeed[0]?.[0]).toBe(true);
    expect(warnSeed[1]?.[2]).toBe(true);
    expect(errorSeed[2]?.[3]).toBe(true);
  });

  it("builds ruler and track-row view models for rendering", () => {
    const grid = createEmptyPadSequencerGrid();
    const probGrid = createEmptyPadSequencerProbGrid();
    grid[0][0] = true;
    probGrid[0][0] = 75;

    expect(buildPadSequencerRulerCells(4)[4]).toEqual({
      key: 4,
      label: 2,
      isBeat: true,
      isActive: true,
    });

    const rows = buildPadSequencerTrackRows({
      grid,
      probGrid,
      activeStep: 0,
    });

    expect(rows[0]).toMatchObject({
      track: "foundation",
      className: "pad-seq-row pad-seq-track-row pad-seq-track--foundation",
    });
    expect(rows[0]?.steps[0]).toMatchObject({
      isOn: true,
      isCurrent: true,
      isBeat: true,
      probability: 75,
      isDimmed: true,
    });
    expect(rows[0]?.steps[0]?.className).toContain("pad-seq-step--prob75");
  });
});
