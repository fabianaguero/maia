import { invoke } from "@tauri-apps/api/core";

import type { ImportTrackInput, LibraryTrack } from "../types/library";
import {
  importMockTrack,
  listMockTracks,
  seedMockTracks,
} from "./mockLibrary";

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

