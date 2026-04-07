import { invoke } from "@tauri-apps/api/core";
import { getLogger } from "../utils/logger";

const log = getLogger("API.Sessions");

export interface PersistedSession {
  id: string;
  label: string | null;
  sourceId: string | null;
  sourceTitle: string | null;
  sourcePath: string | null;
  sourceKind: string | null;
  trackId: string | null;
  trackTitle: string | null;
  adapterKind: string;
  mode: "live" | "play";
  status: "active" | "paused" | "stopped";
  fileCursor: number;
  totalPolls: number;
  totalLines: number;
  totalAnomalies: number;
  lastBpm: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionInput {
  id: string;
  label?: string;
  sourceId?: string;
  trackId?: string;
  adapterKind: string;
  mode: "live" | "play";
}

function isTauriUnavailable(error: unknown): boolean {
  return (
    error instanceof Error &&
    /tauri|__TAURI_INTERNALS__|ipc|native bridge/i.test(error.message)
  );
}

export async function createPersistedSession(
  input: CreateSessionInput,
): Promise<PersistedSession> {
  log.info("createPersistedSession id=%s adapter=%s mode=%s", input.id, input.adapterKind, input.mode);
  const result = await invoke<PersistedSession>("create_persisted_session", { input });
  log.info("createPersistedSession → created status=%s", result.status);
  return result;
}

export async function listPersistedSessions(): Promise<PersistedSession[]> {
  try {
    return await invoke<PersistedSession[]>("list_persisted_sessions");
  } catch (error) {
    if (isTauriUnavailable(error)) return [];
    throw error;
  }
}

export async function getPersistedSession(id: string): Promise<PersistedSession> {
  return invoke<PersistedSession>("get_persisted_session", { id });
}

export async function updatePersistedSessionStatus(
  id: string,
  status: "active" | "paused" | "stopped",
): Promise<void> {
  return invoke("update_persisted_session_status", { id, status });
}

export async function updatePersistedSessionCursor(
  id: string,
  cursor: number,
  linesDelta: number,
  anomaliesDelta: number,
  lastBpm: number | null,
): Promise<void> {
  return invoke("update_persisted_session_cursor", {
    id,
    cursor,
    linesDelta,
    anomaliesDelta,
    lastBpm,
  });
}

export async function deletePersistedSession(id: string): Promise<boolean> {
  return invoke<boolean>("delete_persisted_session", { id });
}

// ---------------------------------------------------------------------------
// Session events — per-poll time-series for playback
// ---------------------------------------------------------------------------

export interface SessionEvent {
  id: number;
  sessionId: string;
  pollIndex: number;
  capturedAt: string;
  fromOffset: number;
  toOffset: number;
  summary: string;
  suggestedBpm: number | null;
  confidence: number;
  dominantLevel: string;
  lineCount: number;
  anomalyCount: number;
  levelCountsJson: string;
  anomalyMarkersJson: string;
  topComponentsJson: string;
  sonificationCuesJson: string;
  warningsJson: string;
}

export interface InsertSessionEventInput {
  sessionId: string;
  pollIndex: number;
  fromOffset: number;
  toOffset: number;
  summary: string;
  suggestedBpm: number | null;
  confidence: number;
  dominantLevel: string;
  lineCount: number;
  anomalyCount: number;
  levelCountsJson: string;
  anomalyMarkersJson: string;
  topComponentsJson: string;
  sonificationCuesJson: string;
  warningsJson: string;
}

export async function insertSessionEvent(
  input: InsertSessionEventInput,
): Promise<number> {
  log.trace("insertSessionEvent session=%s poll=%d lines=%d cues=%s", input.sessionId, input.pollIndex, input.lineCount, input.sonificationCuesJson.length);
  return invoke<number>("insert_session_event", { input });
}

export async function listSessionEvents(
  sessionId: string,
): Promise<SessionEvent[]> {
  try {
    return await invoke<SessionEvent[]>("list_session_events", { sessionId });
  } catch (error) {
    if (isTauriUnavailable(error)) return [];
    throw error;
  }
}
