import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { LiveLogMarker, LiveLogStreamUpdate } from "../../../types/library";
import type { MutationArrangementDepth } from "../../../types/music";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";
import type { ArrangementVoice, RoutedLiveCue } from "./liveSonificationScene";
import type { SyncTailRow } from "./liveLogMonitorSyncRuntime";
import type { BeatClock } from "./liveLogMonitorBeatRuntime";
import {
  buildLiveLogMonitorBeatClockPlan,
  buildLiveLogMonitorEmittedCueCountUpdater,
  buildLiveLogMonitorRecentCuesUpdater,
  buildLiveLogMonitorRecentExplanationsUpdater,
  buildLiveLogMonitorRecentMarkersUpdater,
  buildLiveLogMonitorRecentVoices,
  buildLiveLogMonitorRecentWarnings,
  buildLiveLogMonitorSelectedExplanationUpdater,
  buildLiveLogMonitorSyncTailRowsUpdater,
  shouldPlayLiveLogMonitorPanelProbe,
} from "./liveLogMonitorOrchestratorRuntime";
import type { buildLiveLogMonitorDerivedUpdate } from "./liveLogMonitorOrchestratorRuntime";

type LiveLogMonitorDerivedUpdate = ReturnType<typeof buildLiveLogMonitorDerivedUpdate>;

export function buildIdleLiveLogMonitorUpdate(update: LiveLogStreamUpdate): LiveLogStreamUpdate {
  return {
    ...update,
    lineCount: 0,
    anomalyCount: 0,
    levelCounts: {},
    anomalyMarkers: [],
    sonificationCues: [],
    warnings: [],
  };
}

export interface ApplyLiveLogMonitorVisualUpdateInput {
  update: LiveLogStreamUpdate;
  derivedUpdate: LiveLogMonitorDerivedUpdate;
  currentTrackSecond: number | null;
  replayActive: boolean;
  isPlayback: boolean;
  arrangementDepth: MutationArrangementDepth;
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
  scheduleAnomalyFlashReset: () => void;
}

export function applyLiveLogMonitorVisualUpdate(input: ApplyLiveLogMonitorVisualUpdateInput): void {
  input.setLastUpdate(input.update);
  input.setRecentWarnings(buildLiveLogMonitorRecentWarnings(input.update));
  input.setError(null);

  if (!input.update.hasData) {
    return;
  }

  const syncTailRowsUpdater = buildLiveLogMonitorSyncTailRowsUpdater(
    input.derivedUpdate.nextTailRows,
  );
  if (syncTailRowsUpdater) {
    input.setSyncTailRows(syncTailRowsUpdater);
  }
  input.setActiveTailWindowId(input.derivedUpdate.activeTailWindowId);

  if (input.update.anomalyCount > 0) {
    input.setIsAnomalyFlash(true);
    input.scheduleAnomalyFlashReset();
  }

  if (input.replayActive) {
    return;
  }

  const routedCues = input.derivedUpdate.updateDerivation.routedCues;
  const nextExplanations = input.derivedUpdate.updateDerivation.nextExplanations;

  input.setEmittedCueCount(buildLiveLogMonitorEmittedCueCountUpdater(routedCues));
  input.setRecentCues(
    buildLiveLogMonitorRecentCuesUpdater({
      routedCues,
      primaryLine: input.derivedUpdate.updateDerivation.primaryLine,
    }),
  );
  input.setRecentMarkers(buildLiveLogMonitorRecentMarkersUpdater(input.update.anomalyMarkers));
  input.setRecentExplanations(buildLiveLogMonitorRecentExplanationsUpdater(nextExplanations));

  if (typeof input.currentTrackSecond === "number") {
    input.setBackgroundPlayheadSecond(input.currentTrackSecond);
  }

  const selectedExplanationUpdater = buildLiveLogMonitorSelectedExplanationUpdater({
    nextExplanations,
    isPlayback: input.isPlayback,
  });
  if (selectedExplanationUpdater) {
    input.setSelectedExplanationId(selectedExplanationUpdater);
  }

  input.setRecentVoices(buildLiveLogMonitorRecentVoices(routedCues, input.arrangementDepth));
}

export interface ApplyLiveLogMonitorPlaybackUpdateInput {
  update: LiveLogStreamUpdate;
  replayActive: boolean;
  panelAudioProbePlayedRef: MutableRefObject<boolean>;
  hasBackgroundDeck: boolean;
  beatClockRef: MutableRefObject<BeatClock | null>;
  useBeatGrid: boolean;
  audioCurrentTime: number | null;
  setBeatClockBpm: Dispatch<SetStateAction<number | null>>;
  ensureAudioReady: () => Promise<AudioContext | null>;
  playPanelTestTone: () => Promise<void>;
  playWithCurrentEngine: (cues: RoutedLiveCue[], liveBpm?: number | null) => void;
  applyLogModulation: (update: LiveLogStreamUpdate) => void;
  logger: {
    info: (message: string, ...args: unknown[]) => void;
  };
  derivedUpdate: LiveLogMonitorDerivedUpdate;
}

export function applyLiveLogMonitorPlaybackUpdate(
  input: ApplyLiveLogMonitorPlaybackUpdateInput,
): void {
  if (input.replayActive) {
    return;
  }

  if (!input.update.hasData) {
    input.applyLogModulation(buildIdleLiveLogMonitorUpdate(input.update));
    return;
  }

  const routedCues = input.derivedUpdate.updateDerivation.routedCues;

  void input.ensureAudioReady();

  const beatClockSyncPlan = buildLiveLogMonitorBeatClockPlan({
    beatClockRef: input.beatClockRef,
    liveBpm: input.update.suggestedBpm,
    useBeatGrid: input.useBeatGrid,
    audioCurrentTime: input.audioCurrentTime,
  });
  if (beatClockSyncPlan.changed) {
    input.beatClockRef.current = beatClockSyncPlan.nextClock;
    input.setBeatClockBpm(beatClockSyncPlan.nextDisplayBpm);
  }

  input.logger.info(
    "onStreamUpdate → playing %d routed cues, bpm=%s",
    routedCues.length,
    input.update.suggestedBpm,
  );

  if (
    shouldPlayLiveLogMonitorPanelProbe({
      panelAudioProbePlayed: input.panelAudioProbePlayedRef.current,
      hasBackgroundDeck: input.hasBackgroundDeck,
    })
  ) {
    input.panelAudioProbePlayedRef.current = true;
    void input.playPanelTestTone();
  }

  input.playWithCurrentEngine(routedCues, input.update.suggestedBpm);
  input.applyLogModulation(input.update);
}
