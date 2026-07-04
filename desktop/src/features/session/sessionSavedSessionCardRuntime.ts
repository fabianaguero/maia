import type { AppTranslations } from "../../i18n/types";
import { formatShortDate } from "../../utils/date";
import { formatBpmLabel, resolveSessionStatusLabel } from "../../utils/monitorLabels";
import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import { resolveSessionTemplateLabel } from "./sessionDisplay";

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
    anomaliesValue: activeAndLive(input)
      ? input.liveTotalAnomalies
      : input.session.totalAnomalies,
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
    sourceLabel: input.session.sourceTitle || input.session.sourceId || input.t.session.unknownSource,
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
