import { useCallback, useEffect, useRef, useState } from "react";

import type { ArrangementTrack, ArrangementVoice } from "./liveSonificationScene";
import {
  createEmptyPadSequencerGrid,
  createEmptyPadSequencerProbGrid,
  cyclePadSequencerProbability,
  resolvePadSequencerEffectiveBpm,
  resolvePadSequencerStepMs,
  seedPadSequencerFromVoices,
  PAD_SEQUENCER_STEPS,
  PAD_SEQUENCER_TRACKS,
  type PadSequencerPatternGrid,
  type PadSequencerProbGrid,
} from "./padSequencerPanelRuntime";

interface UsePadSequencerControllerInput {
  bpm: number;
  recentVoices: ArrangementVoice[];
  onStepFire?: (
    firings: Array<{ track: ArrangementTrack; step: number; humanizeOffsetMs: number }>,
  ) => void;
}

export function usePadSequencerController({
  bpm,
  recentVoices,
  onStepFire,
}: UsePadSequencerControllerInput) {
  const [grid, setGrid] = useState<PadSequencerPatternGrid>(createEmptyPadSequencerGrid);
  const [probGrid, setProbGrid] = useState<PadSequencerProbGrid>(createEmptyPadSequencerProbGrid);
  const [humanizeMs, setHumanizeMs] = useState(0);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [playing, setPlaying] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gridRef = useRef<PadSequencerPatternGrid>(grid);
  const probGridRef = useRef<PadSequencerProbGrid>(probGrid);
  const humanizeMsRef = useRef(humanizeMs);
  const stepFireRef = useRef(onStepFire);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    probGridRef.current = probGrid;
  }, [probGrid]);

  useEffect(() => {
    humanizeMsRef.current = humanizeMs;
  }, [humanizeMs]);

  useEffect(() => {
    stepFireRef.current = onStepFire;
  }, [onStepFire]);

  const stepMs = resolvePadSequencerStepMs(bpm);

  useEffect(() => {
    if (!playing) {
      setActiveStep(-1);
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let step = 0;
    intervalRef.current = setInterval(() => {
      const currentStep = step % PAD_SEQUENCER_STEPS;
      setActiveStep(currentStep);
      const fire = stepFireRef.current;

      if (fire) {
        const firings: Array<{ track: ArrangementTrack; step: number; humanizeOffsetMs: number }> =
          [];
        const currentGrid = gridRef.current;
        const currentProb = probGridRef.current;
        const currentHumanizeMs = humanizeMsRef.current;

        for (let i = 0; i < PAD_SEQUENCER_TRACKS.length; i++) {
          if (currentGrid[i]?.[currentStep]) {
            const prob = currentProb[i]?.[currentStep] ?? 100;
            if (Math.random() * 100 < prob) {
              const offset =
                currentHumanizeMs > 0 ? (Math.random() * 2 - 1) * currentHumanizeMs : 0;
              firings.push({
                track: PAD_SEQUENCER_TRACKS[i],
                step: currentStep,
                humanizeOffsetMs: offset,
              });
            }
          }
        }

        if (firings.length > 0) {
          fire(firings);
        }
      }

      step++;
    }, stepMs);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [playing, stepMs]);

  const toggleStep = useCallback((trackIdx: number, stepIdx: number) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[trackIdx][stepIdx] = !next[trackIdx][stepIdx];
      return next;
    });
  }, []);

  const cycleProbability = useCallback((trackIdx: number, stepIdx: number) => {
    setProbGrid((prev) => {
      const next = prev.map((row) => [...row]) as PadSequencerProbGrid;
      const current = next[trackIdx]?.[stepIdx] ?? 100;
      next[trackIdx][stepIdx] = cyclePadSequencerProbability(current);
      return next;
    });
  }, []);

  const handleFillFromScene = useCallback(() => {
    setGrid(seedPadSequencerFromVoices(recentVoices));
    setProbGrid(createEmptyPadSequencerProbGrid());
  }, [recentVoices]);

  const handleClear = useCallback(() => {
    setGrid(createEmptyPadSequencerGrid());
    setProbGrid(createEmptyPadSequencerProbGrid());
  }, []);

  return {
    grid,
    probGrid,
    humanizeMs,
    setHumanizeMs,
    activeStep,
    playing,
    setPlaying,
    toggleStep,
    cycleProbability,
    handleFillFromScene,
    handleClear,
    effectiveBpm: resolvePadSequencerEffectiveBpm(bpm),
  };
}
