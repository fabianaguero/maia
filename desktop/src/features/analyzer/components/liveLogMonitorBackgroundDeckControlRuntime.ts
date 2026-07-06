import type { LibraryTrack } from "../../../types/library";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";

interface AudioParamLike {
  value: number;
  cancelScheduledValues: (time: number) => void;
  setValueAtTime: (value: number, time: number) => void;
  linearRampToValueAtTime: (value: number, time: number) => void;
}

interface BackgroundDeckStopLike {
  source: {
    stop: (when?: number) => void;
  };
  gain: {
    gain: AudioParamLike;
  };
}

export function fadeOutBackgroundDeck(
  deck: BackgroundDeckStopLike,
  startAt: number,
  fadeSeconds: number,
): void {
  deck.gain.gain.cancelScheduledValues(startAt);
  deck.gain.gain.setValueAtTime(Math.max(0.0001, deck.gain.gain.value), startAt);
  deck.gain.gain.linearRampToValueAtTime(0.0001, startAt + fadeSeconds);
  try {
    deck.source.stop(startAt + fadeSeconds + 0.08);
  } catch {
    // ignore stop races
  }
}

export function buildBackgroundDeckState(input: {
  source: AudioBufferSourceNode;
  buffer: AudioBuffer;
  gain: GainNode;
  track: LibraryTrack;
  trackIndex: number;
  startedAtContextTime: number;
  entrySecond: number;
  playbackRate: number;
  looping: boolean;
}): BackgroundDeckState {
  return {
    source: input.source,
    buffer: input.buffer,
    gain: input.gain,
    trackId: input.track.id,
    trackIndex: input.trackIndex,
    startedAtContextTime: input.startedAtContextTime,
    bufferDurationSec: input.buffer.duration,
    durationSec: Math.max(0.25, (input.buffer.duration - input.entrySecond) / input.playbackRate),
    entrySecond: input.entrySecond,
    playbackRate: input.playbackRate,
    looping: input.looping,
  };
}

export function prependBackgroundDeckWarning(
  message: string,
  currentWarnings: string[],
  maxRecentWarnings: number,
): string[] {
  return [message, ...currentWarnings].slice(0, maxRecentWarnings);
}

export function clearBackgroundDeckState(
  setBackgroundNowPlayingId: (value: string | null) => void,
  setBackgroundTransitionPlan: (value: null) => void,
): void {
  setBackgroundNowPlayingId(null);
  setBackgroundTransitionPlan(null);
}

export function shouldEnsureBackgroundAudio(
  activeDeck: BackgroundDeckState | null,
  playableTrackCount: number,
): boolean {
  return !activeDeck && playableTrackCount > 0;
}
