import { useEffect, useRef, useState, useCallback } from "react";
import type { ArrangementTrack, ArrangementVoice } from "./liveSonificationScene";

const STEPS = 16;
const TRACKS: ArrangementTrack[] = ["foundation", "motion", "accent"];

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
}

export function PadSequencerPanel({ bpm, recentVoices }: PadSequencerPanelProps) {
  const [grid, setGrid] = useState<PatternGrid>(emptyGrid);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stepMs = bpm > 0 ? (60_000 / bpm) / 4 : 150; // 16th note duration in ms

  // Advance playhead
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
      setActiveStep(step % STEPS);
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

  const handleFillFromScene = useCallback(() => {
    setGrid(seedFromVoices(recentVoices));
  }, [recentVoices]);

  const handleClear = useCallback(() => {
    setGrid(emptyGrid());
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
        </div>
      </div>

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
              return (
                <button
                  key={stepIdx}
                  className={[
                    "pad-seq-step",
                    isOn ? "pad-seq-step--on" : "",
                    isCurrent ? "pad-seq-step--current" : "",
                    stepIdx % 4 === 0 ? "pad-seq-step--beat" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => toggleStep(trackIdx, stepIdx)}
                  aria-pressed={isOn}
                  aria-label={`${track} step ${stepIdx + 1}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
