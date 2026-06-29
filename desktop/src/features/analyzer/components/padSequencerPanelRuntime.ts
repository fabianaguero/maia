import type { ArrangementTrack, ArrangementVoice } from "./liveSonificationScene";

export const PAD_SEQUENCER_STEPS = 16;
export const PAD_SEQUENCER_TRACKS: ArrangementTrack[] = ["foundation", "motion", "accent"];

export const PAD_SEQUENCER_PROB_CYCLE = [100, 75, 50, 25] as const;
export type PadSequencerProbValue = (typeof PAD_SEQUENCER_PROB_CYCLE)[number];
export type PadSequencerProbGrid = PadSequencerProbValue[][];
export type PadSequencerPatternGrid = boolean[][];

export interface PadSequencerRulerCellViewModel {
  key: number;
  label: string | number;
  isBeat: boolean;
  isActive: boolean;
}

export interface PadSequencerStepViewModel {
  key: number;
  step: number;
  isOn: boolean;
  isCurrent: boolean;
  isBeat: boolean;
  probability: PadSequencerProbValue;
  isDimmed: boolean;
  className: string;
  style?: { opacity: number };
}

export interface PadSequencerTrackRowViewModel {
  track: ArrangementTrack;
  trackIndex: number;
  className: string;
  steps: PadSequencerStepViewModel[];
}

const PAD_SEQUENCER_SEED_PATTERNS: Record<string, boolean[][]> = {
  info: [
    [
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
    ],
    Array(PAD_SEQUENCER_STEPS).fill(false),
    Array(PAD_SEQUENCER_STEPS).fill(false),
  ],
  warn: [
    [
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
    ],
    [
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
    ],
    Array(PAD_SEQUENCER_STEPS).fill(false),
  ],
  error: [
    [
      true,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
    ],
    [
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
    ],
    [
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
    ],
  ],
};

export function createEmptyPadSequencerGrid(): PadSequencerPatternGrid {
  return PAD_SEQUENCER_TRACKS.map(() => Array<boolean>(PAD_SEQUENCER_STEPS).fill(false));
}

export function createEmptyPadSequencerProbGrid(): PadSequencerProbGrid {
  return PAD_SEQUENCER_TRACKS.map(() =>
    Array<PadSequencerProbValue>(PAD_SEQUENCER_STEPS).fill(100),
  );
}

export function seedPadSequencerFromVoices(voices: ArrangementVoice[]): PadSequencerPatternGrid {
  const trackHits = new Set(voices.map((voice) => voice.cue.routeKey));

  if (trackHits.has("error") || trackHits.has("anomaly")) {
    return PAD_SEQUENCER_SEED_PATTERNS.error.map((row) => [...row]);
  }
  if (trackHits.has("warn")) {
    return PAD_SEQUENCER_SEED_PATTERNS.warn.map((row) => [...row]);
  }

  return PAD_SEQUENCER_SEED_PATTERNS.info.map((row) => [...row]);
}

export function cyclePadSequencerProbability(
  current: PadSequencerProbValue | number,
): PadSequencerProbValue {
  const currentIndex = PAD_SEQUENCER_PROB_CYCLE.indexOf(current as PadSequencerProbValue);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % PAD_SEQUENCER_PROB_CYCLE.length;
  return PAD_SEQUENCER_PROB_CYCLE[nextIndex] ?? 100;
}

export function resolvePadSequencerEffectiveBpm(bpm: number): number {
  return bpm > 0 ? bpm : 120;
}

export function resolvePadSequencerStepMs(bpm: number): number {
  return bpm > 0 ? 60_000 / bpm / 4 : 150;
}

export function buildPadSequencerRulerCells(activeStep: number): PadSequencerRulerCellViewModel[] {
  return Array.from({ length: PAD_SEQUENCER_STEPS }, (_, index) => ({
    key: index,
    label: index % 4 === 0 ? index / 4 + 1 : "·",
    isBeat: index % 4 === 0,
    isActive: activeStep === index,
  }));
}

export function buildPadSequencerTrackRows(input: {
  grid: PadSequencerPatternGrid;
  probGrid: PadSequencerProbGrid;
  activeStep: number;
}): PadSequencerTrackRowViewModel[] {
  return PAD_SEQUENCER_TRACKS.map((track, trackIndex) => ({
    track,
    trackIndex,
    className: `pad-seq-row pad-seq-track-row pad-seq-track--${track}`,
    steps: Array.from({ length: PAD_SEQUENCER_STEPS }, (_, stepIndex) => {
      const isOn = input.grid[trackIndex]?.[stepIndex] ?? false;
      const probability = input.probGrid[trackIndex]?.[stepIndex] ?? 100;
      const isCurrent = input.activeStep === stepIndex;
      const isBeat = stepIndex % 4 === 0;
      const isDimmed = isOn && probability < 100;

      return {
        key: stepIndex,
        step: stepIndex,
        isOn,
        isCurrent,
        isBeat,
        probability,
        isDimmed,
        className: [
          "pad-seq-step",
          isOn ? "pad-seq-step--on" : "",
          isCurrent ? "pad-seq-step--current" : "",
          isBeat ? "pad-seq-step--beat" : "",
          isDimmed ? `pad-seq-step--prob${probability}` : "",
        ]
          .filter(Boolean)
          .join(" "),
        style: isDimmed ? { opacity: probability / 100 } : undefined,
      };
    }),
  }));
}
