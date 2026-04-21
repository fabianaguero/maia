import { useEffect, useState } from "react";
import { listPersistedSessions, deletePersistedSession } from "../api/sessions";
import type { PersistedSession } from "../api/sessions";

export function useSessions() {
  const [sessions, setSessions] = useState<PersistedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSessions() {
    setLoading(true);
    try {
      const data = await listPersistedSessions();
      setSessions(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function removeSession(id: string) {
    try {
      const success = await deletePersistedSession(id);
      if (success) {
        setSessions(prev => prev.filter(s => s.id !== id));
      }
      return success;
    } catch (err) {
      return false;
    }
  }

  return {
    sessions,
    loading,
    error,
    refresh: loadSessions,
    removeSession,
  };
}
