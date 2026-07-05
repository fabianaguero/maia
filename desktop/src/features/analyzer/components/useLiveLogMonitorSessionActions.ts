import { useEffectEvent } from "react";

import type { MutableRefObject, RefObject } from "react";

import type {
  RepositoryAnalysis,
  StartSessionInput,
  StreamAdapterKind,
} from "../../../types/library";
import type { buildLiveMonitorStopResetState } from "./liveLogMonitorActionRuntime";
import { type BeatClock, type BeatLooperState } from "./liveLogMonitorBeatRuntime";
import type { buildLiveMonitorStartResetState } from "./liveLogMonitorSessionRuntime";
import {
  bounceLiveLogMonitorSessionAction,
  startLiveLogMonitorSessionAction,
  stopLiveLogMonitorSessionAction,
} from "./liveLogMonitorSessionActionRuntime";
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
  const handleStart = useEffectEvent(async () => startLiveLogMonitorSessionAction(input));

  const handleStop = useEffectEvent(() => stopLiveLogMonitorSessionAction(input));

  const handleBounce = useEffectEvent(() => bounceLiveLogMonitorSessionAction(input));

  return {
    handleStart,
    handleStop,
    handleBounce,
  };
}
