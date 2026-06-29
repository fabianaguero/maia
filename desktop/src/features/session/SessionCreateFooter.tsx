import { Plus } from "lucide-react";
import { useT } from "../../i18n/I18nContext";
import type { SessionBaseMode } from "./sessionDisplay";

interface SessionCreateFooterProps {
  baseMode: SessionBaseMode;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
  selectedSourceTitle: string | null;
  selectedBaseLabel: string | null;
  sessionLabel: string;
  sessionLabelPlaceholder: string;
  creating: boolean;
  mutating: boolean;
  onSessionLabelChange: (value: string) => void;
  onCreateSession: () => void | Promise<void>;
}

export function SessionCreateFooter({
  baseMode,
  selectedSourceId,
  selectedTrackId,
  selectedPlaylistId,
  selectedSourceTitle,
  selectedBaseLabel,
  sessionLabel,
  sessionLabelPlaceholder,
  creating,
  mutating,
  onSessionLabelChange,
  onCreateSession,
}: SessionCreateFooterProps) {
  const t = useT();
  const baseReady =
    (baseMode === "track" && selectedTrackId) || (baseMode === "playlist" && selectedPlaylistId);

  return (
    <div className="session-create-footer">
      <label className="field-label">{t.session.sessionName}</label>
      <input
        type="text"
        value={sessionLabel}
        onChange={(event) => onSessionLabelChange(event.target.value)}
        placeholder={sessionLabelPlaceholder}
        className="field-input"
      />

      <div className="monitor-readiness-list" role="list">
        <div className="monitor-readiness-item" role="listitem">
          <span>{t.session.baseBed}</span>
          <span className={`monitor-readiness-state${baseReady ? " ready" : ""}`}>
            {baseReady ? (selectedBaseLabel ?? t.session.armed) : t.session.notSelected}
          </span>
        </div>
        <div className="monitor-readiness-item" role="listitem">
          <span>{t.session.sourceFeed}</span>
          <span className={`monitor-readiness-state${selectedSourceTitle ? " ready" : ""}`}>
            {selectedSourceTitle ?? t.session.notSelected}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="action"
        onClick={onCreateSession}
        disabled={
          creating ||
          mutating ||
          !selectedSourceId ||
          (baseMode === "track" ? !selectedTrackId : !selectedPlaylistId)
        }
      >
        <Plus size={14} />
        {t.session.runStepAction.replace("{label}", t.session.startSession)}
      </button>
    </div>
  );
}
