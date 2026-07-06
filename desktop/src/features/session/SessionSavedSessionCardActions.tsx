import { Play, Radio, Trash2 } from "lucide-react";

import type { PersistedSession } from "../../api/sessions";

interface SessionSavedSessionCardActionsProps {
  session: PersistedSession;
  mutating: boolean;
  showPlaybackAction: boolean;
  showResumeAction: boolean;
  deleteDisabled: boolean;
  playbackLabel: string;
  resumeLabel: string;
  onResumeSession: (sessionId: string) => void | Promise<void>;
  onPlaybackSession: (session: PersistedSession) => void | Promise<void>;
  onDeleteSession: (sessionId: string) => void | Promise<void>;
}

export function SessionSavedSessionCardActions({
  session,
  mutating,
  showPlaybackAction,
  showResumeAction,
  deleteDisabled,
  playbackLabel,
  resumeLabel,
  onResumeSession,
  onPlaybackSession,
  onDeleteSession,
}: SessionSavedSessionCardActionsProps) {
  return (
    <div className="session-card-actions">
      {showPlaybackAction ? (
        <button
          type="button"
          className="action session-playback-action"
          onClick={() => onPlaybackSession(session)}
          disabled={mutating}
        >
          <Radio size={12} />
          {playbackLabel}
        </button>
      ) : null}
      {showResumeAction ? (
        <button
          type="button"
          className="action session-resume-action"
          onClick={() => onResumeSession(session.id)}
          disabled={mutating}
        >
          <Play size={12} />
          {resumeLabel}
        </button>
      ) : null}
      <button
        type="button"
        className="secondary-action session-delete-action"
        onClick={() => onDeleteSession(session.id)}
        disabled={deleteDisabled}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
