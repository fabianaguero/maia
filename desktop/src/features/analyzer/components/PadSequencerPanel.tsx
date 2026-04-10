import { useEffect, useRef, useState, useCallback } from "react";
import type { ArrangementTrack, ArrangementVoice } from "./liveSonificationScene";

const STEPS = 16;
const TRACKS: ArrangementTrack[] = ["foundation", "motion", "accent"];

// Probability cycle values for right-click (%)
const PROB_CYCLE = [100, 75, 50, 25] as const;
type ProbValue = (typeof PROB_CYCLE)[number];

// Grid of probabilities per [track][step], default 100 = always fire
type ProbGrid = ProbValue[][];

// Default 16-step seed patterns per severity, derived from ARRANGEMENT_VOICE_MAP.
// info  → foundation on downbeats (steps 0,4,8,12)
// warn  → foundation + motion on off-beats
// error → all 3 tracks sparse strum
const SEED_PATTERNS: Record<string, boolean[][]> = {
  info: [
    // foundation
    [true,  false, false, false, true,  false, false, false,
     true,  false, false, false, true,  false, false, false],
    // motion
    Array(STEPS).fill(false),
    // accent
    Array(STEPS).fill(false),
  ],
  warn: [
    // foundation
    [true,  false, false, false, true,  false, false, false,
     true,  false, false, false, true,  false, false, false],
    // motion
    [false, false, true,  false, false, false, true,  false,
     false, false, true,  false, false, false, true,  false],
    // accent
    Array(STEPS).fill(false),
  ],
  error: [
    // foundation
    [true,  false, true,  false, true,  false, true,  false,
     true,  false, true,  false, true,  false, true,  false],
    // motion
    [false, true,  false, false, false, true,  false, false,
     false, true,  false, false, false, true,  false, false],
    // accent
    [false, false, false, true,  false, false, false, true,
     false, false, false, true,  false, false, false, true],
  ],
};

type PatternGrid = boolean[][];

function emptyGrid(): PatternGrid {
  return TRACKS.map(() => Array<boolean>(STEPS).fill(false));
}

function emptyProbGrid(): ProbGrid {
  return TRACKS.map(() => Array<ProbValue>(STEPS).fill(100));
}

function seedFromVoices(voices: ArrangementVoice[]): PatternGrid {
  // Build a hot set of tracks from the last N voices and fill the dominant seed
  const trackHits = new Set(voices.map((v) => v.cue.routeKey));
  if (trackHits.has("error") || trackHits.has("anomaly")) {
    return SEED_PATTERNS.error.map((row) => [...row]);
  }
  if (trackHits.has("warn")) {
    return SEED_PATTERNS.warn.map((row) => [...row]);
  }
  return SEED_PATTERNS.info.map((row) => [...row]);
}

interface PadSequencerPanelProps {
  bpm: number;
  recentVoices: ArrangementVoice[];
  onStepFire?: (firings: Array<{ track: ArrangementTrack; step: number; humanizeOffsetMs: number }>) => void;
}

