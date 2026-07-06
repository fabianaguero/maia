import type { ComponentProps } from "react";

import type { SessionBoothDetailGrid } from "./SessionBoothDetailGrid";
import type { SessionBoothHeader } from "./SessionBoothHeader";
import type { SessionBoothProgress } from "./SessionBoothProgress";
import type { SessionBoothRouteGrid } from "./SessionBoothRouteGrid";
import type {
  SessionBoothDetailInput,
  SessionBoothDetailLabels,
  SessionBoothHeaderInput,
  SessionBoothHeaderLabels,
  SessionBoothPanelDerivedState,
  SessionBoothPanelSections,
  SessionBoothProgressInput,
  SessionBoothRouteInput,
  SessionBoothRouteLabels,
} from "./sessionBoothPanelContracts";
import type { SessionBoothPanelProps } from "./sessionBoothPanelTypes";

export function buildSessionBoothHeaderLabels(
  t: SessionBoothHeaderInput["t"],
): SessionBoothHeaderLabels {
  return {
    prevWindow: t.session.prevWindow,
    nextWindow: t.session.nextWindow,
    resumeReplay: t.session.resumeReplay,
    pauseReplay: t.session.pauseReplay,
    exitReplay: t.session.exitReplay,
    stopSession: t.session.stopSession,
    pastePath: t.session.pastePath,
    launching: t.session.launching,
    launch: t.session.launch,
    resumeSelected: t.session.resumeSelected,
    replaySelected: t.session.replaySelected,
    startSession: t.session.startSession,
  };
}

export function buildSessionBoothRouteLabels(
  t: SessionBoothRouteInput["t"],
): SessionBoothRouteLabels {
  return {
    sourceFeed: t.session.sourceFeed,
    baseBed: t.session.baseBed,
    adapter: t.session.adapter,
    notSelected: t.session.notSelected,
    pickSourceHint: t.session.pickSourceHint,
    notArmed: t.session.notArmed,
    baseBedHint: t.session.baseBedHint,
    sessionRef: t.session.sessionRef,
    readyToLaunchMode: t.session.readyToLaunchMode,
    logFile: t.session.logFile,
    repository: t.session.repository,
  };
}

export function buildSessionBoothDetailLabels(
  t: SessionBoothDetailInput["t"],
): SessionBoothDetailLabels {
  return {
    signalSnapshot: t.session.signalSnapshot,
    latestWindowLines: t.session.latestWindowLines,
    waitingStreamData: t.session.waitingStreamData,
    awaitingInput: t.session.awaitingInput,
    noLevelBreakdown: t.session.noLevelBreakdown,
    topComponentsSoon: t.session.topComponentsSoon,
    replayNotes: t.session.replayNotes,
    watchouts: t.session.watchouts,
    latestWindowAnomalies: t.session.latestWindowAnomalies,
    noCurrentBurst: t.session.noCurrentBurst,
    runBoothHint: t.session.runBoothHint,
    sourceActiveHint: t.session.sourceActiveHint,
  };
}

export function buildSessionBoothPanelDerivedState(
  input: SessionBoothPanelProps & { t: SessionBoothHeaderInput["t"] },
): SessionBoothPanelDerivedState {
  return {
    labels: {
      header: buildSessionBoothHeaderLabels(input.t),
      route: buildSessionBoothRouteLabels(input.t),
      detail: buildSessionBoothDetailLabels(input.t),
    },
    progressVisible: input.playbackActive || input.liveMonitorActive,
  };
}

export function buildSessionBoothHeaderProps(
  input: SessionBoothHeaderInput,
): ComponentProps<typeof SessionBoothHeader> {
  return {
    stateTone: input.booth.state.tone,
    stateLabel: input.booth.state.label,
    eyebrowLabel: input.t.session.liveBooth,
    headline: input.booth.headline,
    summary: input.booth.summary,
    playbackActive: input.playbackActive,
    liveMonitorActive: input.liveMonitorActive,
    mutating: input.mutating,
    readyToRun: input.readyToRun,
    isPlaybackPaused: input.isPlaybackPaused,
    directPath: input.directPath,
    isDirectLoading: input.isDirectLoading,
    selectedSession: input.selectedSession,
    creating: input.creating,
    labels: buildSessionBoothHeaderLabels(input.t),
    onDirectPathChange: input.onDirectPathChange,
    onDirectLaunch: input.onDirectLaunch,
    onResumeSelected: input.onResumeSelected,
    onReplaySelected: input.onReplaySelected,
    onCreateSession: input.onCreateSession,
    onStepPlaybackWindow: input.onStepPlaybackWindow,
    onToggleReplayPlayback: input.onToggleReplayPlayback,
    onStopSession: input.onStopSession,
  };
}

export function buildSessionBoothProgressProps(
  input: SessionBoothProgressInput,
): ComponentProps<typeof SessionBoothProgress> {
  return {
    visible: input.playbackActive || input.liveMonitorActive,
    progressAriaLabel: input.booth.progressAriaLabel,
    progressWidth: input.booth.progressWidth,
  };
}

export function buildSessionBoothRouteProps(
  input: SessionBoothRouteInput,
): ComponentProps<typeof SessionBoothRouteGrid> {
  return {
    booth: input.booth,
    monitorSessionId: input.monitorSessionId,
    mode: input.mode,
    labels: buildSessionBoothRouteLabels(input.t),
  };
}

export function buildSessionBoothDetailProps(
  input: SessionBoothDetailInput,
): ComponentProps<typeof SessionBoothDetailGrid> {
  return {
    booth: input.booth,
    latestUpdate: input.latestUpdate,
    playbackActive: input.playbackActive,
    readyToRun: input.readyToRun,
    labels: buildSessionBoothDetailLabels(input.t),
  };
}

export function buildSessionBoothPanelSections(
  input: SessionBoothPanelProps & { t: SessionBoothHeaderInput["t"] },
): SessionBoothPanelSections {
  const derivedState = buildSessionBoothPanelDerivedState(input);

  return {
    headerProps: {
      ...buildSessionBoothHeaderProps(input),
      labels: derivedState.labels.header,
    },
    progressProps: {
      ...buildSessionBoothProgressProps(input),
      visible: derivedState.progressVisible,
    },
    routeProps: {
      ...buildSessionBoothRouteProps(input),
      labels: derivedState.labels.route,
    },
    detailProps: {
      ...buildSessionBoothDetailProps(input),
      labels: derivedState.labels.detail,
    },
    stats: input.booth.stats,
  };
}
