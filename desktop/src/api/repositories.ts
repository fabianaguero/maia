import { invoke } from "@tauri-apps/api/core";

import type {
  ImportRepositoryInput,
  LiveLogStreamUpdate,
  RepositoryAnalysis,
  StartSessionInput,
  StreamSessionPollResult,
  StreamSessionRecord,
} from "../types/library";
import {
  importMockRepository,
  listMockRepositories,
  pollMockLogStream,
} from "./mockRepositories";

function isNativeBridgeUnavailable(error: unknown): boolean {
  return (
    error instanceof Error &&
    /tauri|__TAURI_INTERNALS__|ipc|native bridge/i.test(error.message)
  );
}

export async function listRepositories(): Promise<RepositoryAnalysis[]> {
  try {
    return await invoke<RepositoryAnalysis[]>("list_repositories");
  } catch {
    return listMockRepositories();
  }
}

export async function importRepository(
  input: ImportRepositoryInput,
): Promise<RepositoryAnalysis> {
  try {
    return await invoke<RepositoryAnalysis>("import_repository", { input });
  } catch {
    return importMockRepository(input);
  }
}

export async function pickRepositoryDirectory(
  initialPath?: string,
): Promise<string | null> {
  try {
    return await invoke<string | null>("pick_repository_directory", {
      initialPath: initialPath?.trim() || undefined,
    });
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      return null;
    }

    throw error;
  }
}

export async function pickRepositoryFile(
  initialPath?: string,
): Promise<string | null> {
  try {
    return await invoke<string | null>("pick_repository_file", {
      initialPath: initialPath?.trim() || undefined,
    });
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      return null;
    }

    throw error;
  }
}

export async function pickExportSavePath(
  defaultName: string,
): Promise<string | null> {
  try {
    return await invoke<string | null>("pick_export_save_path", { defaultName });
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      return null;
    }

    throw error;
  }
}

export async function exportCompositionFile(
  sourcePath: string,
  destPath: string,
): Promise<string> {
  return invoke<string>("export_composition_file", { sourcePath, destPath });
}

export async function pollLogStream(
  sourcePath: string,
  cursor?: number,
): Promise<LiveLogStreamUpdate> {
  try {
    return await invoke<LiveLogStreamUpdate>("poll_log_stream", {
      sourcePath,
      cursor,
    });
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      return pollMockLogStream(sourcePath, cursor);
    }

    throw error;
  }
}

export async function startStreamSession(
  input: StartSessionInput,
): Promise<StreamSessionRecord> {
  return invoke<StreamSessionRecord>("start_stream_session", { input });
}

export async function stopStreamSession(
  sessionId: string,
): Promise<boolean> {
  return invoke<boolean>("stop_stream_session", { sessionId });
}

export async function listStreamSessions(): Promise<StreamSessionRecord[]> {
  return invoke<StreamSessionRecord[]>("list_stream_sessions");
}

export async function pollStreamSession(
  sessionId: string,
): Promise<StreamSessionPollResult> {
  return invoke<StreamSessionPollResult>("poll_stream_session", { sessionId });
}

/**
 * Feed a raw chunk of newline-delimited log text into a session ring buffer and
 * return the accumulated analysis.  Used by the WebSocket and HTTP-poll adapters
 * which manage their own connections on the JS side.
 *
 * If `chunk` is empty the ring buffer is not updated, but `session_poll` is
 * still called so callers always get the current accumulated state.
 */
export async function ingestStreamChunk(
  sessionId: string,
  chunk: string,
): Promise<StreamSessionPollResult> {
  return invoke<StreamSessionPollResult>("ingest_stream_chunk", { sessionId, chunk });
}
