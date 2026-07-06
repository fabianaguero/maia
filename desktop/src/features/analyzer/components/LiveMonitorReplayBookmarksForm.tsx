import type { ChangeEventHandler } from "react";

import { MUTATION_PROFILES, STYLE_PROFILES } from "../../../config/liveProfiles";
import { REPLAY_BOOKMARK_TAGS } from "../../../config/replayBookmarks";
import type { SessionBookmark } from "../../../api/sessions";
import {
  resolveReplayBookmarkCardTitle,
  resolveReplayBookmarkSaveLabel,
} from "./liveMonitorReplayBookmarksCardRuntime";

interface LiveMonitorReplayBookmarksFormProps {
  replayWindowIndex: number;
  activeReplayBookmark: SessionBookmark | null;
  bookmarkLabelDraft: string;
  bookmarkNoteDraft: string;
  bookmarkTagDraft: string | null;
  bookmarkStyleProfileIdDraft: string | null;
  bookmarkMutationProfileIdDraft: string | null;
  bookmarkBusy: boolean;
  bookmarkError: string | null;
  labels: {
    replayBookmarks: string;
    replayWindowSaved: string;
    markReplayWindow: string;
    replayBookmarksCopy: string;
    label: string;
    windowLabel: string;
    note: string;
    replayNotePlaceholder: string;
    suggestedStyle: string;
    noStyleHint: string;
    suggestedMutation: string;
    noMutationHint: string;
    captureCurrentScene: string;
    saving: string;
    updateWindowNote: string;
    saveWindowNote: string;
    deleteCurrent: string;
  };
  onBookmarkLabelChange: ChangeEventHandler<HTMLInputElement>;
  onBookmarkNoteChange: ChangeEventHandler<HTMLTextAreaElement>;
  onBookmarkTagToggle: (tagId: string) => void;
  onBookmarkStyleProfileChange: ChangeEventHandler<HTMLSelectElement>;
  onBookmarkMutationProfileChange: ChangeEventHandler<HTMLSelectElement>;
  onCaptureCurrentScene: () => void;
  onSaveBookmark: () => void;
  onDeleteCurrentBookmark: () => void;
}

export function LiveMonitorReplayBookmarksForm({
  replayWindowIndex,
  activeReplayBookmark,
  bookmarkLabelDraft,
  bookmarkNoteDraft,
  bookmarkTagDraft,
  bookmarkStyleProfileIdDraft,
  bookmarkMutationProfileIdDraft,
  bookmarkBusy,
  bookmarkError,
  labels,
  onBookmarkLabelChange,
  onBookmarkNoteChange,
  onBookmarkTagToggle,
  onBookmarkStyleProfileChange,
  onBookmarkMutationProfileChange,
  onCaptureCurrentScene,
  onSaveBookmark,
  onDeleteCurrentBookmark,
}: LiveMonitorReplayBookmarksFormProps) {
  return (
    <>
      <span>{labels.replayBookmarks}</span>
      <strong>
        {resolveReplayBookmarkCardTitle({
          activeReplayBookmark,
          replayWindowIndex,
          savedLabel: labels.replayWindowSaved,
          unsavedLabel: labels.markReplayWindow,
        })}
      </strong>
      <small>{labels.replayBookmarksCopy}</small>
      <div className="replay-bookmark-form">
        <label>
          <span className="field-label">{labels.label}</span>
          <input
            className="field-input"
            type="text"
            value={bookmarkLabelDraft}
            onChange={onBookmarkLabelChange}
            placeholder={labels.windowLabel.replace("{window}", String(replayWindowIndex))}
          />
        </label>
        <label>
          <span className="field-label">{labels.note}</span>
          <textarea
            className="field-input replay-bookmark-textarea"
            rows={3}
            value={bookmarkNoteDraft}
            onChange={onBookmarkNoteChange}
            placeholder={labels.replayNotePlaceholder}
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
            <span className="field-label">{labels.suggestedStyle}</span>
            <select
              className="field-input"
              value={bookmarkStyleProfileIdDraft ?? ""}
              onChange={onBookmarkStyleProfileChange}
            >
              <option value="">{labels.noStyleHint}</option>
              {STYLE_PROFILES.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">{labels.suggestedMutation}</span>
            <select
              className="field-input"
              value={bookmarkMutationProfileIdDraft ?? ""}
              onChange={onBookmarkMutationProfileChange}
            >
              <option value="">{labels.noMutationHint}</option>
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
            {labels.captureCurrentScene}
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={onSaveBookmark}
            disabled={bookmarkBusy}
          >
            {resolveReplayBookmarkSaveLabel({
              bookmarkBusy,
              activeReplayBookmark,
              savingLabel: labels.saving,
              updateLabel: labels.updateWindowNote,
              createLabel: labels.saveWindowNote,
            })}
          </button>
          {activeReplayBookmark ? (
            <button
              type="button"
              className="secondary-action replay-bookmark-delete-current"
              onClick={onDeleteCurrentBookmark}
              disabled={bookmarkBusy}
            >
              {labels.deleteCurrent}
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
