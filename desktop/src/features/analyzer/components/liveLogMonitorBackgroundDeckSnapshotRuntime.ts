import type {
  BackgroundDeckSnapshot,
  BackgroundDeckState,
} from "./liveLogMonitorBackgroundDeckTypes";

export function snapshotBackgroundDeckState(
  deck: BackgroundDeckState | null,
): BackgroundDeckSnapshot | null {
  if (!deck) {
    return null;
  }

  return {
    trackId: deck.trackId,
    trackIndex: deck.trackIndex,
    looping: deck.looping,
    entrySecond: deck.entrySecond,
    playbackRate: deck.playbackRate,
    durationSec: deck.durationSec,
  };
}
