import type { ChangeEventHandler } from "react";
import { useT } from "../../../i18n/I18nContext";
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
  const t = useT();
  return (
    <div className="audio-path-card audio-path-card--replay top-spaced">
      <span>{t.inspect.replayBookmarks}</span>
      <strong>
        {activeReplayBookmark
          ? t.inspect.replayWindowSaved.replace("{window}", String(replayWindowIndex))
          : t.inspect.markReplayWindow.replace("{window}", String(replayWindowIndex))}
      </strong>
      <small>{t.inspect.replayBookmarksCopy}</small>
      <div className="replay-bookmark-form">
        <label>
          <span className="field-label">{t.inspect.label}</span>
          <input
            className="field-input"
            type="text"
            value={bookmarkLabelDraft}
            onChange={onBookmarkLabelChange}
            placeholder={t.inspect.windowLabel.replace("{window}", String(replayWindowIndex))}
          />
        </label>
        <label>
          <span className="field-label">{t.inspect.note}</span>
          <textarea
            className="field-input replay-bookmark-textarea"
            rows={3}
            value={bookmarkNoteDraft}
            onChange={onBookmarkNoteChange}
            placeholder={t.inspect.replayNotePlaceholder}
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
            <span className="field-label">{t.inspect.suggestedStyle}</span>
            <select
              className="field-input"
              value={bookmarkStyleProfileIdDraft ?? ""}
              onChange={onBookmarkStyleProfileChange}
            >
              <option value="">{t.inspect.noStyleHint}</option>
              {STYLE_PROFILES.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">{t.inspect.suggestedMutation}</span>
            <select
              className="field-input"
              value={bookmarkMutationProfileIdDraft ?? ""}
              onChange={onBookmarkMutationProfileChange}
            >
              <option value="">{t.inspect.noMutationHint}</option>
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
            {t.inspect.captureCurrentScene}
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={onSaveBookmark}
            disabled={bookmarkBusy}
          >
            {bookmarkBusy
              ? t.inspect.saving
              : activeReplayBookmark
                ? t.inspect.updateWindowNote
                : t.inspect.saveWindowNote}
          </button>
          {activeReplayBookmark ? (
            <button
              type="button"
              className="secondary-action replay-bookmark-delete-current"
              onClick={onDeleteCurrentBookmark}
              disabled={bookmarkBusy}
            >
              {t.inspect.deleteCurrent}
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
                  <span>
                    {t.inspect.replayWindowShort.replace(
                      "{index}",
                      String(bookmark.replayWindowIndex),
                    )}
                  </span>
                </div>
                {bookmark.note ? <p>{bookmark.note}</p> : <p>{t.inspect.noNoteYet}</p>}
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
                  {t.inspect.loadScene}
                </button>
              ) : null}
              <button
                type="button"
                className="replay-bookmark-delete"
                onClick={() => onDeleteBookmark(bookmark)}
                disabled={bookmarkBusy}
                aria-label={t.inspect.deleteReplayBookmark.replace("{label}", bookmark.label)}
              >
                {t.inspect.delete}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <small className="replay-bookmark-empty">{t.inspect.noReplayBookmarks}</small>
      )}
    </div>
  );
}
