import type { ComponentProps } from "react";

import type { AppTranslations } from "../../i18n/types";
import { formatShortDate } from "../../utils/date";
import { formatBpmLabel, resolveSessionStatusLabel } from "../../utils/monitorLabels";
import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import type { SessionSavedSessionCardActions } from "./SessionSavedSessionCardActions";
import type { SessionSavedSessionCardHeader } from "./SessionSavedSessionCardHeader";
import type { SessionSavedSessionCardMetrics } from "./SessionSavedSessionCardMetrics";
import { resolveSessionTemplateLabel } from "./sessionDisplay";
import type {
  SessionSavedSessionCardActionsState,
  SessionSavedSessionCardDerivedState,
  SessionSavedSessionCardMetaState,
  SessionSavedSessionCardMetricsState,
  SessionSavedSessionCardSections,
  SessionSavedSessionCardStatusState,
} from "./sessionSavedSessionCardContracts";
import type { SessionSavedSessionCardProps } from "./sessionSavedSessionCardTypes";

export function resolveSessionSavedSessionCardStatusLabel(input: {
  session: PersistedSession;
  playbackActive: boolean;
  t: AppTranslations;
}): string {
  return input.playbackActive
    ? input.t.session.replay
    : resolveSessionStatusLabel(input.session.status, input.t);
}

export function buildSessionSavedSessionCardStatusState(input: {
  session: PersistedSession;
  playbackActive: boolean;
  t: AppTranslations;
}): SessionSavedSessionCardStatusState {
  return {
    statusLabel: resolveSessionSavedSessionCardStatusLabel(input),
    statusTone: `status-${input.session.status}${input.playbackActive ? " status-playback" : ""}`,
  };
}

export function buildSessionSavedSessionCardMetrics(input: {
  session: PersistedSession;
  active: boolean;
  playbackActive: boolean;
  liveWindowCount: number;
  liveProcessedLines: number;
  liveTotalAnomalies: number;
  t: AppTranslations;
}): SessionSavedSessionCardMetricsState {
  return {
    pollsValue: activeAndLive(input) ? input.liveWindowCount : input.session.totalPolls,
    linesValue: activeAndLive(input) ? input.liveProcessedLines : input.session.totalLines,
    anomaliesValue: activeAndLive(input) ? input.liveTotalAnomalies : input.session.totalAnomalies,
    bpmLabel: formatBpmLabel(input.session.lastBpm),
    templateLabel: resolveSessionTemplateLabel(
      input.session.sourceTemplateId,
      input.t,
      input.t.session.noTemplate,
      input.t.session.unknownTemplate,
    ),
  };
}

function activeAndLive(input: { active: boolean; playbackActive: boolean }) {
  return input.active && !input.playbackActive;
}

export function resolveSessionSavedSessionCardMeta(input: {
  session: PersistedSession;
  bookmarks: SessionBookmark[];
  t: AppTranslations;
}): SessionSavedSessionCardMetaState {
  return {
    title: input.session.label || input.t.session.unnamedSession,
    sourceLabel:
      input.session.sourceTitle || input.session.sourceId || input.t.session.unknownSource,
    baseLabel: input.session.playlistName || input.session.trackTitle,
    bookmarksLabel:
      input.bookmarks.length > 0
        ? input.t.session.replayNotesCount.replace("{count}", String(input.bookmarks.length))
        : null,
    updatedAtLabel: formatShortDate(input.session.updatedAt),
  };
}

export function resolveSessionSavedSessionCardActions(input: {
  active: boolean;
  session: PersistedSession;
  mutating: boolean;
}): SessionSavedSessionCardActionsState {
  return {
    showPlaybackAction: !input.active && input.session.totalPolls > 0,
    showResumeAction: !input.active,
    deleteDisabled: input.mutating || input.active,
  };
}

