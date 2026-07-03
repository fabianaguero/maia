import type { LibraryTrack } from "../../../types/library";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
import {
  buildBackgroundDeckState,
  fadeOutBackgroundDeck,
} from "./liveLogMonitorBackgroundDeckControlRuntime";

export function startBackgroundDeckPlayback(input: {
  context: AudioContext;
  filter: BiquadFilterNode;
  previousDeck: BackgroundDeckState | null;
  track: LibraryTrack;
  trackIndex: number;
  buffer: AudioBuffer;
  startPlan: {
    fadeSeconds: number;
    entrySecond: number;
    playbackRate: number;
    looping: boolean;
  };
  targetGain: number;
  transitionPlan?: PlaylistTransitionPlan | null;
}): {
  nextDeck: BackgroundDeckState;
  nowPlayingId: string;
  activeTransitionPlan: PlaylistTransitionPlan | null;
  playheadSecond: number;
} {
  const startAt = input.context.currentTime + 0.02;
  const source = input.context.createBufferSource();
  source.buffer = input.buffer;
  source.loop = input.startPlan.looping;
  source.playbackRate.setValueAtTime(input.startPlan.playbackRate, startAt);

  const trackGain = input.context.createGain();
  trackGain.gain.setValueAtTime(0.0001, startAt);

  source.connect(trackGain);
  trackGain.connect(input.filter);
  source.start(startAt, input.startPlan.entrySecond);
  trackGain.gain.linearRampToValueAtTime(input.targetGain, startAt + input.startPlan.fadeSeconds);

  if (input.previousDeck) {
    fadeOutBackgroundDeck(input.previousDeck, startAt, input.startPlan.fadeSeconds);
  }

  const nextDeck = buildBackgroundDeckState({
    source,
    buffer: input.buffer,
    gain: trackGain,
    track: input.track,
    trackIndex: input.trackIndex,
    startedAtContextTime: startAt,
    entrySecond: input.startPlan.entrySecond,
    playbackRate: input.startPlan.playbackRate,
    looping: input.startPlan.looping,
  });

  return {
    nextDeck,
    nowPlayingId: input.track.id,
    activeTransitionPlan:
      input.transitionPlan && input.transitionPlan.nextTrackId === input.track.id
        ? input.transitionPlan
        : null,
    playheadSecond: input.startPlan.entrySecond,
  };
}
