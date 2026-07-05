import { useT } from "../../i18n/I18nContext";
import { SessionReplayBookmarkPanel } from "./SessionReplayBookmarkPanel";
import { SessionSavedSessionsList } from "./SessionSavedSessionsList";
import { buildSessionSavedSessionsPanelSections } from "./sessionSavedSessionsPanelViewRuntime";
import type { SessionSavedSessionsPanelProps } from "./sessionSavedSessionsPanelTypes";

export function SessionSavedSessionsPanel({ ...props }: SessionSavedSessionsPanelProps) {
  const t = useT();
  const sections = buildSessionSavedSessionsPanelSections({
    ...props,
    t,
  });

  return (
    <section className="panel session-list-panel">
      <div className="panel-header">
        <h3>{sections.header.title}</h3>
        <p className="support-copy">{sections.header.summary}</p>
      </div>

      <div className="session-card-list">
        <SessionSavedSessionsList {...sections.listProps} />
      </div>

      {sections.replayPanelProps ? (
        <SessionReplayBookmarkPanel {...sections.replayPanelProps} />
      ) : null}
    </section>
  );
}
