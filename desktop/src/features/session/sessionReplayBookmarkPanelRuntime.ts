import type { ComponentProps } from "react";

import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import { resolveReplayBookmarkTagLabel } from "../../config/replayBookmarks";
import { resolveMutationProfile, resolveStyleProfile } from "../../config/liveProfiles";
import type { AppTranslations } from "../../i18n/types";
import { formatShortDateTime } from "../../utils/date";
import { formatBpmLabel, formatDominantLevelLabel } from "../../utils/monitorLabels";
import type { ReplayFeedbackSummaryCard } from "../../components/ReplayFeedbackSummaryCard";
import type { SessionReplayBookmarkCard } from "./SessionReplayBookmarkCard";
import type {
  SessionReplayBookmarkContextState,
  SessionReplayBookmarkMetaState,
  SessionReplayBookmarkPanelHeaderState,
  SessionReplayBookmarkPanelSections,
} from "./sessionReplayBookmarkPanelContracts";
import type { SessionBookmarkContext } from "./sessionScreenRuntime";
import type { SessionReplayBookmarkPanelProps } from "./sessionReplayBookmarkPanelTypes";

export function buildSessionReplayBookmarkPanelHeader(input: {
  selectedSession: PersistedSession;
  t: AppTranslations;
}): SessionReplayBookmarkPanelHeaderState {
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
}): SessionReplayBookmarkMetaState {
  return {
    windowLabel: input.t.session.windowShort.replace(
      "{index}",
      String(input.bookmark.replayWindowIndex),
    ),
    note: input.bookmark.note || input.t.session.bookmarkNoNote,
    tags: [
      input.bookmark.bookmarkTag ? resolveReplayBookmarkTagLabel(input.bookmark.bookmarkTag) : null,
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
}): SessionReplayBookmarkContextState | null {
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

export function buildSessionReplayBookmarkCardProps(input: {
  bookmark: SessionBookmark;
  selectedSession: PersistedSession;
  bookmarkContext: SessionBookmarkContext | null;
  replayDisabled: boolean;
  t: AppTranslations;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => void | Promise<void>;
}): ComponentProps<typeof SessionReplayBookmarkCard> {
  const meta = buildSessionReplayBookmarkMeta({
    bookmark: input.bookmark,
    t: input.t,
  });
  const context = buildSessionReplayBookmarkContext({
    context: input.bookmarkContext,
    t: input.t,
  });

  return {
    label: input.bookmark.label,
    windowLabel: meta.windowLabel,
    note: meta.note,
    tags: meta.tags,
    replayLabel: input.t.session.replayHere,
    disabled: input.replayDisabled,
    context,
    onReplay: () => input.onReplayBookmark(input.selectedSession, input.bookmark.replayWindowIndex),
  };
}

export function buildSessionReplayBookmarkRecommendationProps(input: {
  recommendation: SessionReplayBookmarkPanelProps["selectedSessionReplayFeedbackRecommendation"];
  t: AppTranslations;
}): ComponentProps<typeof ReplayFeedbackSummaryCard> | null {
  return input.recommendation
    ? {
        recommendation: input.recommendation,
        title: input.t.session.recommendedMix,
        className: "top-spaced",
      }
    : null;
}

export function buildSessionReplayBookmarkCardPropsList(input: {
  selectedSession: PersistedSession;
  selectedSessionBookmarks: SessionBookmark[];
  bookmarkContexts: Record<number, SessionBookmarkContext>;
  replayDisabled: boolean;
  t: AppTranslations;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => void | Promise<void>;
}): Array<ComponentProps<typeof SessionReplayBookmarkCard>> {
  return input.selectedSessionBookmarks.map((bookmark) =>
    buildSessionReplayBookmarkCardProps({
      bookmark,
      selectedSession: input.selectedSession,
      bookmarkContext: input.bookmarkContexts[bookmark.id] ?? null,
      replayDisabled: input.replayDisabled,
      t: input.t,
      onReplayBookmark: input.onReplayBookmark,
    }),
  );
}

export function buildSessionReplayBookmarkPanelSections(
  input: SessionReplayBookmarkPanelProps & { t: AppTranslations },
): SessionReplayBookmarkPanelSections {
  const header = buildSessionReplayBookmarkPanelHeader({
    selectedSession: input.selectedSession,
    t: input.t,
  });
  const replayDisabled = resolveSessionReplayBookmarkDisabled({
    mutating: input.mutating,
    selectedSession: input.selectedSession,
  });

  return {
    header,
    replayDisabled,
    recommendationProps: buildSessionReplayBookmarkRecommendationProps({
      recommendation: input.selectedSessionReplayFeedbackRecommendation,
      t: input.t,
    }),
    bookmarkCardPropsList: buildSessionReplayBookmarkCardPropsList({
      selectedSession: input.selectedSession,
      selectedSessionBookmarks: input.selectedSessionBookmarks,
      bookmarkContexts: input.bookmarkContexts,
      replayDisabled,
      t: input.t,
      onReplayBookmark: input.onReplayBookmark,
    }),
    emptyLabel: input.t.session.noReplayNotesSavedYet,
  };
}
