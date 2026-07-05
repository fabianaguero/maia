import type { ComponentProps } from "react";

import type { AppTranslations } from "../../i18n/types";
import { formatShortDate } from "../../utils/date";
import { formatBpmLabel, resolveSessionStatusLabel } from "../../utils/monitorLabels";
import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import type { SessionSavedSessionCardActions } from "./SessionSavedSessionCardActions";
import type { SessionSavedSessionCardHeader } from "./SessionSavedSessionCardHeader";
import type { SessionSavedSessionCardMetrics } from "./SessionSavedSessionCardMetrics";
import { resolveSessionTemplateLabel } from "./sessionDisplay";
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

export function buildSessionSavedSessionCardMetrics(input: {
  session: PersistedSession;
  active: boolean;
  playbackActive: boolean;
  liveWindowCount: number;
  liveProcessedLines: number;
  liveTotalAnomalies: number;
  t: AppTranslations;
}) {
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
}) {
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
}) {
  return {
    showPlaybackAction: !input.active && input.session.totalPolls > 0,
    showResumeAction: !input.active,
    deleteDisabled: input.mutating || input.active,
  };
}

export function buildSessionSavedSessionCardSections(
  input: SessionSavedSessionCardProps & { t: AppTranslations },
) {
  const statusLabel = resolveSessionSavedSessionCardStatusLabel({
    session: input.session,
    playbackActive: input.playbackActive,
    t: input.t,
  });
  const metrics = buildSessionSavedSessionCardMetrics({
    session: input.session,
    active: input.active,
    playbackActive: input.playbackActive,
    liveWindowCount: input.liveWindowCount,
    liveProcessedLines: input.liveProcessedLines,
    liveTotalAnomalies: input.liveTotalAnomalies,
    t: input.t,
  });
  const meta = resolveSessionSavedSessionCardMeta({
    session: input.session,
    bookmarks: input.bookmarks,
    t: input.t,
  });
  const actions = resolveSessionSavedSessionCardActions({
    active: input.active,
    session: input.session,
    mutating: input.mutating,
  });
  const statusTone = `status-${input.session.status}${input.playbackActive ? " status-playback" : ""}`;

  return {
    statusTone,
    updatedAtLabel: meta.updatedAtLabel,
    headerProps: {
      selected: input.selected,
      active: input.active,
      sessionId: input.session.id,
      status: statusLabel,
      statusTone,
      title: meta.title,
      sourceLabel: meta.sourceLabel,
      baseLabel: meta.baseLabel,
      bookmarksLabel: meta.bookmarksLabel,
      baseLabelPrefix: input.t.session.baseLabel,
      onSelectSession: input.onSelectSession,
    } satisfies ComponentProps<typeof SessionSavedSessionCardHeader>,
    metricsProps: {
      pollsValue: metrics.pollsValue,
      linesValue: metrics.linesValue,
      anomaliesValue: metrics.anomaliesValue,
      bpmLabel: metrics.bpmLabel,
      templateLabel: metrics.templateLabel,
      pollsLabel: input.t.session.polls,
      linesLabel: input.t.session.lines,
      anomaliesLabel: input.t.session.anomalies,
    } satisfies ComponentProps<typeof SessionSavedSessionCardMetrics>,
    actionsProps: {
      session: input.session,
      mutating: input.mutating,
      showPlaybackAction: actions.showPlaybackAction,
      showResumeAction: actions.showResumeAction,
      deleteDisabled: actions.deleteDisabled,
      playbackLabel: input.t.session.playback,
      resumeLabel: input.t.session.resume,
      onResumeSession: input.onResumeSession,
      onPlaybackSession: input.onPlaybackSession,
      onDeleteSession: input.onDeleteSession,
    } satisfies ComponentProps<typeof SessionSavedSessionCardActions>,
  };
}
