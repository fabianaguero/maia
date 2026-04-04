import { invoke } from "@tauri-apps/api/core";

import type {
  ImportRepositoryInput,
  RepositoryAnalysis,
} from "../types/library";
import {
  importMockRepository,
  listMockRepositories,
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
