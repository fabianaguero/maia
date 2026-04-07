import { startTransition, useCallback, useEffect, useState } from "react";
import {
  createPersistedSession,
  deletePersistedSession,
  listPersistedSessions,
  updatePersistedSessionCursor,
  updatePersistedSessionStatus,
  type CreateSessionInput,
  type PersistedSession,
} from "../api/sessions";
import { getLogger } from "../utils/logger";

const log = getLogger("Hook.Sessions");

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected session error.";
}

export function useSessions() {
  const [sessions, setSessions] = useState<PersistedSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const list = await listPersistedSessions();
        if (!active) return;
        startTransition(() => {
          setSessions(list);
          setSelectedSessionId((cur) => {
            if (cur && list.some((s) => s.id === cur)) return cur;
            return list.find((s) => s.status === "active")?.id
              ?? list.find((s) => s.status === "paused")?.id
              ?? list[0]?.id
              ?? null;
          });
          setLoading(false);
        });
      } catch (err) {
        if (!active) return;
        startTransition(() => {
          setError(toMessage(err));
          setLoading(false);
        });
      }
    }

    void load();
    return () => { active = false; };
  }, []);

  const createSession = useCallback(async (input: CreateSessionInput): Promise<PersistedSession | null> => {
    log.info("createSession id=%s adapter=%s mode=%s", input.id, input.adapterKind, input.mode);
    setMutating(true);
    try {
      const session = await createPersistedSession(input);
      log.info("createSession → success status=%s", session.status);
      startTransition(() => {
        setSessions((prev) => [session, ...prev.filter((s) => s.id !== session.id)]);
        setSelectedSessionId(session.id);
        setError(null);
      });
      return session;
    } catch (err) {
      log.error("createSession → FAILED:", err);
      startTransition(() => setError(toMessage(err)));
      return null;
    } finally {
      setMutating(false);
    }
  }, []);

  const removeSession = useCallback(async (id: string): Promise<void> => {
    setMutating(true);
    try {
      await deletePersistedSession(id);
      startTransition(() => {
        setSessions((prev) => {
          const next = prev.filter((s) => s.id !== id);
          setSelectedSessionId((cur) => cur === id ? (next[0]?.id ?? null) : cur);
          return next;
        });
      });
    } catch (err) {
      startTransition(() => setError(toMessage(err)));
    } finally {
      setMutating(false);
    }
  }, []);

  const setStatus = useCallback(async (id: string, status: "active" | "paused" | "stopped"): Promise<void> => {
    try {
      await updatePersistedSessionStatus(id, status);
      startTransition(() => {
        setSessions((prev) =>
          prev.map((s) => s.id === id ? { ...s, status, updatedAt: new Date().toISOString() } : s),
        );
      });
    } catch (err) {
      startTransition(() => setError(toMessage(err)));
    }
  }, []);

  const updateCursor = useCallback(async (
    id: string,
    cursor: number,
    linesDelta: number,
    anomaliesDelta: number,
    lastBpm: number | null,
  ): Promise<void> => {
    try {
      await updatePersistedSessionCursor(id, cursor, linesDelta, anomaliesDelta, lastBpm);
      startTransition(() => {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  fileCursor: cursor,
                  totalPolls: s.totalPolls + 1,
                  totalLines: s.totalLines + linesDelta,
                  totalAnomalies: s.totalAnomalies + anomaliesDelta,
                  lastBpm: lastBpm ?? s.lastBpm,
                  status: "active" as const,
                  updatedAt: new Date().toISOString(),
                }
              : s,
          ),
        );
      });
    } catch {
      // non-fatal cursor update — don't surface to user
    }
  }, []);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null;

  const clearError = useCallback(() => setError(null), []);

  return {
    sessions,
    selectedSession,
    selectedSessionId,
    setSelectedSessionId,
    loading,
    mutating,
    error,
    clearError,
    createSession,
    removeSession,
    setStatus,
    updateCursor,
  };
}
