import { getLogger } from "../utils/logger";
import { invokeOrFallback } from "./tauri";

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

export async function listRepositories(): Promise<RepositoryAnalysis[]> {
  return invokeOrFallback("list_repositories", undefined, () => listMockRepositories());
}

export async function importRepository(
  input: ImportRepositoryInput,
): Promise<RepositoryAnalysis> {
  return invokeOrFallback(
    "import_repository",
    { input },
    () => importMockRepository(input),
  );
}

export async function discoverRepositoryLogs(
  path: string,
): Promise<string[]> {
  return invokeOrFallback("discover_repository_logs", { path }, () => []);
}

export async function pickRepositoryDirectory(
  initialPath?: string,
): Promise<string | null> {
  return invokeOrFallback(
    "pick_repository_directory",
    { initialPath: initialPath?.trim() || undefined },
    () => null,
  );
}

export async function pickRepositoryFile(
  initialPath?: string,
): Promise<string | null> {
  return invokeOrFallback(
    "pick_repository_file",
    { initialPath: initialPath?.trim() || undefined },
    () => null,
  );
}

export async function pickExportSavePath(
  defaultName: string,
): Promise<string | null> {
  return invokeOrFallback("pick_export_save_path", { defaultName }, () => null);
}

export async function exportCompositionFile(
  sourcePath: string,
  destPath: string,
): Promise<string> {
  return invokeOrFallback(
    "export_composition_file",
    { sourcePath, destPath },
    () => {
      throw new Error("Composition export requires the native desktop shell.");
    },
  );
}

export async function pickStemsExportDirectory(): Promise<string | null> {
  return invokeOrFallback("pick_stems_export_directory", undefined, () => null);
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
  return invokeOrFallback("export_composition_stems", { compositionId, destDir }, () => {
    throw new Error("Stem export requires the native desktop shell.");
  });
}

export async function pollLogStream(
  sourcePath: string,
  cursor?: number,
  maxBytes?: number,
): Promise<LiveLogStreamUpdate> {
  log.trace("pollLogStream path=%s cursor=%s maxBytes=%s", sourcePath, cursor, maxBytes);
  try {
    const result = await invokeOrFallback(
      "poll_log_stream",
      { sourcePath, cursor, maxBytes },
      () => {
        log.debug("pollLogStream fallback to mock");
        return pollMockLogStream(sourcePath, cursor, maxBytes);
      },
    );
    log.debug("pollLogStream → hasData=%s lines=%d cues=%d", result.hasData, result.lineCount, result.sonificationCues.length);
    return result;
  } catch (error) {
    log.error("pollLogStream failed:", error);
    throw error;
  }
}

export async function startStreamSession(
  input: StartSessionInput,
): Promise<StreamSessionRecord> {
  log.info("startStreamSession id=%s adapter=%s source=%s", input.sessionId, input.adapterKind, input.source);
  const result = await invokeOrFallback("start_stream_session", { input }, () => {
    throw new Error("Stream sessions require the native desktop shell.");
  });
  log.info("startStreamSession → session created");
  return result;
}

export async function stopStreamSession(
  sessionId: string,
): Promise<boolean> {
  return invokeOrFallback("stop_stream_session", { sessionId }, () => false);
}

export async function listStreamSessions(): Promise<StreamSessionRecord[]> {
  return invokeOrFallback("list_stream_sessions", undefined, () => []);
}

export async function pollStreamSession(
  sessionId: string,
): Promise<StreamSessionPollResult> {
  log.trace("pollStreamSession id=%s", sessionId);
  const result = await invokeOrFallback<StreamSessionPollResult>(
    "poll_stream_session",
    { sessionId },
    () => {
      throw new Error("Stream sessions require the native desktop shell.");
    },
  );
  log.debug("pollStreamSession → hasData=%s lines=%d cues=%d", result.hasData, result.lineCount, result.sonificationCues.length);
  return result;
}

/**
 * Feed a raw chunk of newline-delimited log text into the native transient
 * session buffer and return analysis for that chunk. Used by the WebSocket and
 * HTTP-poll adapters, which manage their own connections on the JS side.
 *
 * If `chunk` is empty the native session is left unchanged and a waiting
 * result is returned.
 */
export async function ingestStreamChunk(
  sessionId: string,
  chunk: string,
): Promise<StreamSessionPollResult> {
  log.trace("ingestStreamChunk id=%s chunkLen=%d", sessionId, chunk.length);
  const result = await invokeOrFallback<StreamSessionPollResult>(
    "ingest_stream_chunk",
    { sessionId, chunk },
    () => {
      throw new Error("Stream sessions require the native desktop shell.");
    },
  );
  log.debug("ingestStreamChunk → hasData=%s lines=%d cues=%d", result.hasData, result.lineCount, result.sonificationCues.length);
  return result;
}

export async function readAudioBytes(path: string): Promise<string> {
  return invokeOrFallback("read_audio_bytes", { path }, () => {
    throw new Error("Audio byte reads require the native desktop shell.");
  });
}

export async function checkRepositoryExists(sourcePath: string): Promise<boolean> {
  return invokeOrFallback("check_file_exists", { path: sourcePath }, () => true);
}

export async function deleteRepository(repositoryId: string): Promise<void> {
  return invokeOrFallback("delete_repository", { repositoryId }, () => {
    console.log("Mock delete repository:", repositoryId);
  });
}