export function PadSequencerPanel({ bpm, recentVoices, onStepFire }: PadSequencerPanelProps) {
  const [grid, setGrid] = useState<PatternGrid>(emptyGrid);
  const [probGrid, setProbGrid] = useState<ProbGrid>(emptyProbGrid);
  const [humanizeMs, setHumanizeMs] = useState(0);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep a ref to the current grid so the setInterval closure always reads fresh data
  const gridRef = useRef<PatternGrid>(grid);
  useEffect(() => { gridRef.current = grid; }, [grid]);
  const probGridRef = useRef<ProbGrid>(probGrid);
  useEffect(() => { probGridRef.current = probGrid; }, [probGrid]);
  const humanizeMsRef = useRef(humanizeMs);
  useEffect(() => { humanizeMsRef.current = humanizeMs; }, [humanizeMs]);
  // Keep a ref to onStepFire to avoid re-creating the interval on every render
  const stepFireRef = useRef(onStepFire);
  useEffect(() => { stepFireRef.current = onStepFire; }, [onStepFire]);

  const stepMs = bpm > 0 ? (60_000 / bpm) / 4 : 150; // 16th note duration in ms

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
      const currentStep = step % STEPS;
      setActiveStep(currentStep);
      const fire = stepFireRef.current;
      if (fire) {
        const firings: Array<{ track: ArrangementTrack; step: number; humanizeOffsetMs: number }> = [];
        const currentGrid = gridRef.current;
        const currentProb = probGridRef.current;
        const hms = humanizeMsRef.current;
        for (let i = 0; i < TRACKS.length; i++) {
          if (currentGrid[i]?.[currentStep]) {
            const prob = currentProb[i]?.[currentStep] ?? 100;
            if (Math.random() * 100 < prob) {
              const offset = hms > 0 ? (Math.random() * 2 - 1) * hms : 0;
              firings.push({ track: TRACKS[i], step: currentStep, humanizeOffsetMs: offset });
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
      const next = prev.map((row) => [...row]) as ProbGrid;
      const current = next[trackIdx]?.[stepIdx] ?? 100;
      const currentIndex = PROB_CYCLE.indexOf(current as ProbValue);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % PROB_CYCLE.length;
      next[trackIdx][stepIdx] = PROB_CYCLE[nextIndex] ?? 100;
      return next;
    });
  }, []);

  const handleFillFromScene = useCallback(() => {
    setGrid(seedFromVoices(recentVoices));
    setProbGrid(emptyProbGrid());
  }, [recentVoices]);

  const handleClear = useCallback(() => {
    setGrid(emptyGrid());
    setProbGrid(emptyProbGrid());
  }, []);

  const effectiveBpm = bpm > 0 ? bpm : 120;

  return (
    <div className="pad-sequencer-panel">
      <div className="pad-sequencer-header">
        <div className="pad-sequencer-meta">
          <span className="pad-sequencer-bpm">{Math.round(effectiveBpm)} BPM</span>
          <span className="pad-sequencer-steps">16 steps · 1 bar</span>
        </div>
        <div className="pad-sequencer-controls">
          <button
            className={`pad-seq-btn ${playing ? "pad-seq-btn--active" : ""}`}
            onClick={() => setPlaying((p) => !p)}
            title={playing ? "Stop playhead" : "Start playhead"}
          >
            {playing ? "■ Stop" : "▶ Play"}
          </button>
          <button
            className="pad-seq-btn"
            onClick={handleFillFromScene}
            title="Seed pattern from the last arrangement voices"
          >
            Fill from scene
          </button>
          <button
            className="pad-seq-btn pad-seq-btn--danger"
            onClick={handleClear}
            title="Clear all steps"
          >
            Clear
          </button>
          <label className="pad-seq-humanize-label" title="Humanize: randomises each hit timing ±N ms for a looser groove">
            Humanize
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={humanizeMs}
              onChange={(e) => setHumanizeMs(Number(e.target.value))}
              className="pad-seq-humanize-range"
            />
            <span className="pad-seq-humanize-value">{humanizeMs > 0 ? `±${humanizeMs}ms` : "off"}</span>
          </label>
        </div>
      </div>

      <p className="pad-seq-hint">Left-click to toggle · Right-click to cycle probability (100 → 75 → 50 → 25%)</p>

      <div className="pad-sequencer-grid">
        {/* Step index ruler */}
        <div className="pad-seq-row pad-seq-ruler-row">
          <span className="pad-seq-track-label" aria-hidden="true" />
          {Array.from({ length: STEPS }, (_, i) => (
            <span
              key={i}
              className={`pad-seq-ruler-cell ${i % 4 === 0 ? "pad-seq-ruler-cell--beat" : ""} ${activeStep === i ? "pad-seq-ruler-cell--active" : ""}`}
            >
              {i % 4 === 0 ? i / 4 + 1 : "·"}
            </span>
          ))}
        </div>

        {/* Track rows */}
        {TRACKS.map((track, trackIdx) => (
          <div key={track} className={`pad-seq-row pad-seq-track-row pad-seq-track--${track}`}>
            <span className="pad-seq-track-label">{track}</span>
            {Array.from({ length: STEPS }, (_, stepIdx) => {
              const isOn = grid[trackIdx][stepIdx];
              const isCurrent = activeStep === stepIdx;
              const prob = probGrid[trackIdx]?.[stepIdx] ?? 100;
              const isDimmed = isOn && prob < 100;
              return (
                <button
                  key={stepIdx}
                  className={[
                    "pad-seq-step",
                    isOn ? "pad-seq-step--on" : "",
                    isCurrent ? "pad-seq-step--current" : "",
                    stepIdx % 4 === 0 ? "pad-seq-step--beat" : "",
                    isDimmed ? `pad-seq-step--prob${prob}` : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={isDimmed ? { opacity: prob / 100 } : undefined}
                  onClick={() => toggleStep(trackIdx, stepIdx)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (isOn) cycleProbability(trackIdx, stepIdx);
                  }}
                  aria-pressed={isOn}
                  aria-label={`${track} step ${stepIdx + 1}${isOn && prob < 100 ? ` (${prob}%)` : ""}`}
                  title={isOn ? (prob < 100 ? `${prob}% probability — right-click to cycle` : "Right-click to set probability") : "Left-click to enable"}
                >
                  {isOn && prob < 100 ? (
                    <span className="pad-seq-step-prob">{prob}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
