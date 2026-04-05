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
