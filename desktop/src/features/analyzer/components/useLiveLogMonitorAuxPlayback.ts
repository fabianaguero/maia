import { useEffectEvent, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import {
  playManagedWavBlobState,
  type ManagedBlobAudioElement,
} from "./liveLogMonitorAudioRuntime";
import type { AudioEngineStatus } from "./liveLogMonitorViewModel";

export interface LiveLogMonitorAuxPlaybackLogger {
  warn: (message: string, ...args: unknown[]) => void;
}

export function useLiveLogMonitorAuxPlayback(input: {
  ensureAudioReady: () => Promise<AudioContext | null>;
  masterGainRef: MutableRefObject<GainNode | null>;
  masterVolume: number;
  activeBlobAudioElements: Set<ManagedBlobAudioElement>;
  setAudioStatus: Dispatch<SetStateAction<AudioEngineStatus>>;
  logger: LiveLogMonitorAuxPlaybackLogger;
  toMessage: (error: unknown) => string;
}): {
  playRenderedBlobThroughGraph: (blob: Blob, volume: number) => Promise<void>;
  playPanelTestTone: () => Promise<void>;
} {
  const playRenderedBlobThroughGraph = useEffectEvent(async (blob: Blob, volume: number) => {
    const context = await input.ensureAudioReady();
    const destination = input.masterGainRef.current;
    const clampedVolume = Math.max(0, Math.min(1, volume));

    if (context && destination) {
      try {
        const encodedAudio = await blob.arrayBuffer();
        const decoded = await context.decodeAudioData(encodedAudio.slice(0));
        const source = context.createBufferSource();
        const gain = context.createGain();
        gain.gain.setValueAtTime(clampedVolume, context.currentTime);
        source.buffer = decoded;
        source.connect(gain);
        gain.connect(destination);
        source.start(context.currentTime + 0.01);
        source.onended = () => {
          try {
            source.disconnect();
            gain.disconnect();
          } catch {
            // ignore disconnect races
          }
        };
        input.setAudioStatus("ready");
        return;
      } catch (error) {
        input.logger.warn(
          "WebAudio blob playback failed; falling back to HTMLAudio: %s",
          input.toMessage(error),
        );
      }
    }

    playManagedWavBlobState({
      blob,
      volume: clampedVolume,
      activeBlobAudioElements: input.activeBlobAudioElements,
      createObjectUrl: (nextBlob) => URL.createObjectURL(nextBlob),
      revokeObjectUrl: (url) => URL.revokeObjectURL(url),
      createAudio: (url) => new Audio(url),
      setTimeoutFn: (handler, timeout) => setTimeout(handler, timeout),
      logger: input.logger,
    });
  });

  const playPanelTestTone = useEffectEvent(async () => {
    const context = await input.ensureAudioReady();
    const destination = input.masterGainRef.current;
    if (!context || !destination) {
      return;
    }

    const now = context.currentTime + 0.02;
    const tones = [164.81, 220, 329.63];
    tones.forEach((frequency, index) => {
      const startAt = now + index * 0.16;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index === tones.length - 1 ? "triangle" : "sawtooth";
      oscillator.frequency.setValueAtTime(frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.linearRampToValueAtTime(Math.max(0.08, input.masterVolume * 0.55), startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);
      oscillator.connect(gain);
      gain.connect(destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.24);
    });

    input.setAudioStatus("ready");
  });

  return { playRenderedBlobThroughGraph, playPanelTestTone };
}
