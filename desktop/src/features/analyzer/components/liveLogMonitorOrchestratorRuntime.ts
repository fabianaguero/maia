import type { MutableRefObject } from "react";
import type { LiveLogMarker, LiveLogStreamUpdate, LibraryTrack } from "../../../types/library";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";
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
} from "./liveLogMonitorSyncRuntime";
import { resolveBeatClockLiveSync, type BeatClock } from "./liveLogMonitorBeatRuntime";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
import type {
  ArrangementVoice,
  ComponentOverride,
  ResolvedLiveSonificationScene,
  RoutedLiveCue,
} from "./liveSonificationScene";

export const LIVE_LOG_MONITOR_LIMITS = {
  recentCues: 8,
  recentMarkers: 6,
  recentWarnings: 4,
  recentExplanations: 6,
  parsedLines: 5,
  syncTailLines: 60,
  recentVoices: 12,
} as const;

export function shouldIgnoreLiveLogMonitorUpdate(input: {
  repositoryId: string;
  sessionRepoId: string | null;
}): boolean {
  return input.sessionRepoId !== input.repositoryId;
}

export function buildLiveLogMonitorDerivedUpdate(input: {
  update: LiveLogStreamUpdate;
  scene: ResolvedLiveSonificationScene;
  knownComponents: string[];
  componentOverrides: ReadonlyMap<string, ComponentOverride>;
  currentDeckTrackId: string | null;
  availableTracks: LibraryTrack[];
  currentTrackSecond: number | null;
}) {
  const updateDerivation = buildMonitorUpdateDerivation({
    update: input.update,
    scene: input.scene,
    knownComponents: input.knownComponents,
    componentOverrides: input.componentOverrides,
    currentDeckTrackId: input.currentDeckTrackId,
    availableTracks: input.availableTracks,
    currentTrackSecond: input.currentTrackSecond,
    maxRecentExplanations: LIVE_LOG_MONITOR_LIMITS.recentExplanations,
  });

  const nextTailRows = buildSyncTailRows({
    update: input.update,
    maxParsedLines: LIVE_LOG_MONITOR_LIMITS.parsedLines,
  });

  return {
    currentTrackSecond: input.currentTrackSecond,
    updateDerivation,
    nextTailRows,
    activeTailWindowId: resolveActiveTailWindowId(nextTailRows),
  };
}

export function buildLiveLogMonitorRecentWarnings(update: LiveLogStreamUpdate): string[] {
  return update.warnings.slice(0, LIVE_LOG_MONITOR_LIMITS.recentWarnings);
}

export function buildLiveLogMonitorSyncTailRowsUpdater(nextTailRows: SyncTailRow[]) {
  if (nextTailRows.length === 0) {
    return null;
  }

  return (current: SyncTailRow[]) =>
    appendSyncTailRows(current, nextTailRows, LIVE_LOG_MONITOR_LIMITS.syncTailLines);
}

export function buildLiveLogMonitorEmittedCueCountUpdater(routedCues: RoutedLiveCue[]) {
  return (current: number) => current + routedCues.length;
}

export function buildLiveLogMonitorRecentCuesUpdater(input: {
  routedCues: RoutedLiveCue[];
  primaryLine: string | null;
}) {
  return (current: RoutedLiveCue[]) =>
    buildRecentCueHistory(
      current,
      input.routedCues,
      input.primaryLine ?? "",
      LIVE_LOG_MONITOR_LIMITS.recentCues,
    );
}

export function buildLiveLogMonitorRecentMarkersUpdater(anomalyMarkers: LiveLogMarker[]) {
  return (current: LiveLogMarker[]) =>
    buildRecentMarkerHistory(current, anomalyMarkers, LIVE_LOG_MONITOR_LIMITS.recentMarkers);
}

export function buildLiveLogMonitorRecentExplanationsUpdater(
  nextExplanations: LiveMutationExplanation[],
) {
  return (current: LiveMutationExplanation[]) =>
    buildRecentExplanationHistory(
      current,
      nextExplanations,
      LIVE_LOG_MONITOR_LIMITS.recentExplanations,
    );
}

export function buildLiveLogMonitorSelectedExplanationUpdater(input: {
  nextExplanations: LiveMutationExplanation[];
  isPlayback: boolean;
}) {
  if (!input.nextExplanations[0]) {
    return null;
  }

  return (current: string | null) =>
    resolveSelectedMonitorExplanationId(current, input.nextExplanations, input.isPlayback);
}

export function buildLiveLogMonitorRecentVoices(
  routedCues: RoutedLiveCue[],
  arrangementDepth: ResolvedLiveSonificationScene["mutationProfile"]["arrangementDepth"],
): ArrangementVoice[] {
  return buildRecentMonitorVoices(
    routedCues,
    arrangementDepth,
    LIVE_LOG_MONITOR_LIMITS.recentVoices,
  );
}

export function resolveLiveLogMonitorCurrentTrackSecond(input: {
  audioContextRef: MutableRefObject<AudioContext | null>;
  backgroundDeckRef: MutableRefObject<BackgroundDeckState | null>;
}): number | null {
  return resolveBackgroundTrackSecond(input.audioContextRef.current, input.backgroundDeckRef.current);
}

export function buildLiveLogMonitorBeatClockPlan(input: {
  beatClockRef: MutableRefObject<BeatClock | null>;
  liveBpm: number | null | undefined;
  useBeatGrid: boolean;
  audioCurrentTime: number | null;
}) {
  return resolveBeatClockLiveSync({
    currentClock: input.beatClockRef.current,
    liveBpm: input.liveBpm,
    useBeatGrid: input.useBeatGrid,
    audioCurrentTime: input.audioCurrentTime,
  });
}

export function shouldPlayLiveLogMonitorPanelProbe(input: {
  panelAudioProbePlayed: boolean;
  hasBackgroundDeck: boolean;
}): boolean {
  return !input.panelAudioProbePlayed && !input.hasBackgroundDeck;
}
