import type { ChangeEventHandler } from "react";
import {
  MUTATION_PROFILES,
  STYLE_PROFILES,
  resolveMutationProfile,
  resolveStyleProfile,
} from "../../../config/liveProfiles";
import {
  REPLAY_BOOKMARK_TAGS,
  resolveReplayBookmarkTagLabel,
} from "../../../config/replayBookmarks";
import type { SessionBookmark } from "../../../api/sessions";

interface LiveMonitorReplayBookmarksCardProps {
  replayWindowIndex: number;
  activeReplayBookmark: SessionBookmark | null;
  sortedSessionBookmarks: SessionBookmark[];
  playbackEventCount: number | null;
  bookmarkLabelDraft: string;
  bookmarkNoteDraft: string;
  bookmarkTagDraft: string | null;
  bookmarkStyleProfileIdDraft: string | null;
  bookmarkMutationProfileIdDraft: string | null;
  bookmarkBusy: boolean;
  bookmarkError: string | null;
  onBookmarkLabelChange: ChangeEventHandler<HTMLInputElement>;
  onBookmarkNoteChange: ChangeEventHandler<HTMLTextAreaElement>;
  onBookmarkTagToggle: (tagId: string) => void;
  onBookmarkStyleProfileChange: ChangeEventHandler<HTMLSelectElement>;
  onBookmarkMutationProfileChange: ChangeEventHandler<HTMLSelectElement>;
  onCaptureCurrentScene: () => void;
  onSaveBookmark: () => void;
  onDeleteCurrentBookmark: () => void;
  onJumpToBookmark: (bookmark: SessionBookmark) => void;
  onApplyBookmarkSuggestion: (bookmark: SessionBookmark) => void;
  onDeleteBookmark: (bookmark: SessionBookmark) => void;
}

export function LiveMonitorReplayBookmarksCard({
  replayWindowIndex,
  activeReplayBookmark,
  sortedSessionBookmarks,
  playbackEventCount,
  bookmarkLabelDraft,
  bookmarkNoteDraft,
  bookmarkTagDraft,
  bookmarkStyleProfileIdDraft,
  bookmarkMutationProfileIdDraft,
  bookmarkBusy,
  bookmarkError,
  onBookmarkLabelChange,
  onBookmarkNoteChange,
  onBookmarkTagToggle,
  onBookmarkStyleProfileChange,
  onBookmarkMutationProfileChange,
  onCaptureCurrentScene,
  onSaveBookmark,
  onDeleteCurrentBookmark,
  onJumpToBookmark,
  onApplyBookmarkSuggestion,
  onDeleteBookmark,
}: LiveMonitorReplayBookmarksCardProps) {
  return (
    <div className="audio-path-card audio-path-card--replay top-spaced">
      <span>Replay bookmarks</span>
      <strong>
        {activeReplayBookmark ? `Window ${replayWindowIndex} saved` : `Mark window ${replayWindowIndex}`}
      </strong>
      <small>
        Save notes on replay windows that sounded right, too noisy, or deserve a different
        preset later.
      </small>
      <div className="replay-bookmark-form">
        <label>
          <span className="field-label">Label</span>
          <input
            className="field-input"
            type="text"
            value={bookmarkLabelDraft}
            onChange={onBookmarkLabelChange}
            placeholder={`Window ${replayWindowIndex}`}
          />
        </label>
        <label>
          <span className="field-label">Note</span>
          <textarea
            className="field-input replay-bookmark-textarea"
            rows={3}
            value={bookmarkNoteDraft}
            onChange={onBookmarkNoteChange}
            placeholder="Why this window matters for the team's background mix."
          />
        </label>
        <div className="replay-bookmark-tag-strip">
          {REPLAY_BOOKMARK_TAGS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`replay-bookmark-tag${bookmarkTagDraft === option.id ? " active" : ""}`}
              onClick={() => onBookmarkTagToggle(option.id)}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="replay-bookmark-preset-grid">
          <label>
            <span className="field-label">Suggested style</span>
            <select
              className="field-input"
              value={bookmarkStyleProfileIdDraft ?? ""}
              onChange={onBookmarkStyleProfileChange}
            >
              <option value="">No style hint</option>
              {STYLE_PROFILES.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">Suggested mutation</span>
            <select
              className="field-input"
              value={bookmarkMutationProfileIdDraft ?? ""}
              onChange={onBookmarkMutationProfileChange}
            >
              <option value="">No mutation hint</option>
              {MUTATION_PROFILES.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {bookmarkError ? <p className="replay-bookmark-error">{bookmarkError}</p> : null}
        <div className="replay-bookmark-actions">
          <button
            type="button"
            className="secondary-action"
            onClick={onCaptureCurrentScene}
            disabled={bookmarkBusy}
          >
            Capture current scene
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={onSaveBookmark}
            disabled={bookmarkBusy}
          >
            {bookmarkBusy ? "Saving…" : activeReplayBookmark ? "Update window note" : "Save window note"}
          </button>
          {activeReplayBookmark ? (
            <button
              type="button"
              className="secondary-action replay-bookmark-delete-current"
              onClick={onDeleteCurrentBookmark}
              disabled={bookmarkBusy}
            >
              Delete current
            </button>
          ) : null}
        </div>
      </div>
      {sortedSessionBookmarks.length > 0 ? (
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
                  <span>W{bookmark.replayWindowIndex}</span>
                </div>
                {bookmark.note ? <p>{bookmark.note}</p> : <p>No note yet. Saved as a timeline marker.</p>}
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
              {bookmark.suggestedStyleProfileId || bookmark.suggestedMutationProfileId ? (
                <button
                  type="button"
                  className="secondary-action replay-bookmark-apply"
                  onClick={() => onApplyBookmarkSuggestion(bookmark)}
                >
                  Load scene
                </button>
              ) : null}
              <button
                type="button"
                className="replay-bookmark-delete"
                onClick={() => onDeleteBookmark(bookmark)}
                disabled={bookmarkBusy}
                aria-label={`Delete replay bookmark ${bookmark.label}`}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <small className="replay-bookmark-empty">
          No replay bookmarks yet. Mark the windows that best represent your team soundscape.
        </small>
      )}
    </div>
  );
}