export function buildSessionSavedSessionCardDerivedState(
  input: SessionSavedSessionCardProps & { t: AppTranslations },
): SessionSavedSessionCardDerivedState {
  return {
    status: buildSessionSavedSessionCardStatusState({
      session: input.session,
      playbackActive: input.playbackActive,
      t: input.t,
    }),
    metrics: buildSessionSavedSessionCardMetrics({
      session: input.session,
      active: input.active,
      playbackActive: input.playbackActive,
      liveWindowCount: input.liveWindowCount,
      liveProcessedLines: input.liveProcessedLines,
      liveTotalAnomalies: input.liveTotalAnomalies,
      t: input.t,
    }),
    meta: resolveSessionSavedSessionCardMeta({
      session: input.session,
      bookmarks: input.bookmarks,
      t: input.t,
    }),
    actions: resolveSessionSavedSessionCardActions({
      active: input.active,
      session: input.session,
      mutating: input.mutating,
    }),
  };
}

export function buildSessionSavedSessionCardHeaderProps(input: {
  session: PersistedSession;
  selected: boolean;
  active: boolean;
  statusLabel: string;
  statusTone: string;
  meta: SessionSavedSessionCardMetaState;
  t: AppTranslations;
  onSelectSession: (sessionId: string) => void;
}): ComponentProps<typeof SessionSavedSessionCardHeader> {
  return {
    selected: input.selected,
    active: input.active,
    sessionId: input.session.id,
    status: input.statusLabel,
    statusTone: input.statusTone,
    title: input.meta.title,
    sourceLabel: input.meta.sourceLabel,
    baseLabel: input.meta.baseLabel,
    bookmarksLabel: input.meta.bookmarksLabel,
    baseLabelPrefix: input.t.session.baseLabel,
    onSelectSession: input.onSelectSession,
  };
}

export function buildSessionSavedSessionCardMetricsProps(input: {
  metrics: SessionSavedSessionCardMetricsState;
  t: AppTranslations;
}): ComponentProps<typeof SessionSavedSessionCardMetrics> {
  return {
    pollsValue: input.metrics.pollsValue,
    linesValue: input.metrics.linesValue,
    anomaliesValue: input.metrics.anomaliesValue,
    bpmLabel: input.metrics.bpmLabel,
    templateLabel: input.metrics.templateLabel,
    pollsLabel: input.t.session.polls,
    linesLabel: input.t.session.lines,
    anomaliesLabel: input.t.session.anomalies,
  };
}

export function buildSessionSavedSessionCardActionsProps(input: {
  session: PersistedSession;
  mutating: boolean;
  actions: SessionSavedSessionCardActionsState;
  t: AppTranslations;
  onResumeSession: (sessionId: string) => void | Promise<void>;
  onPlaybackSession: (session: PersistedSession) => void | Promise<void>;
  onDeleteSession: (sessionId: string) => void | Promise<void>;
}): ComponentProps<typeof SessionSavedSessionCardActions> {
  return {
    session: input.session,
    mutating: input.mutating,
    showPlaybackAction: input.actions.showPlaybackAction,
    showResumeAction: input.actions.showResumeAction,
    deleteDisabled: input.actions.deleteDisabled,
    playbackLabel: input.t.session.playback,
    resumeLabel: input.t.session.resume,
    onResumeSession: input.onResumeSession,
    onPlaybackSession: input.onPlaybackSession,
    onDeleteSession: input.onDeleteSession,
  };
}

export function buildSessionSavedSessionCardSections(
  input: SessionSavedSessionCardProps & { t: AppTranslations },
): SessionSavedSessionCardSections {
  const derivedState = buildSessionSavedSessionCardDerivedState(input);

  return {
    statusTone: derivedState.status.statusTone,
    updatedAtLabel: derivedState.meta.updatedAtLabel,
    headerProps: buildSessionSavedSessionCardHeaderProps({
      session: input.session,
      selected: input.selected,
      active: input.active,
      statusLabel: derivedState.status.statusLabel,
      statusTone: derivedState.status.statusTone,
      meta: derivedState.meta,
      t: input.t,
      onSelectSession: input.onSelectSession,
    }),
    metricsProps: buildSessionSavedSessionCardMetricsProps({
      metrics: derivedState.metrics,
      t: input.t,
    }),
    actionsProps: buildSessionSavedSessionCardActionsProps({
      session: input.session,
      mutating: input.mutating,
      actions: derivedState.actions,
      t: input.t,
      onResumeSession: input.onResumeSession,
      onPlaybackSession: input.onPlaybackSession,
      onDeleteSession: input.onDeleteSession,
    }),
  };
}
