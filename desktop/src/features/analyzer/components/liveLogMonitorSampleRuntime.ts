import { convertFileSrc } from "@tauri-apps/api/core";

import { resolveManagedAudioSourceState } from "./liveLogMonitorAudioRuntime";

export interface ManagedSampleSource {
  path: string;
  label: string;
}

export interface ResolvableManagedSampleSource extends ManagedSampleSource {
  url: string;
}

export function resolveResolvableManagedSampleSources(
  sampleSources: ManagedSampleSource[],
  isTauriRuntime: boolean,
): ResolvableManagedSampleSource[] {
  return sampleSources
    .map((source) => ({
      ...source,
      url: resolveManagedAudioSourceState({
        audioPath: source.path,
        isTauriRuntime,
        convertFileSrc,
      }),
    }))
    .filter((source): source is ResolvableManagedSampleSource => Boolean(source.url));
}

export async function fetchAndDecodeManagedSampleSources(
  context: AudioContext,
  sampleSources: ResolvableManagedSampleSource[],
  fetchImpl: typeof fetch = fetch,
): Promise<ReadonlyArray<readonly [string, AudioBuffer]>> {
  return Promise.all(
    sampleSources.map(async (source) => {
      const response = await fetchImpl(source.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch managed sample ${source.label} (${response.status}).`);
      }

      const encodedAudio = await response.arrayBuffer();
      const decoded = await context.decodeAudioData(encodedAudio.slice(0));

      return [source.path, decoded] as const;
    }),
  );
}
