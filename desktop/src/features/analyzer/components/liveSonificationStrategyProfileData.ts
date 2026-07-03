import type { StrategyProfile } from "./liveSonificationSceneProfileData";

export const STRATEGY_PROFILES: Record<string, StrategyProfile> = {
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
