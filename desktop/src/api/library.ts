import { invoke } from "@tauri-apps/api/core";

import type { ImportTrackInput, LibraryTrack } from "../types/library";
import {
  importMockTrack,
  listMockTracks,
  seedMockTracks,
} from "./mockLibrary";

function isNativeBridgeUnavailable(error: unknown): boolean {
  return (
    error instanceof Error &&
    /tauri|__TAURI_INTERNALS__|ipc|native bridge/i.test(error.message)
  );
}

export async function listTracks(): Promise<LibraryTrack[]> {
  try {
    return await invoke<LibraryTrack[]>("list_tracks");
  } catch {
    return listMockTracks();
  }
}

export async function importTrack(
  input: ImportTrackInput,
): Promise<LibraryTrack> {
  try {
    return await invoke<LibraryTrack>("import_track", { input });
  } catch {
    return importMockTrack(input);
  }
}

export async function seedDemoTracks(): Promise<LibraryTrack[]> {
  try {
    return await invoke<LibraryTrack[]>("seed_demo_tracks");
  } catch {
    return seedMockTracks();
  }
}

export async function pickTrackSourcePath(
  initialPath?: string,
): Promise<string | null> {
  try {
    return await invoke<string | null>("pick_track_source_path", {
      initialPath: initialPath?.trim() || undefined,
    });
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      return null;
    }

    throw error;
  }
}
