import {
  useEffect,
  useEffectEvent,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

import type { AudioEngineStatus } from "./liveLogMonitorViewModel";

export interface LiveLogMonitorAudioBootstrapLogger {
  info: (message: string, ...args: unknown[]) => void;
  error: (message: string, error?: unknown) => void;
}

export function useLiveLogMonitorAudioBootstrap(input: {
  monitorAudioContext: AudioContext | null;
  resumeSharedAudio: () => Promise<void>;
  createAudioContext: () => AudioContext | null;
  audioContextRef: MutableRefObject<AudioContext | null>;
  usingSharedAudioContextRef: MutableRefObject<boolean>;
  masterGainRef: MutableRefObject<GainNode | null>;
  analyserRef: MutableRefObject<AnalyserNode | null>;
  setAudioStatus: Dispatch<SetStateAction<AudioEngineStatus>>;
  liveEnabled: boolean;
  replayActive: boolean;
  masterVolume: number;
  logger: LiveLogMonitorAudioBootstrapLogger;
}): {
  ensureAudioReady: () => Promise<AudioContext | null>;
} {
  useEffect(() => {
    if (!input.monitorAudioContext) {
      return;
    }

    input.audioContextRef.current = input.monitorAudioContext;
    input.usingSharedAudioContextRef.current = true;
  }, [input.audioContextRef, input.monitorAudioContext, input.usingSharedAudioContextRef]);

  const ensureAudioReady = useEffectEvent(async (): Promise<AudioContext | null> => {
    try {
      if (input.monitorAudioContext) {
        input.audioContextRef.current = input.monitorAudioContext;
        input.usingSharedAudioContextRef.current = true;
      }

      if (!input.audioContextRef.current) {
        input.audioContextRef.current = input.createAudioContext();
        input.usingSharedAudioContextRef.current = false;
      }

      const context = input.audioContextRef.current;
      if (!context) {
        input.setAudioStatus("unsupported");
        return null;
      }

      if (context.state === "suspended") {
        input.logger.info("Resuming AudioContext from suspended state...");
        if (input.usingSharedAudioContextRef.current) {
          await input.resumeSharedAudio();
          input.audioContextRef.current =
            input.monitorAudioContext ?? input.audioContextRef.current;
        } else {
          await context.resume();
        }
      }

      if (context.state === "running") {
        input.setAudioStatus("ready");
      }

      return context;
    } catch (error) {
      input.logger.error("Failed to ensure audio ready", error);
      input.setAudioStatus("error");
      return null;
    }
  });

  useEffect(() => {
    const initAudio = async () => {
      const context = await ensureAudioReady();
      if (!context || input.masterGainRef.current) {
        return;
      }

      const gain = context.createGain();
      gain.gain.value = input.masterVolume;

      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.7;
      input.analyserRef.current = analyser;

      gain.connect(analyser);
      analyser.connect(context.destination);
      input.masterGainRef.current = gain;
    };

    if (input.liveEnabled || input.replayActive) {
      void initAudio();
    }
  }, [
    ensureAudioReady,
    input.analyserRef,
    input.liveEnabled,
    input.masterGainRef,
    input.masterVolume,
    input.replayActive,
  ]);

  return { ensureAudioReady };
}
