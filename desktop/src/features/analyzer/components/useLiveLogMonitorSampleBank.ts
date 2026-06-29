import { useEffect, type MutableRefObject } from "react";
import { isTauri } from "@tauri-apps/api/core";

import type { SampleEngineStatus } from "./liveLogMonitorViewModel";
import {
  fetchAndDecodeManagedSampleSources,
  resolveResolvableManagedSampleSources,
  type ManagedSampleSource,
} from "./liveLogMonitorSampleRuntime";

export function useLiveLogMonitorSampleBank(input: {
  sampleSources: ManagedSampleSource[];
  audioContextRef: MutableRefObject<AudioContext | null>;
  sampleBuffersRef: MutableRefObject<Map<string, AudioBuffer>>;
  setSampleStatus: (status: SampleEngineStatus) => void;
  createAudioContext: () => AudioContext | null;
  onLoadError: (message: string) => void;
}): void {
  const {
    sampleSources,
    audioContextRef,
    sampleBuffersRef,
    setSampleStatus,
    createAudioContext,
    onLoadError,
  } = input;

  useEffect(() => {
    const resolvableSampleSources = resolveResolvableManagedSampleSources(sampleSources, isTauri());

    sampleBuffersRef.current = new Map();

    if (resolvableSampleSources.length === 0) {
      setSampleStatus("unavailable");
      return;
    }

    let cancelled = false;

    async function loadSampleBuffer() {
      setSampleStatus("loading");

      try {
        if (!audioContextRef.current) {
          audioContextRef.current = createAudioContext();
        }

        if (!audioContextRef.current) {
          setSampleStatus("unavailable");
          return;
        }

        const decodedEntries = await fetchAndDecodeManagedSampleSources(
          audioContextRef.current,
          resolvableSampleSources,
        );
        if (cancelled) {
          return;
        }

        sampleBuffersRef.current = new Map(decodedEntries);
        setSampleStatus("ready");
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        sampleBuffersRef.current = new Map();
        setSampleStatus("error");
        onLoadError(nextError instanceof Error ? nextError.message : String(nextError));
      }
    }

    void loadSampleBuffer();

    return () => {
      cancelled = true;
    };
  }, [
    audioContextRef,
    createAudioContext,
    onLoadError,
    sampleBuffersRef,
    sampleSources,
    setSampleStatus,
  ]);
}
