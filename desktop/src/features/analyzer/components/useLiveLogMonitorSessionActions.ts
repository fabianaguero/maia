import { useEffectEvent } from "react";

import type { MutableRefObject, RefObject } from "react";

import type { RepositoryAnalysis, StartSessionInput, StreamAdapterKind } from "../../../types/library";
import { renderBounceWav, BOUNCE_WINDOW_S } from "./wavRenderer";
import {
  buildLiveMonitorStartResetState,
  createLiveMonitorSessionInput,
  resolveLiveMonitorStartAudioPlan,
} from "./liveLogMonitorSessionRuntime";
import {
  createLiveMonitorSessionId,
  resolveLiveMonitorStartFailureMessage,
  resolveLiveMonitorStartWarning,
} from "./liveLogMonitorControlRuntime";
import { stopLiveMonitorAudioGraph } from "./liveLogMonitorAudioCleanupRuntime";
import {
  buildLiveMonitorStopResetState,
  resolveLiveMonitorBounceFilename,
} from "./liveLogMonitorActionRuntime";
import { startBeatLooper, type BeatClock, type BeatLooperState } from "./liveLogMonitorBeatRuntime";
import type { RoutedLiveCue } from "./liveSonificationScene";

export interface UseLiveLogMonitorSessionActionsInput {
  repository: RepositoryAnalysis;
  adapterKind: StreamAdapterKind;
  ensureAudioReady: () => Promise<AudioContext | null>;
  monitor: {
    startSession: (
      repo: RepositoryAnalysis,
      input: StartSessionInput,
      persistedSessionId?: string,
    ) => Promise<boolean>;
    stopSession: () => Promise<void>;
  };
  referenceAnchorBpm: number | null;
  useBeatGrid: boolean;
  rhythmDivision: number;
  audioContextRef: MutableRefObject<AudioContext | null>;
  beatClockRef: MutableRefObject<BeatClock | null>;
  beatLooperRef: MutableRefObject<BeatLooperState | null>;
  bounceCuesRef: MutableRefObject<RoutedLiveCue[][]>;
  masterVolume: number;
  toMessage: (error: unknown) => string;
  applyStartReset: (resetState: ReturnType<typeof buildLiveMonitorStartResetState>) => void;
  applyStopReset: (resetState: ReturnType<typeof buildLiveMonitorStopResetState>) => void;
  setBeatClockBpm: (value: number | null) => void;
  setBeatLooperActive: (value: boolean) => void;
  setRecentWarnings: (updater: (current: string[]) => string[]) => void;
  setError: (value: string | null) => void;
  setIsStarting: (value: boolean) => void;
  ensureBackgroundAudio: (context: AudioContext) => Promise<void> | void;
  stopBackgroundDeck: () => void;
  stopBeatLooper: () => void;
  muteManagedBlobAudio: () => void;
  backgroundGainRef: RefObject<GainNode | null>;
  backgroundDryGainRef: RefObject<GainNode | null>;
  backgroundDriveWetGainRef: RefObject<GainNode | null>;
  backgroundDriveNodeRef: RefObject<WaveShaperNode | null>;
  filterNodeRef: RefObject<BiquadFilterNode | null>;
  masterGainRef: RefObject<GainNode | null>;
  analyserRef: RefObject<AnalyserNode | null>;
}

export function useLiveLogMonitorSessionActions(input: UseLiveLogMonitorSessionActionsInput) {
  const handleStart = useEffectEvent(async () => {
    const resetState = buildLiveMonitorStartResetState();
    input.applyStartReset(resetState);

    await input.ensureAudioReady();

    const sessionId = createLiveMonitorSessionId(input.repository.id, Date.now());

    try {
      const startWarning = resolveLiveMonitorStartWarning(
        input.adapterKind,
        input.repository.sourcePath,
      );
      if (startWarning) {
        input.setRecentWarnings((current) => [startWarning, ...current]);
      }
      const sessionInput = createLiveMonitorSessionInput(input.repository, sessionId);

      const started = await input.monitor.startSession(input.repository, sessionInput);
      if (!started) {
        throw new Error("Maia could not start the selected live source in the current runtime.");
      }

      const context = input.audioContextRef.current;
      const startAudioPlan = resolveLiveMonitorStartAudioPlan({
        contextTime: context?.currentTime ?? null,
        anchorBpm: input.referenceAnchorBpm,
        useBeatGrid: input.useBeatGrid,
      });

      if (startAudioPlan.beatClockSeed) {
        input.beatClockRef.current = startAudioPlan.beatClockSeed;
        input.setBeatClockBpm(startAudioPlan.beatClockBpm);
      } else {
        input.beatClockRef.current = null;
        input.setBeatClockBpm(null);
      }

      if (context && startAudioPlan.shouldStartBeatLooper && startAudioPlan.beatLooperBpm) {
        startBeatLooper(
          context,
          startAudioPlan.beatLooperBpm,
          input.rhythmDivision,
          input.beatLooperRef,
          input.masterGainRef.current ?? context.destination,
        );
        input.setBeatLooperActive(true);
      }

      if (context) {
        await input.ensureBackgroundAudio(context);
      }
    } catch (error) {
      console.error("Start session failed", error);
      input.setError(resolveLiveMonitorStartFailureMessage(error, input.toMessage));
    } finally {
      input.setIsStarting(false);
    }
  });

  const handleStop = useEffectEvent(() => {
    const resetState = buildLiveMonitorStopResetState();

    void input.monitor.stopSession();
    input.applyStopReset(resetState);
    stopLiveMonitorAudioGraph({
      stopBackgroundDeck: input.stopBackgroundDeck,
      stopBeatLooper: input.stopBeatLooper,
      muteManagedBlobAudio: input.muteManagedBlobAudio,
      backgroundGainRef: input.backgroundGainRef,
      backgroundDryGainRef: input.backgroundDryGainRef,
      backgroundDriveWetGainRef: input.backgroundDriveWetGainRef,
      backgroundDriveNodeRef: input.backgroundDriveNodeRef,
      filterNodeRef: input.filterNodeRef,
      masterGainRef: input.masterGainRef,
      analyserRef: input.analyserRef,
    });
  });

  const handleBounce = useEffectEvent(() => {
    const windows = input.bounceCuesRef.current;
    if (windows.length === 0) {
      return;
    }

    const blob = renderBounceWav(windows, input.masterVolume);
    if (!blob) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = resolveLiveMonitorBounceFilename({
      repositoryTitle: input.repository.title,
      windowCount: windows.length,
      bounceWindowSeconds: BOUNCE_WINDOW_S,
    });
    anchor.click();
    globalThis.setTimeout(() => URL.revokeObjectURL(url), 5000);
  });

  return {
    handleStart,
    handleStop,
    handleBounce,
  };
}
