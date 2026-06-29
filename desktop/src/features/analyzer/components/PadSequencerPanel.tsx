import { useEffect, useRef, useState, useCallback } from "react";
import { useT } from "../../../i18n/I18nContext";
import type { ArrangementTrack, ArrangementVoice } from "./liveSonificationScene";
import {
  buildPadSequencerRulerCells,
  buildPadSequencerTrackRows,
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

interface PadSequencerPanelProps {
  bpm: number;
  recentVoices: ArrangementVoice[];
  onStepFire?: (
    firings: Array<{ track: ArrangementTrack; step: number; humanizeOffsetMs: number }>,
  ) => void;
}

export function PadSequencerPanel({ bpm, recentVoices, onStepFire }: PadSequencerPanelProps) {
  const t = useT();
  const [grid, setGrid] = useState<PadSequencerPatternGrid>(createEmptyPadSequencerGrid);
  const [probGrid, setProbGrid] = useState<PadSequencerProbGrid>(createEmptyPadSequencerProbGrid);
  const [humanizeMs, setHumanizeMs] = useState(0);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep a ref to the current grid so the setInterval closure always reads fresh data
  const gridRef = useRef<PadSequencerPatternGrid>(grid);
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);
  const probGridRef = useRef<PadSequencerProbGrid>(probGrid);
  useEffect(() => {
    probGridRef.current = probGrid;
  }, [probGrid]);
  const humanizeMsRef = useRef(humanizeMs);
  useEffect(() => {
    humanizeMsRef.current = humanizeMs;
  }, [humanizeMs]);
  // Keep a ref to onStepFire to avoid re-creating the interval on every render
  const stepFireRef = useRef(onStepFire);
  useEffect(() => {
    stepFireRef.current = onStepFire;
  }, [onStepFire]);

  const stepMs = resolvePadSequencerStepMs(bpm);

  // Advance playhead and fire audio callback on active steps
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
        const hms = humanizeMsRef.current;
        for (let i = 0; i < PAD_SEQUENCER_TRACKS.length; i++) {
          if (currentGrid[i]?.[currentStep]) {
            const prob = currentProb[i]?.[currentStep] ?? 100;
            if (Math.random() * 100 < prob) {
              const offset = hms > 0 ? (Math.random() * 2 - 1) * hms : 0;
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

  const effectiveBpm = resolvePadSequencerEffectiveBpm(bpm);
  const rulerCells = buildPadSequencerRulerCells(activeStep);
  const trackRows = buildPadSequencerTrackRows({
    grid,
    probGrid,
    activeStep,
  });

  return (
    <div className="pad-sequencer-panel">
      <div className="pad-sequencer-header">
        <div className="pad-sequencer-meta">
          <span className="pad-sequencer-bpm">{Math.round(effectiveBpm)} BPM</span>
          <span className="pad-sequencer-steps">{t.inspect.stepsBarLabel}</span>
        </div>
        <div className="pad-sequencer-controls">
          <button
            className={`pad-seq-btn ${playing ? "pad-seq-btn--active" : ""}`}
            onClick={() => setPlaying((p) => !p)}
            title={playing ? t.inspect.stopPlayhead : t.inspect.startPlayhead}
          >
            {playing ? "■ Stop" : "▶ Play"}
          </button>
          <button
            className="pad-seq-btn"
            onClick={handleFillFromScene}
            title={t.inspect.seedPatternFromLastVoices}
          >
            {t.inspect.fillFromScene}
          </button>
          <button
            className="pad-seq-btn pad-seq-btn--danger"
            onClick={handleClear}
            title={t.inspect.clearAllSteps}
          >
            {t.inspect.clearAction}
          </button>
          <label className="pad-seq-humanize-label" title={t.inspect.humanizeTitle}>
            {t.inspect.humanize}
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={humanizeMs}
              onChange={(e) => setHumanizeMs(Number(e.target.value))}
              className="pad-seq-humanize-range"
            />
            <span className="pad-seq-humanize-value">
              {humanizeMs > 0 ? `±${humanizeMs}ms` : t.inspect.humanizeOff}
            </span>
          </label>
        </div>
      </div>

      <p className="pad-seq-hint">{t.inspect.sequencerHint}</p>

      <div className="pad-sequencer-grid">
        {/* Step index ruler */}
        <div className="pad-seq-row pad-seq-ruler-row">
          <span className="pad-seq-track-label" aria-hidden="true" />
          {rulerCells.map((cell) => (
            <span
              key={cell.key}
              className={`pad-seq-ruler-cell ${cell.isBeat ? "pad-seq-ruler-cell--beat" : ""} ${cell.isActive ? "pad-seq-ruler-cell--active" : ""}`}
            >
              {cell.label}
            </span>
          ))}
        </div>

        {/* Track rows */}
        {trackRows.map((row) => (
          <div key={row.track} className={row.className}>
            <span className="pad-seq-track-label">{row.track}</span>
            {row.steps.map((step) => (
              <button
                key={step.key}
                className={step.className}
                style={step.style}
                onClick={() => toggleStep(row.trackIndex, step.step)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (step.isOn) cycleProbability(row.trackIndex, step.step);
                }}
                aria-pressed={step.isOn}
                aria-label={t.inspect.trackStepAria
                  .replace("{track}", row.track)
                  .replace("{step}", String(step.step + 1))
                  .replace(
                    "{probability}",
                    step.isOn && step.probability < 100
                      ? t.inspect.probabilitySuffix.replace("{prob}", String(step.probability))
                      : "",
                  )}
                title={
                  step.isOn
                    ? step.probability < 100
                      ? t.inspect.rightClickCycleProbability.replace(
                          "{prob}",
                          String(step.probability),
                        )
                      : t.inspect.rightClickSetProbability
                    : t.inspect.leftClickEnable
                }
              >
                {step.isOn && step.probability < 100 ? (
                  <span className="pad-seq-step-prob">{step.probability}</span>
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
