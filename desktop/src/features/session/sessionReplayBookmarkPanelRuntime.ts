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
  SessionReplayBookmarkCardState,
  SessionReplayBookmarkContextState,
  SessionReplayBookmarkPanelDerivedState,
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

export function buildSessionReplayBookmarkCardState(input: {
  bookmark: SessionBookmark;
  bookmarkContext: SessionBookmarkContext | null;
  t: AppTranslations;
}): SessionReplayBookmarkCardState {
  return {
    label: input.bookmark.label,
    meta: buildSessionReplayBookmarkMeta({
      bookmark: input.bookmark,
      t: input.t,
    }),
    context: buildSessionReplayBookmarkContext({
      context: input.bookmarkContext,
      t: input.t,
    }),
  };
}

export function buildSessionReplayBookmarkCardProps(input: {
  bookmark: SessionBookmark;
  selectedSession: PersistedSession;
  bookmarkContext: SessionBookmarkContext | null;
  replayDisabled: boolean;
  t: AppTranslations;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => void | Promise<void>;
}): ComponentProps<typeof SessionReplayBookmarkCard> {
  const cardState = buildSessionReplayBookmarkCardState({
    bookmark: input.bookmark,
    bookmarkContext: input.bookmarkContext,
    t: input.t,
  });

  return {
    label: cardState.label,
    windowLabel: cardState.meta.windowLabel,
    note: cardState.meta.note,
    tags: cardState.meta.tags,
    replayLabel: input.t.session.replayHere,
    disabled: input.replayDisabled,
    context: cardState.context,
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

export function buildSessionReplayBookmarkCardPropsListFromState(input: {
  selectedSession: PersistedSession;
  selectedSessionBookmarks: SessionBookmark[];
  bookmarkCardStates: SessionReplayBookmarkCardState[];
  replayDisabled: boolean;
  t: AppTranslations;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => void | Promise<void>;
}): Array<ComponentProps<typeof SessionReplayBookmarkCard>> {
  return input.selectedSessionBookmarks.map((bookmark, index) => {
    const cardState =
      input.bookmarkCardStates[index] ??
      buildSessionReplayBookmarkCardState({
        bookmark,
        bookmarkContext: null,
        t: input.t,
      });

    return {
      label: cardState.label,
      windowLabel: cardState.meta.windowLabel,
      note: cardState.meta.note,
      tags: cardState.meta.tags,
      replayLabel: input.t.session.replayHere,
      disabled: input.replayDisabled,
      context: cardState.context,
      onReplay: () => input.onReplayBookmark(input.selectedSession, bookmark.replayWindowIndex),
    };
  });
}

export function buildSessionReplayBookmarkPanelDerivedState(
  input: SessionReplayBookmarkPanelProps & { t: AppTranslations },
): SessionReplayBookmarkPanelDerivedState {
  const replayDisabled = resolveSessionReplayBookmarkDisabled({
    mutating: input.mutating,
    selectedSession: input.selectedSession,
  });

  return {
    header: buildSessionReplayBookmarkPanelHeader({
      selectedSession: input.selectedSession,
      t: input.t,
    }),
    replayDisabled,
    recommendationProps: buildSessionReplayBookmarkRecommendationProps({
      recommendation: input.selectedSessionReplayFeedbackRecommendation,
      t: input.t,
    }),
    bookmarkCardStates: input.selectedSessionBookmarks.map((bookmark) =>
      buildSessionReplayBookmarkCardState({
        bookmark,
        bookmarkContext: input.bookmarkContexts[bookmark.id] ?? null,
        t: input.t,
      }),
    ),
    emptyLabel: input.t.session.noReplayNotesSavedYet,
  };
}

export function buildSessionReplayBookmarkPanelSections(
  input: SessionReplayBookmarkPanelProps & { t: AppTranslations },
): SessionReplayBookmarkPanelSections {
  const derivedState = buildSessionReplayBookmarkPanelDerivedState(input);

  return {
    header: derivedState.header,
    replayDisabled: derivedState.replayDisabled,
    recommendationProps: derivedState.recommendationProps,
    bookmarkCardPropsList: buildSessionReplayBookmarkCardPropsListFromState({
      selectedSession: input.selectedSession,
      selectedSessionBookmarks: input.selectedSessionBookmarks,
      bookmarkCardStates: derivedState.bookmarkCardStates,
      replayDisabled: derivedState.replayDisabled,
      t: input.t,
      onReplayBookmark: input.onReplayBookmark,
    }),
    emptyLabel: derivedState.emptyLabel,
  };
}
