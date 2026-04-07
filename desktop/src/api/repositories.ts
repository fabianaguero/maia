import { invoke } from "@tauri-apps/api/core";
import { getLogger } from "../utils/logger";

const log = getLogger("API.Repos");

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
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      return listMockRepositories();
    }
    throw error;
  }
}

export async function importRepository(
  input: ImportRepositoryInput,
): Promise<RepositoryAnalysis> {
  try {
    return await invoke<RepositoryAnalysis>("import_repository", { input });
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      return importMockRepository(input);
    }
    throw error;
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

export async function pickStemsExportDirectory(): Promise<string | null> {
  try {
    return await invoke<string | null>("pick_stems_export_directory");
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      return null;
    }

    throw error;
  }
}

export interface StemExportResult {
  stemId: string;
  label: string;
  role: string;
  gainDb: number;
  pan: number;
  path: string;
  format: string;
  sampleRateHz: number;
  channels: number;
  durationSeconds: number;
}

export interface ExportStemsResponse {
  status: "ok";
  stems: StemExportResult[];
}

export async function exportCompositionStems(
  compositionId: string,
  destDir: string,
): Promise<ExportStemsResponse> {
  return invoke<ExportStemsResponse>("export_composition_stems", {
    compositionId,
    destDir,
  });
}

export async function pollLogStream(
  sourcePath: string,
  cursor?: number,
): Promise<LiveLogStreamUpdate> {
  log.trace("pollLogStream path=%s cursor=%s", sourcePath, cursor);
  try {
    const result = await invoke<LiveLogStreamUpdate>("poll_log_stream", {
      sourcePath,
      cursor,
    });
    log.debug("pollLogStream → hasData=%s lines=%d cues=%d", result.hasData, result.lineCount, result.sonificationCues.length);
    return result;
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      log.debug("pollLogStream fallback to mock");
      return pollMockLogStream(sourcePath, cursor);
    }
    log.error("pollLogStream failed:", error);
    throw error;
  }
}

export async function startStreamSession(
  input: StartSessionInput,
): Promise<StreamSessionRecord> {
  log.info("startStreamSession id=%s adapter=%s source=%s", input.sessionId, input.adapterKind, input.source);
  const result = await invoke<StreamSessionRecord>("start_stream_session", { input });
  log.info("startStreamSession → session created");
  return result;
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
  log.trace("pollStreamSession id=%s", sessionId);
  const result = await invoke<StreamSessionPollResult>("poll_stream_session", { sessionId });
  log.debug("pollStreamSession → hasData=%s lines=%d cues=%d", result.hasData, result.lineCount, result.sonificationCues.length);
  return result;
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
  log.trace("ingestStreamChunk id=%s chunkLen=%d", sessionId, chunk.length);
  const result = await invoke<StreamSessionPollResult>("ingest_stream_chunk", { sessionId, chunk });
  log.debug("ingestStreamChunk → hasData=%s lines=%d cues=%d", result.hasData, result.lineCount, result.sonificationCues.length);
  return result;
}

export async function readAudioBytes(path: string): Promise<string> {
  return invoke<string>("read_audio_bytes", { path });
}

export async function checkRepositoryExists(sourcePath: string): Promise<boolean> {
  try {
    return await invoke<boolean>("check_file_exists", { path: sourcePath });
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      return true; // Mock: assume exists
    }
    throw error;
  }
}

export async function deleteRepository(repositoryId: string): Promise<void> {
  try {
    await invoke<void>("delete_repository", { repositoryId });
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      // Mock: just log it
      console.log("Mock delete repository:", repositoryId);
      return;
    }

    throw error;
  }
}
