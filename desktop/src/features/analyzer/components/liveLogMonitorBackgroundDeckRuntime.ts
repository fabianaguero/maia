import type { LibraryTrack } from "../../../types/library";
import { resolvePlayableTrackPath } from "../../../utils/track";

export interface BackgroundDeckState {
  source: AudioBufferSourceNode;
  buffer: AudioBuffer;
  gain: GainNode;
  trackId: string;
  trackIndex: number;
  startedAtContextTime: number;
  bufferDurationSec: number;
  durationSec: number;
  entrySecond: number;
  playbackRate: number;
  looping: boolean;
}

export interface BackgroundDeckSnapshot {
  trackId: string;
  trackIndex: number;
  looping: boolean;
  entrySecond: number;
  playbackRate: number;
  durationSec: number;
}

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

export function resolveBackgroundTrackUrl(input: {
  track: LibraryTrack;
  isTauriRuntime: boolean;
  convertFileSrc: (path: string) => string;
}): string | null {
  const audioPath = resolvePlayableTrackPath(input.track);
  if (!audioPath) {
    return null;
  }

  if (!input.isTauriRuntime) {
    return audioPath;
  }

  try {
    return input.convertFileSrc(audioPath);
  } catch {
    return null;
  }
}

export async function loadCachedBackgroundBuffer(input: {
  context: AudioContext;
  track: LibraryTrack;
  cache: Map<string, Promise<AudioBuffer>>;
  isTauriRuntime: boolean;
  convertFileSrc: (path: string) => string;
  fetchImpl?: typeof fetch;
}): Promise<AudioBuffer | null> {
  const audioPath = resolvePlayableTrackPath(input.track);
  if (!audioPath) {
    return null;
  }

  const url = resolveBackgroundTrackUrl({
    track: input.track,
    isTauriRuntime: input.isTauriRuntime,
    convertFileSrc: input.convertFileSrc,
  });
  if (!url) {
    return null;
  }

  let cached = input.cache.get(audioPath);
  if (!cached) {
    const fetchImpl = input.fetchImpl ?? fetch;
    cached = (async () => {
      const response = await fetchImpl(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching guide track`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return input.context.decodeAudioData(arrayBuffer);
    })();
    input.cache.set(audioPath, cached);
  }

  try {
    return await cached;
  } catch (error) {
    input.cache.delete(audioPath);
    throw error;
  }
}
