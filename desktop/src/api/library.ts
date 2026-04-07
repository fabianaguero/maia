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
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      return listMockTracks();
    }
    throw error;
  }
}

export async function importTrack(
  input: ImportTrackInput,
): Promise<LibraryTrack> {
  try {
    return await invoke<LibraryTrack>("import_track", { input });
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      return importMockTrack(input);
    }
    throw error;
  }
}

export async function seedDemoTracks(): Promise<LibraryTrack[]> {
  try {
    return await invoke<LibraryTrack[]>("seed_demo_tracks");
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      return seedMockTracks();
    }
    throw error;
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

export async function checkTrackExists(sourcePath: string): Promise<boolean> {
  try {
    return await invoke<boolean>("check_file_exists", { path: sourcePath });
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      return true; // Mock: assume exists
    }
    throw error;
  }
}

export async function deleteTrack(trackId: string): Promise<void> {
  try {
    await invoke<void>("delete_track", { trackId });
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      // Mock: just log it
      console.log("Mock delete track:", trackId);
      return;
    }

    throw error;
  }
}
