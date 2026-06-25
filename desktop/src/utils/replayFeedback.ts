import type { SessionBookmark } from "../api/sessions";
import {
  DEFAULT_MUTATION_PROFILE_ID,
  DEFAULT_STYLE_PROFILE_ID,
  resolveMutationProfile,
  resolveStyleProfile,
} from "../config/liveProfiles";
import { resolveReplayBookmarkTagLabel } from "../config/replayBookmarks";

export interface ReplayFeedbackTagSummary {
  tag: string;
  label: string;
  count: number;
}

export interface ReplayFeedbackRecommendation {
  bookmarkCount: number;
  dominantTag: string | null;
  dominantTagLabel: string | null;
  suggestedStyleProfileId: string;
  suggestedMutationProfileId: string;
  summary: string;
  detail: string;
  isAligned: boolean;
  tagSummaries: ReplayFeedbackTagSummary[];
}

const QUIETER_TAGS = new Set(["too-noisy", "needs-space", "smooth-bed"]);
const STRONGER_TAGS = new Set(["good-alerting", "deploy-transition"]);

function pickMostFrequent(entries: readonly (string | null | undefined)[]): string | null {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    if (!entry) {
      continue;
    }
    counts.set(entry, (counts.get(entry) ?? 0) + 1);
  }

  let winner: string | null = null;
  let winnerCount = -1;
  for (const [value, count] of counts.entries()) {
    if (count > winnerCount) {
      winner = value;
      winnerCount = count;
    }
  }

  return winner;
}

function summarizeTags(bookmarks: readonly SessionBookmark[]): ReplayFeedbackTagSummary[] {
  const counts = new Map<string, number>();

  for (const bookmark of bookmarks) {
    if (!bookmark.bookmarkTag) {
      continue;
    }
    counts.set(bookmark.bookmarkTag, (counts.get(bookmark.bookmarkTag) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({
      tag,
      label: resolveReplayBookmarkTagLabel(tag) ?? tag,
      count,
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function inferStyleProfileId(dominantTag: string | null): string {
  switch (dominantTag) {
    case "too-noisy":
      return "deep-night";
    case "needs-space":
    case "smooth-bed":
      return "ambient-watch";
    case "deploy-transition":
      return "alert-techno";
    case "good-alerting":
      return "steady-house";
    default:
      return DEFAULT_STYLE_PROFILE_ID;
  }
}

function inferMutationProfileId(
  dominantTag: string | null,
  quieterCount: number,
  strongerCount: number,
): string {
  if (quieterCount > strongerCount) {
    return "subtle";
  }

  switch (dominantTag) {
    case "deploy-transition":
      return "reactive";
    case "good-alerting":
      return "balanced";
    case "smooth-bed":
    case "needs-space":
      return "subtle";
    default:
      return DEFAULT_MUTATION_PROFILE_ID;
  }
}

export function deriveReplayFeedbackRecommendation(
  bookmarks: readonly SessionBookmark[],
  options?: {
    currentStyleProfileId?: string | null;
    currentMutationProfileId?: string | null;
    labels?: {
      balancedSummary: string;
      balancedDetail: string;
      quieterSummary: string;
      quieterDetail: string;
      sharperSummary: string;
      sharperDetail: string;
      alertSummary: string;
      alertDetail: string;
      smoothSummary: string;
      smoothDetail: string;
    };
  },
): ReplayFeedbackRecommendation | null {
  if (bookmarks.length === 0) {
    return null;
  }

  const tagSummaries = summarizeTags(bookmarks);
  const dominantTag = tagSummaries[0]?.tag ?? null;
  const dominantTagLabel = tagSummaries[0]?.label ?? null;
  const quieterCount = tagSummaries
    .filter((entry) => QUIETER_TAGS.has(entry.tag))
    .reduce((sum, entry) => sum + entry.count, 0);
  const strongerCount = tagSummaries
    .filter((entry) => STRONGER_TAGS.has(entry.tag))
    .reduce((sum, entry) => sum + entry.count, 0);

  const suggestedStyleProfileId =
    pickMostFrequent(bookmarks.map((bookmark) => bookmark.suggestedStyleProfileId)) ??
    inferStyleProfileId(dominantTag);
  const suggestedMutationProfileId =
    pickMostFrequent(bookmarks.map((bookmark) => bookmark.suggestedMutationProfileId)) ??
    inferMutationProfileId(dominantTag, quieterCount, strongerCount);

  const styleLabel = resolveStyleProfile(suggestedStyleProfileId).label;
  const mutationLabel = resolveMutationProfile(suggestedMutationProfileId).label;
  const labels = options?.labels;
  const fill = (template: string, replacements: Record<string, string | number>) =>
    Object.entries(replacements).reduce(
      (output, [key, value]) => output.replace(`{${key}}`, String(value)),
      template,
    );

  let summary = labels?.balancedSummary ?? "Replay feedback is balanced.";
  let detail = labels?.balancedDetail
    ? fill(labels.balancedDetail, { style: styleLabel, mutation: mutationLabel })
    : `Saved windows point toward ${styleLabel} + ${mutationLabel} as the next team-monitoring mix.`;

  if (quieterCount > strongerCount) {
    summary = labels?.quieterSummary ?? "Replay feedback leans quieter.";
    detail = labels?.quieterDetail
      ? fill(labels.quieterDetail, {
          count: quieterCount,
          total: bookmarks.length,
          style: styleLabel,
          mutation: mutationLabel,
        })
      : `${quieterCount}/${bookmarks.length} notes asked for more space or a calmer bed. Recommend ${styleLabel} + ${mutationLabel}.`;
  } else if (dominantTag === "deploy-transition") {
    summary = labels?.sharperSummary ?? "Replay feedback favors sharper transitions.";
    detail = labels?.sharperDetail
      ? fill(labels.sharperDetail, { style: styleLabel, mutation: mutationLabel })
      : `Deploy-related windows felt strongest with ${styleLabel} + ${mutationLabel}.`;
  } else if (dominantTag === "good-alerting") {
    summary = labels?.alertSummary ?? "Replay feedback likes the current alert presence.";
    detail = labels?.alertDetail
      ? fill(labels.alertDetail, { style: styleLabel, mutation: mutationLabel })
      : `Alerting moments stayed readable without losing the groove. ${styleLabel} + ${mutationLabel} is the recommended carry-forward mix.`;
  } else if (dominantTag === "smooth-bed") {
    summary = labels?.smoothSummary ?? "Replay feedback favors a smoother bed.";
    detail = labels?.smoothDetail
      ? fill(labels.smoothDetail, { style: styleLabel, mutation: mutationLabel })
      : `The team kept bookmarking the calmer background shape. Recommend ${styleLabel} + ${mutationLabel}.`;
  }

  const isAligned =
    (options?.currentStyleProfileId ?? null) === suggestedStyleProfileId &&
    (options?.currentMutationProfileId ?? null) === suggestedMutationProfileId;

  return {
    bookmarkCount: bookmarks.length,
    dominantTag,
    dominantTagLabel,
    suggestedStyleProfileId,
    suggestedMutationProfileId,
    summary,
    detail,
    isAligned,
    tagSummaries,
  };
}
