import { Activity } from "lucide-react";

import type { PersistedSession } from "../../api/sessions";
import { SessionSavedSessionCard } from "./SessionSavedSessionCard";
import { buildSessionSavedSessionListItems } from "./sessionSavedSessionsPanelRuntime";

interface SessionSavedSessionsListProps {
  sessions: PersistedSession[];
  loading: boolean;
  mutating: boolean;
  selectedSessionId: string | null;
  activeSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  sessionBookmarksBySessionId: Record<string, import("../../api/sessions").SessionBookmark[]>;
  liveWindowCount: number;
  liveProcessedLines: number;
  liveTotalAnomalies: number;
  emptyLabel: string;
  loadingLabel: string;
  onSelectSession: (sessionId: string) => void;
  onResumeSession: (sessionId: string) => void | Promise<void>;
  onPlaybackSession: (session: PersistedSession) => void | Promise<void>;
  onDeleteSession: (sessionId: string) => void | Promise<void>;
}

export function SessionSavedSessionsList({
  sessions,
  loading,
  mutating,
  selectedSessionId,
  activeSessionId,
  activeSessionMode,
  sessionBookmarksBySessionId,
  liveWindowCount,
  liveProcessedLines,
  liveTotalAnomalies,
  emptyLabel,
  loadingLabel,
  onSelectSession,
  onResumeSession,
  onPlaybackSession,
  onDeleteSession,
}: SessionSavedSessionsListProps) {
  if (loading) {
    return <p className="placeholder">{loadingLabel}</p>;
  }

  if (sessions.length === 0) {
    return (
      <div className="empty-state">
        <Activity size={28} style={{ opacity: 0.3 }} />
        <p>{emptyLabel}</p>
      </div>
    );
  }

  const items = buildSessionSavedSessionListItems({
    sessions,
    selectedSessionId,
    activeSessionId,
    activeSessionMode,
    sessionBookmarksBySessionId,
  });

  return (
    <>
      {items.map((item) => (
        <SessionSavedSessionCard
          key={item.session.id}
          session={item.session}
          selected={item.selected}
          active={item.active}
          playbackActive={item.playbackActive}
          mutating={mutating}
          bookmarks={item.bookmarks}
          liveWindowCount={liveWindowCount}
          liveProcessedLines={liveProcessedLines}
          liveTotalAnomalies={liveTotalAnomalies}
          onSelectSession={onSelectSession}
          onResumeSession={onResumeSession}
          onPlaybackSession={onPlaybackSession}
          onDeleteSession={onDeleteSession}
        />
      ))}
    </>
  );
}
