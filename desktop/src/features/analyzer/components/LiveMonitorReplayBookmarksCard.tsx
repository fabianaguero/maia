import type { ChangeEventHandler } from "react";
import { useT } from "../../../i18n/I18nContext";
import type { SessionBookmark } from "../../../api/sessions";
import { LiveMonitorReplayBookmarksForm } from "./LiveMonitorReplayBookmarksForm";
import { LiveMonitorReplayBookmarksList } from "./LiveMonitorReplayBookmarksList";

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
      <LiveMonitorReplayBookmarksForm
        replayWindowIndex={replayWindowIndex}
        activeReplayBookmark={activeReplayBookmark}
        bookmarkLabelDraft={bookmarkLabelDraft}
        bookmarkNoteDraft={bookmarkNoteDraft}
        bookmarkTagDraft={bookmarkTagDraft}
        bookmarkStyleProfileIdDraft={bookmarkStyleProfileIdDraft}
        bookmarkMutationProfileIdDraft={bookmarkMutationProfileIdDraft}
        bookmarkBusy={bookmarkBusy}
        bookmarkError={bookmarkError}
        labels={t.inspect}
        onBookmarkLabelChange={onBookmarkLabelChange}
        onBookmarkNoteChange={onBookmarkNoteChange}
        onBookmarkTagToggle={onBookmarkTagToggle}
        onBookmarkStyleProfileChange={onBookmarkStyleProfileChange}
        onBookmarkMutationProfileChange={onBookmarkMutationProfileChange}
        onCaptureCurrentScene={onCaptureCurrentScene}
        onSaveBookmark={onSaveBookmark}
        onDeleteCurrentBookmark={onDeleteCurrentBookmark}
      />
      <LiveMonitorReplayBookmarksList
        activeReplayBookmark={activeReplayBookmark}
        sortedSessionBookmarks={sortedSessionBookmarks}
        playbackEventCount={playbackEventCount}
        bookmarkBusy={bookmarkBusy}
        labels={t.inspect}
        onJumpToBookmark={onJumpToBookmark}
        onApplyBookmarkSuggestion={onApplyBookmarkSuggestion}
        onDeleteBookmark={onDeleteBookmark}
      />
    </div>
  );
}
