import { Activity } from "lucide-react";

import { SessionSavedSessionCard } from "./SessionSavedSessionCard";
import {
  buildSessionSavedSessionsListCardProps,
  resolveSessionSavedSessionsListState,
} from "./sessionSavedSessionsListRuntime";
import type { SessionSavedSessionsListProps } from "./sessionSavedSessionsListTypes";

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
  const state = resolveSessionSavedSessionsListState({
    loading,
    sessionCount: sessions.length,
  });

  if (state === "loading") {
    return <p className="placeholder">{loadingLabel}</p>;
  }

  if (state === "empty") {
    return (
      <div className="empty-state">
        <Activity size={28} style={{ opacity: 0.3 }} />
        <p>{emptyLabel}</p>
      </div>
    );
  }

  const cardPropsList = buildSessionSavedSessionsListCardProps({
    sessions,
    mutating,
    selectedSessionId,
    activeSessionId,
    activeSessionMode,
    sessionBookmarksBySessionId,
    liveWindowCount,
    liveProcessedLines,
    liveTotalAnomalies,
    onSelectSession,
    onResumeSession,
    onPlaybackSession,
    onDeleteSession,
  });

  return (
    <>
      {cardPropsList.map(({ key, ...cardProps }) => (
        <SessionSavedSessionCard key={key} {...cardProps} />
      ))}
    </>
  );
}
