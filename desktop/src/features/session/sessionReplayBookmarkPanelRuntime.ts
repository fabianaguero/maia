import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import { resolveReplayBookmarkTagLabel } from "../../config/replayBookmarks";
import { resolveMutationProfile, resolveStyleProfile } from "../../config/liveProfiles";
import type { AppTranslations } from "../../i18n/types";
import { formatShortDateTime } from "../../utils/date";
import { formatBpmLabel, formatDominantLevelLabel } from "../../utils/monitorLabels";
import type { SessionBookmarkContext } from "./sessionScreenRuntime";

export function buildSessionReplayBookmarkPanelHeader(input: {
  selectedSession: PersistedSession;
  t: AppTranslations;
}) {
  return {
    title: input.t.session.replayNotes,
    summary: input.t.session.replayNotesFor.replace(
      "{label}",
      input.selectedSession.label || input.t.session.unnamedSession,
    ),
  };
}

export function buildSessionReplayBookmarkMeta(input: {
  bookmark: SessionBookmark;
  t: AppTranslations;
}) {
  return {
    windowLabel: input.t.session.windowShort.replace(
      "{index}",
      String(input.bookmark.replayWindowIndex),
    ),
    note: input.bookmark.note || input.t.session.bookmarkNoNote,
    tags: [
      input.bookmark.bookmarkTag
        ? resolveReplayBookmarkTagLabel(input.bookmark.bookmarkTag)
        : null,
      input.bookmark.suggestedStyleProfileId
        ? resolveStyleProfile(input.bookmark.suggestedStyleProfileId).label
        : null,
      input.bookmark.suggestedMutationProfileId
        ? resolveMutationProfile(input.bookmark.suggestedMutationProfileId).label
        : null,
      formatShortDateTime(input.bookmark.updatedAt),
      input.bookmark.trackTitle ?? null,
      typeof input.bookmark.trackSecond === "number"
        ? `${input.bookmark.trackSecond.toFixed(2)}s`
        : null,
    ].filter(Boolean) as string[],
  };
}

export function buildSessionReplayBookmarkContext(input: {
  context: SessionBookmarkContext | null;
  t: AppTranslations;
}) {
  if (!input.context) {
    return null;
  }

  return {
    bpmLabel: formatBpmLabel(input.context.bpm),
    dominantLevelLabel: formatDominantLevelLabel(input.context.dominantLevel),
    anomalyLabel: input.t.session.bookmarkAnomalies.replace(
      "{count}",
      String(input.context.anomalyCount ?? 0),
    ),
    excerpt: input.context.logExcerpt ?? input.t.session.noLogExcerptAvailable,
  };
}

export function resolveSessionReplayBookmarkDisabled(input: {
  mutating: boolean;
  selectedSession: PersistedSession;
}) {
  return input.mutating || input.selectedSession.totalPolls === 0;
}
