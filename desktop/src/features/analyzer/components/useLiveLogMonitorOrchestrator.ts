import {
  startTransition,
  useEffectEvent,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { LiveLogStreamUpdate, LiveLogMarker, LibraryTrack } from "../../../types/library";
import {
  buildRecentCueHistory,
  buildRecentExplanationHistory,
  buildRecentMarkerHistory,
  buildRecentMonitorVoices,
  resolveActiveTailWindowId,
  resolveSelectedMonitorExplanationId,
} from "./liveLogMonitorStreamUpdateRuntime";
import { buildMonitorUpdateDerivation } from "./liveLogMonitorUpdateDerivationRuntime";
import {
  appendSyncTailRows,
  buildSyncTailRows,
  resolveBackgroundTrackSecond,
  type SyncTailRow,
} from "./liveLogMonitorPanelRuntime";
import { resolveBeatClockLiveSync, type BeatClock } from "./liveLogMonitorBeatRuntime";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
import type {
  ArrangementVoice,
  ComponentOverride,
  ResolvedLiveSonificationScene,
  RoutedLiveCue,
} from "./liveSonificationScene";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";

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

const MAX_RECENT_CUES = 8;
const MAX_RECENT_MARKERS = 6;
const MAX_RECENT_WARNINGS = 4;
const MAX_RECENT_EXPLANATIONS = 6;
const MAX_PARSED_LINES = 5;
const MAX_SYNC_TAIL_LINES = 60;

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

    if (input.sessionRepoId !== input.repositoryId) {
      input.logger.debug(
        "onStreamUpdate — skipped (repo mismatch session=%s vs panel=%s)",
        input.sessionRepoId,
        input.repositoryId,
      );
      return;
    }

    const currentDeck = input.backgroundDeckRef.current;
    const currentTrackSecond = resolveBackgroundTrackSecond(
      input.audioContextRef.current,
      currentDeck,
    );
    const updateDerivation = buildMonitorUpdateDerivation({
      update,
      scene: input.scene,
      knownComponents: input.knownComponentsRef.current,
      componentOverrides: input.componentOverrides,
      currentDeckTrackId: currentDeck?.trackId ?? null,
      availableTracks: input.availableTracks,
      currentTrackSecond,
      maxRecentExplanations: MAX_RECENT_EXPLANATIONS,
    });

    input.knownComponentsRef.current = updateDerivation.knownComponents;
    if (updateDerivation.knownComponentsChanged) {
      input.setKnownComponents(input.knownComponentsRef.current.slice());
    }
    const routedCues = updateDerivation.routedCues;
    const nextExplanations = updateDerivation.nextExplanations;

    startTransition(() => {
      input.setLastUpdate(update);
      input.setRecentWarnings(update.warnings.slice(0, MAX_RECENT_WARNINGS));
      input.setError(null);

      if (!update.hasData) {
        return;
      }

      const nextTailRows = buildSyncTailRows({
        update,
        maxParsedLines: MAX_PARSED_LINES,
      });

      if (nextTailRows.length > 0) {
        input.setSyncTailRows((current) =>
          appendSyncTailRows(current, nextTailRows, MAX_SYNC_TAIL_LINES),
        );
      }
      input.setActiveTailWindowId(resolveActiveTailWindowId(nextTailRows));

      if (update.anomalyCount > 0) {
        input.setIsAnomalyFlash(true);
        globalThis.setTimeout(() => input.setIsAnomalyFlash(false), 1200);
      }

      if (input.replayActive) {
        return;
      }

      input.setEmittedCueCount((current) => current + routedCues.length);
      input.setRecentCues((current) =>
        buildRecentCueHistory(current, routedCues, updateDerivation.primaryLine, MAX_RECENT_CUES),
      );
      input.setRecentMarkers((current) =>
        buildRecentMarkerHistory(current, update.anomalyMarkers, MAX_RECENT_MARKERS),
      );
      input.setRecentExplanations((current) =>
        buildRecentExplanationHistory(current, nextExplanations, MAX_RECENT_EXPLANATIONS),
      );
      if (typeof currentTrackSecond === "number") {
        input.setBackgroundPlayheadSecond(currentTrackSecond);
      }
      if (nextExplanations[0]) {
        input.setSelectedExplanationId((current) =>
          resolveSelectedMonitorExplanationId(current, nextExplanations, input.monitor.isPlayback),
        );
      }
      input.setRecentVoices(
        buildRecentMonitorVoices(routedCues, input.scene.mutationProfile.arrangementDepth, 12),
      );
    });

    if (update.hasData && !input.replayActive) {
      void input.ensureAudioReady();

      const beatClockSyncPlan = resolveBeatClockLiveSync({
        currentClock: input.beatClockRef.current,
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
      if (!input.panelAudioProbePlayedRef.current && input.backgroundDeckRef.current === null) {
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
