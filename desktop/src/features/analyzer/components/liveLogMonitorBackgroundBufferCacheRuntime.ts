import { loadDecodedAudioBuffer } from "./liveLogMonitorBackgroundAudioDecodeRuntime";

export async function loadCachedAudioBuffer(input: {
  cacheKey: string | null;
  url: string | null;
  context: AudioContext;
  cache: Map<string, Promise<AudioBuffer>>;
  fetchImpl?: typeof fetch;
}): Promise<AudioBuffer | null> {
  if (!input.cacheKey || !input.url) {
    return null;
  }
  const { cacheKey, url } = input;

  let cached = input.cache.get(cacheKey);
  if (!cached) {
    cached = loadDecodedAudioBuffer({
      url,
      context: input.context,
      fetchImpl: input.fetchImpl,
    });
    input.cache.set(cacheKey, cached);
  }

  try {
    return await cached;
  } catch (error) {
    input.cache.delete(cacheKey);
    throw error;
  }
}
