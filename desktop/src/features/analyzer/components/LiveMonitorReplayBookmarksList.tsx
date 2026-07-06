import { resolveMutationProfile, resolveStyleProfile } from "../../../config/liveProfiles";
import { resolveReplayBookmarkTagLabel } from "../../../config/replayBookmarks";
import type { SessionBookmark } from "../../../api/sessions";
import { canApplyReplayBookmarkSuggestion } from "./liveMonitorReplayBookmarksCardRuntime";

interface LiveMonitorReplayBookmarksListProps {
  activeReplayBookmark: SessionBookmark | null;
  sortedSessionBookmarks: SessionBookmark[];
  playbackEventCount: number | null;
  bookmarkBusy: boolean;
  labels: {
    replayWindowShort: string;
    noNoteYet: string;
    loadScene: string;
    delete: string;
    deleteReplayBookmark: string;
    noReplayBookmarks: string;
  };
  onJumpToBookmark: (bookmark: SessionBookmark) => void;
  onApplyBookmarkSuggestion: (bookmark: SessionBookmark) => void;
  onDeleteBookmark: (bookmark: SessionBookmark) => void;
}

export function LiveMonitorReplayBookmarksList({
  activeReplayBookmark,
  sortedSessionBookmarks,
  playbackEventCount,
  bookmarkBusy,
  labels,
  onJumpToBookmark,
  onApplyBookmarkSuggestion,
  onDeleteBookmark,
}: LiveMonitorReplayBookmarksListProps) {
  if (sortedSessionBookmarks.length === 0) {
    return <small className="replay-bookmark-empty">{labels.noReplayBookmarks}</small>;
  }

  return (
    <div className="replay-bookmark-list">
      {sortedSessionBookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className={`replay-bookmark-item${activeReplayBookmark?.id === bookmark.id ? " active" : ""}`}
        >
          <button
            type="button"
            className="replay-bookmark-jump"
            onClick={() => onJumpToBookmark(bookmark)}
            disabled={playbackEventCount === null}
          >
            <div className="replay-bookmark-head">
              <strong>{bookmark.label}</strong>
              <span>
                {labels.replayWindowShort.replace("{index}", String(bookmark.replayWindowIndex))}
              </span>
            </div>
            {bookmark.note ? <p>{bookmark.note}</p> : <p>{labels.noNoteYet}</p>}
            <div className="replay-bookmark-meta">
              {bookmark.bookmarkTag ? (
                <span>{resolveReplayBookmarkTagLabel(bookmark.bookmarkTag)}</span>
              ) : null}
              {bookmark.suggestedStyleProfileId ? (
                <span>{resolveStyleProfile(bookmark.suggestedStyleProfileId).label}</span>
              ) : null}
              {bookmark.suggestedMutationProfileId ? (
                <span>{resolveMutationProfile(bookmark.suggestedMutationProfileId).label}</span>
              ) : null}
              {bookmark.trackTitle ? <span>{bookmark.trackTitle}</span> : null}
              {typeof bookmark.trackSecond === "number" ? (
                <span>{bookmark.trackSecond.toFixed(2)}s</span>
              ) : null}
            </div>
          </button>
          {canApplyReplayBookmarkSuggestion(bookmark) ? (
            <button
              type="button"
              className="secondary-action replay-bookmark-apply"
              onClick={() => onApplyBookmarkSuggestion(bookmark)}
            >
              {labels.loadScene}
            </button>
          ) : null}
          <button
            type="button"
            className="replay-bookmark-delete"
            onClick={() => onDeleteBookmark(bookmark)}
            disabled={bookmarkBusy}
            aria-label={labels.deleteReplayBookmark.replace("{label}", bookmark.label)}
          >
            {labels.delete}
          </button>
        </div>
      ))}
    </div>
  );
}
