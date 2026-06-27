import type { SessionBookmark } from "../../../api/sessions";
import { resolveReplayProgressForWindow } from "../../../utils/replay";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";

interface ResolveTraceExplanationSelectionInput {
  replayActive: boolean;
  playbackEventCount: number | null;
  explanation: LiveMutationExplanation;
}

interface TraceExplanationSelectionState {
  shouldPausePlayback: boolean;
  nextPlaybackProgress: number | null;
  nextSelectedExplanationId: string;
  nextBackgroundPlayheadSecond: number | null;
}

interface ResolveBookmarkJumpStateInput {
  playbackEventCount: number | null;
  bookmark: SessionBookmark;
  bookmarkExplanation: LiveMutationExplanation | null;
}

interface BookmarkJumpState {
  shouldPausePlayback: boolean;
  nextPlaybackProgress: number | null;
  nextSelectedExplanationId: string | null;
  nextBackgroundPlayheadSecond: number | null;
}

export function resolveTraceExplanationSelection(
  input: ResolveTraceExplanationSelectionInput,
): TraceExplanationSelectionState {
  const shouldSeek =
    input.replayActive &&
    input.explanation.replayWindowIndex !== null &&
    input.playbackEventCount !== null;

  return {
    shouldPausePlayback: shouldSeek,
    nextPlaybackProgress: shouldSeek
      ? resolveReplayProgressForWindow(
          input.explanation.replayWindowIndex!,
          input.playbackEventCount!,
        )
      : null,
    nextSelectedExplanationId: input.explanation.id,
    nextBackgroundPlayheadSecond:
      typeof input.explanation.trackSecond === "number" ? input.explanation.trackSecond : null,
  };
}

export function resolveBookmarkJumpState(
  input: ResolveBookmarkJumpStateInput,
): BookmarkJumpState | null {
  if (input.playbackEventCount === null) {
    return null;
  }

  return {
    shouldPausePlayback: true,
    nextPlaybackProgress: resolveReplayProgressForWindow(
      input.bookmark.replayWindowIndex,
      input.playbackEventCount,
    ),
    nextSelectedExplanationId: input.bookmarkExplanation?.id ?? null,
    nextBackgroundPlayheadSecond:
      typeof input.bookmark.trackSecond === "number" ? input.bookmark.trackSecond : null,
  };
}
