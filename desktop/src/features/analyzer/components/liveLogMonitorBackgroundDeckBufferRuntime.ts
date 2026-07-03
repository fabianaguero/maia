import type { LibraryTrack } from "../../../types/library";
import { resolvePlayableTrackPath } from "../../../utils/track";
import { loadCachedAudioBuffer } from "./liveLogMonitorBackgroundBufferCacheRuntime";
import { resolveBackgroundTrackUrl } from "./liveLogMonitorBackgroundTrackUrlRuntime";

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

  return loadCachedAudioBuffer({
    cacheKey: audioPath,
    url,
    context: input.context,
    cache: input.cache,
    fetchImpl: input.fetchImpl,
  });
}
