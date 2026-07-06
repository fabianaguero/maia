import {
  startTransition,
  useEffectEvent,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { LiveLogStreamUpdate, LiveLogMarker, LibraryTrack } from "../../../types/library";
import { type SyncTailRow } from "./liveLogMonitorSyncRuntime";
import { type BeatClock } from "./liveLogMonitorBeatRuntime";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
import type {
  ArrangementVoice,
  ComponentOverride,
  ResolvedLiveSonificationScene,
  RoutedLiveCue,
} from "./liveSonificationScene";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";
import {
  buildLiveLogMonitorDerivedUpdate,
  resolveLiveLogMonitorCurrentTrackSecond,
  shouldIgnoreLiveLogMonitorUpdate,
} from "./liveLogMonitorOrchestratorRuntime";
import {
  applyLiveLogMonitorPlaybackUpdate,
  applyLiveLogMonitorVisualUpdate,
} from "./liveLogMonitorOrchestratorEffectRuntime";

export interface LiveLogMonitorOrchestratorLogger {
  trace: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
}

export interface LiveLogMonitorOrchestratorInput {
  repositoryId: string;
  sessionRepoId: string | null;
  audioContextRef: MutableRefObject<AudioContext | null>;
  backgroundDeckRef: MutableRefObject<BackgroundDeckState | null>;
  beatClockRef: MutableRefObject<BeatClock | null>;
  panelAudioProbePlayedRef: MutableRefObject<boolean>;
  scene: ResolvedLiveSonificationScene;
  availableTracks: LibraryTrack[];
  componentOverrides: ReadonlyMap<string, ComponentOverride>;
  replayActive: boolean;
  knownComponentsRef: MutableRefObject<string[]>;
  setLastUpdate: Dispatch<SetStateAction<LiveLogStreamUpdate | null>>;
  setRecentWarnings: Dispatch<SetStateAction<string[]>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSyncTailRows: Dispatch<SetStateAction<SyncTailRow[]>>;
  setActiveTailWindowId: Dispatch<SetStateAction<string | null>>;
  setIsAnomalyFlash: Dispatch<SetStateAction<boolean>>;
  setEmittedCueCount: Dispatch<SetStateAction<number>>;
  setRecentCues: Dispatch<SetStateAction<RoutedLiveCue[]>>;
  setRecentMarkers: Dispatch<SetStateAction<LiveLogMarker[]>>;
  setRecentExplanations: Dispatch<SetStateAction<LiveMutationExplanation[]>>;
  setBackgroundPlayheadSecond: Dispatch<SetStateAction<number>>;
  setSelectedExplanationId: Dispatch<SetStateAction<string | null>>;
  setRecentVoices: Dispatch<SetStateAction<ArrangementVoice[]>>;
  setKnownComponents: Dispatch<SetStateAction<string[]>>;
  setBeatClockBpm: Dispatch<SetStateAction<number | null>>;
  monitor: {
    isPlayback: boolean;
  };
  ensureAudioReady: () => Promise<AudioContext | null>;
  playWithCurrentEngine: (cues: RoutedLiveCue[], liveBpm?: number | null) => void;
  applyLogModulation: (update: LiveLogStreamUpdate) => void;
  playPanelTestTone: () => Promise<void>;
  logger: LiveLogMonitorOrchestratorLogger;
}

export function useLiveLogMonitorOrchestrator(input: LiveLogMonitorOrchestratorInput) {
  const onStreamUpdate = useEffectEvent((update: LiveLogStreamUpdate) => {
    input.logger.trace(
      "onStreamUpdate hasData=%s lines=%d cues=%d sessionRepo=%s panelRepo=%s",
      update.hasData,
      update.lineCount,
      update.sonificationCues.length,
      input.sessionRepoId,
      input.repositoryId,
    );

    if (
      shouldIgnoreLiveLogMonitorUpdate({
        sessionRepoId: input.sessionRepoId,
        repositoryId: input.repositoryId,
      })
    ) {
      input.logger.debug(
        "onStreamUpdate — skipped (repo mismatch session=%s vs panel=%s)",
        input.sessionRepoId,
        input.repositoryId,
      );
      return;
    }

    const currentTrackSecond = resolveLiveLogMonitorCurrentTrackSecond({
      audioContextRef: input.audioContextRef,
      backgroundDeckRef: input.backgroundDeckRef,
    });
    const derivedUpdate = buildLiveLogMonitorDerivedUpdate({
      update,
      scene: input.scene,
      knownComponents: input.knownComponentsRef.current,
      componentOverrides: input.componentOverrides,
      currentDeckTrackId: input.backgroundDeckRef.current?.trackId ?? null,
      availableTracks: input.availableTracks,
      currentTrackSecond,
    });

    input.knownComponentsRef.current = derivedUpdate.updateDerivation.knownComponents;
    if (derivedUpdate.updateDerivation.knownComponentsChanged) {
      input.setKnownComponents(input.knownComponentsRef.current.slice());
    }
    startTransition(() => {
      applyLiveLogMonitorVisualUpdate({
        update,
        derivedUpdate,
        currentTrackSecond,
        replayActive: input.replayActive,
        isPlayback: input.monitor.isPlayback,
        arrangementDepth: input.scene.mutationProfile.arrangementDepth,
        setLastUpdate: input.setLastUpdate,
        setRecentWarnings: input.setRecentWarnings,
        setError: input.setError,
        setSyncTailRows: input.setSyncTailRows,
        setActiveTailWindowId: input.setActiveTailWindowId,
        setIsAnomalyFlash: input.setIsAnomalyFlash,
        setEmittedCueCount: input.setEmittedCueCount,
        setRecentCues: input.setRecentCues,
        setRecentMarkers: input.setRecentMarkers,
        setRecentExplanations: input.setRecentExplanations,
        setBackgroundPlayheadSecond: input.setBackgroundPlayheadSecond,
        setSelectedExplanationId: input.setSelectedExplanationId,
        setRecentVoices: input.setRecentVoices,
        scheduleAnomalyFlashReset: () => {
          globalThis.setTimeout(() => input.setIsAnomalyFlash(false), 1200);
        },
      });
    });

    applyLiveLogMonitorPlaybackUpdate({
      update,
      replayActive: input.replayActive,
      panelAudioProbePlayedRef: input.panelAudioProbePlayedRef,
      hasBackgroundDeck: input.backgroundDeckRef.current !== null,
      beatClockRef: input.beatClockRef,
      useBeatGrid: input.scene.preset.useBeatGrid,
      audioCurrentTime: input.audioContextRef.current?.currentTime ?? null,
      setBeatClockBpm: input.setBeatClockBpm,
      ensureAudioReady: input.ensureAudioReady,
      playPanelTestTone: input.playPanelTestTone,
      playWithCurrentEngine: input.playWithCurrentEngine,
      applyLogModulation: input.applyLogModulation,
      logger: input.logger,
      derivedUpdate,
    });
  });

  return {
    onStreamUpdate,
  };
}
