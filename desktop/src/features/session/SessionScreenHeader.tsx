import { useT } from "../../i18n/I18nContext";
import type { PersistedSession } from "../../api/sessions";

interface SessionScreenHeaderProps {
  sessionsCount: number;
  activeSession: PersistedSession | null;
}

export function SessionScreenHeader({
  sessionsCount,
  activeSession,
}: SessionScreenHeaderProps) {
  const t = useT();

  return (
    <header className="screen-header">
      <div>
        <p className="eyebrow">{t.session.title}</p>
        <h2>{t.session.title}</h2>
        <p className="support-copy">{t.session.copy}</p>
      </div>
      <div className="screen-summary">
        <div className="summary-pill">
          <span>{t.session.savedSessions}</span>
          <strong>{sessionsCount}</strong>
        </div>
        {activeSession ? (
          <div className="summary-pill session-pill-active">
            <span>{t.session.active}</span>
            <strong>{activeSession.label || "—"}</strong>
          </div>
        ) : null}
      </div>
    </header>
  );
}
