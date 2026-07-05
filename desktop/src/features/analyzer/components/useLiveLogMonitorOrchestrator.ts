import {
  startTransition,
  useEffectEvent,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { LiveLogStreamUpdate, LiveLogMarker, LibraryTrack } from "../../../types/library";
import {
  type SyncTailRow,
} from "./liveLogMonitorSyncRuntime";
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
  buildLiveLogMonitorBeatClockPlan,
  buildLiveLogMonitorDerivedUpdate,
  buildLiveLogMonitorEmittedCueCountUpdater,
  buildLiveLogMonitorRecentCuesUpdater,
  buildLiveLogMonitorRecentExplanationsUpdater,
  buildLiveLogMonitorRecentMarkersUpdater,
  buildLiveLogMonitorRecentVoices,
  buildLiveLogMonitorRecentWarnings,
  buildLiveLogMonitorSelectedExplanationUpdater,
  buildLiveLogMonitorSyncTailRowsUpdater,
  resolveLiveLogMonitorCurrentTrackSecond,
  shouldIgnoreLiveLogMonitorUpdate,
  shouldPlayLiveLogMonitorPanelProbe,
} from "./liveLogMonitorOrchestratorRuntime";

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
    const routedCues = derivedUpdate.updateDerivation.routedCues;
    const nextExplanations = derivedUpdate.updateDerivation.nextExplanations;

    startTransition(() => {
      input.setLastUpdate(update);
      input.setRecentWarnings(buildLiveLogMonitorRecentWarnings(update));
      input.setError(null);

      if (!update.hasData) {
        return;
      }

      const syncTailRowsUpdater = buildLiveLogMonitorSyncTailRowsUpdater(derivedUpdate.nextTailRows);
      if (syncTailRowsUpdater) {
        input.setSyncTailRows(syncTailRowsUpdater);
      }
      input.setActiveTailWindowId(derivedUpdate.activeTailWindowId);

      if (update.anomalyCount > 0) {
        input.setIsAnomalyFlash(true);
        globalThis.setTimeout(() => input.setIsAnomalyFlash(false), 1200);
      }

      if (input.replayActive) {
        return;
      }

      input.setEmittedCueCount(buildLiveLogMonitorEmittedCueCountUpdater(routedCues));
      input.setRecentCues(
        buildLiveLogMonitorRecentCuesUpdater({
          routedCues,
          primaryLine: derivedUpdate.updateDerivation.primaryLine,
        }),
      );
      input.setRecentMarkers(buildLiveLogMonitorRecentMarkersUpdater(update.anomalyMarkers));
      input.setRecentExplanations(buildLiveLogMonitorRecentExplanationsUpdater(nextExplanations));
      if (typeof currentTrackSecond === "number") {
        input.setBackgroundPlayheadSecond(currentTrackSecond);
      }
      const selectedExplanationUpdater = buildLiveLogMonitorSelectedExplanationUpdater({
        nextExplanations,
        isPlayback: input.monitor.isPlayback,
      });
      if (selectedExplanationUpdater) {
        input.setSelectedExplanationId(selectedExplanationUpdater);
      }
      input.setRecentVoices(
        buildLiveLogMonitorRecentVoices(
          routedCues,
          input.scene.mutationProfile.arrangementDepth,
        ),
      );
    });

    if (update.hasData && !input.replayActive) {
      void input.ensureAudioReady();

      const beatClockSyncPlan = buildLiveLogMonitorBeatClockPlan({
        beatClockRef: input.beatClockRef,
        liveBpm: update.suggestedBpm,
        useBeatGrid: input.scene.preset.useBeatGrid,
        audioCurrentTime: input.audioContextRef.current?.currentTime ?? null,
      });
      if (beatClockSyncPlan.changed) {
        input.beatClockRef.current = beatClockSyncPlan.nextClock;
        input.setBeatClockBpm(beatClockSyncPlan.nextDisplayBpm);
      }

      input.logger.info(
        "onStreamUpdate → playing %d routed cues, bpm=%s",
        routedCues.length,
        update.suggestedBpm,
      );
      if (
        shouldPlayLiveLogMonitorPanelProbe({
          panelAudioProbePlayed: input.panelAudioProbePlayedRef.current,
          hasBackgroundDeck: input.backgroundDeckRef.current !== null,
        })
      ) {
        input.panelAudioProbePlayedRef.current = true;
        void input.playPanelTestTone();
      }
      input.playWithCurrentEngine(routedCues, update.suggestedBpm);
      input.applyLogModulation(update);
    }
  });

  return {
    onStreamUpdate,
  };
}
