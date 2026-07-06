interface SessionSavedSessionCardHeaderProps {
  selected: boolean;
  active: boolean;
  sessionId: string;
  status: string;
  statusTone: string;
  title: string;
  sourceLabel: string;
  baseLabel: string | null;
  bookmarksLabel: string | null;
  baseLabelPrefix: string;
  onSelectSession: (sessionId: string) => void;
}

export function SessionSavedSessionCardHeader({
  selected,
  active,
  sessionId,
  status,
  statusTone,
  title,
  sourceLabel,
  baseLabel,
  bookmarksLabel,
  baseLabelPrefix,
  onSelectSession,
}: SessionSavedSessionCardHeaderProps) {
  return (
    <div
      className={`session-card-header${selected ? " selected" : ""}${active ? " active" : ""}`}
      onClick={() => onSelectSession(sessionId)}
    >
      <div className="session-card-title-row">
        <h4>{title}</h4>
        <span className={`session-status-badge ${statusTone}`}>{status}</span>
      </div>
      <p className="session-card-source">{sourceLabel}</p>
      {baseLabel ? (
        <p className="session-card-base">
          {baseLabelPrefix}: {baseLabel}
        </p>
      ) : null}
      {bookmarksLabel ? <p className="session-card-bookmarks">{bookmarksLabel}</p> : null}
    </div>
  );
}
