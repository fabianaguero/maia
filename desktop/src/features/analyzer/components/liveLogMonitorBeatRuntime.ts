import type { MutableRefObject } from "react";

export interface BeatClock {
  originTime: number;
  bpm: number;
}

export interface BeatLooperState {
  cancelled: boolean;
}

export interface BeatLooperPulse {
  noteHz: number;
  peakGain: number;
  durationSeconds: number;
}

export interface BeatClockLiveSyncPlan {
  nextClock: BeatClock | null;
  nextDisplayBpm: number | null;
  changed: boolean;
}

export function nextBeatTime(
  contextNow: number,
  originTime: number,
  bpm: number,
  subdivision: number,
  lookaheadSeconds: number,
): number {
  const subdivPeriodSeconds = 60 / bpm / Math.max(1, subdivision / 4);
  const elapsed = contextNow + lookaheadSeconds - originTime;
  const nextCount = Math.max(0, Math.ceil(elapsed / subdivPeriodSeconds));
  return originTime + nextCount * subdivPeriodSeconds;
}

export function buildBeatLooperPulse(step: number): BeatLooperPulse {
  const isDownbeat = step % 4 === 0;
  return {
    noteHz: isDownbeat ? 58 : 136,
    peakGain: isDownbeat ? 0.058 : 0.026,
    durationSeconds: isDownbeat ? 0.09 : 0.052,
  };
}

export function resolveBeatClockLiveSync(input: {
  currentClock: BeatClock | null;
  liveBpm: number | null | undefined;
  useBeatGrid: boolean;
  audioCurrentTime: number | null;
  driftThreshold?: number;
}): BeatClockLiveSyncPlan {
  const {
    currentClock,
    liveBpm,
    useBeatGrid,
    audioCurrentTime,
    driftThreshold = 0.12,
  } = input;

  if (!useBeatGrid || typeof liveBpm !== "number" || liveBpm <= 0) {
    return {
      nextClock: currentClock,
      nextDisplayBpm: null,
      changed: false,
    };
  }

  if (currentClock === null) {
    if (audioCurrentTime === null) {
      return {
        nextClock: null,
        nextDisplayBpm: null,
        changed: false,
      };
    }

    return {
      nextClock: { originTime: audioCurrentTime, bpm: liveBpm },
      nextDisplayBpm: liveBpm,
      changed: true,
    };
  }

  const drift = Math.abs(liveBpm - currentClock.bpm) / currentClock.bpm;
  if (drift <= driftThreshold) {
    return {
      nextClock: currentClock,
      nextDisplayBpm: null,
      changed: false,
    };
  }

  return {
    nextClock: { ...currentClock, bpm: liveBpm },
    nextDisplayBpm: liveBpm,
    changed: true,
  };
}

export function startBeatLooper(
  context: AudioContext,
  bpm: number,
  subdivision: number,
  stateRef: MutableRefObject<BeatLooperState | null>,
  destination: AudioNode,
): void {
  const state: BeatLooperState = { cancelled: false };
  stateRef.current = state;
  const periodMs = (60 / bpm / Math.max(1, subdivision / 4)) * 1000;
  const lookaheadSeconds = 0.1;
  let step = 0;

  const tick = (): void => {
    if (state.cancelled) {
      return;
    }

    const at = context.currentTime + lookaheadSeconds;
    const pulse = buildBeatLooperPulse(step);
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(pulse.noteHz, at);
    gainNode.gain.setValueAtTime(0.0001, at);
    gainNode.gain.linearRampToValueAtTime(pulse.peakGain, at + 0.007);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, at + pulse.durationSeconds);
    oscillator.connect(gainNode);
    gainNode.connect(destination);
    oscillator.start(at);
    oscillator.stop(at + pulse.durationSeconds + 0.02);

    step += 1;
    setTimeout(tick, periodMs);
  };

  tick();
}

export function stopBeatLooper(stateRef: MutableRefObject<BeatLooperState | null>): void {
  if (!stateRef.current) {
    return;
  }

  stateRef.current.cancelled = true;
  stateRef.current = null;
}
