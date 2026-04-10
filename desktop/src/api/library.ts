import type {
  BaseTrackPlaylist,
  ImportTrackInput,
  LibraryTrack,
  SaveBaseTrackPlaylistInput,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../types/library";
import { invokeOrFallback } from "./tauri";
import {
  deleteMockPlaylist,
  listMockPlaylists,
  saveMockPlaylist,
  importMockTrack,
  listMockTracks,
  seedMockTracks,
  updateMockTrackAnalysis,
  updateMockTrackPerformance,
} from "./mockLibrary";

export async function listTracks(): Promise<LibraryTrack[]> {
  return invokeOrFallback("list_tracks", undefined, () => listMockTracks());
}

export async function listPlaylists(): Promise<BaseTrackPlaylist[]> {
  return invokeOrFallback("list_playlists", undefined, () => listMockPlaylists());
}

export async function importTrack(
  input: ImportTrackInput,
): Promise<LibraryTrack> {
  return invokeOrFallback("import_track", { input }, () => importMockTrack(input));
}

export async function seedDemoTracks(): Promise<LibraryTrack[]> {
  return invokeOrFallback("seed_demo_tracks", undefined, () => seedMockTracks());
}

export async function saveBaseTrackPlaylist(
  input: SaveBaseTrackPlaylistInput,
): Promise<BaseTrackPlaylist> {
  return invokeOrFallback(
    "save_playlist",
    { input },
    () => saveMockPlaylist(input),
  );
}

export async function deleteBaseTrackPlaylist(
  playlistId: string,
): Promise<void> {
  return invokeOrFallback(
    "delete_playlist",
    { playlistId },
    () => deleteMockPlaylist(playlistId),
  );
}

export async function pickTrackSourcePath(
  initialPath?: string,
): Promise<string | null> {
  return invokeOrFallback(
    "pick_track_source_path",
    { initialPath: initialPath?.trim() || undefined },
    () => null,
  );
}

export async function checkTrackExists(sourcePath: string): Promise<boolean> {
  return invokeOrFallback("check_file_exists", { path: sourcePath }, () => true);
}

export async function deleteTrack(trackId: string): Promise<void> {
  return invokeOrFallback("delete_track", { trackId }, () => {
    console.log("Mock delete track:", trackId);
  });
}

export async function updateTrackPerformance(
  trackId: string,
  input: UpdateTrackPerformanceInput,
): Promise<LibraryTrack> {
  return invokeOrFallback(
    "update_track_performance",
    { trackId, input },
    () => updateMockTrackPerformance(trackId, input),
  );
}

export async function updateTrackAnalysis(
  trackId: string,
  input: UpdateTrackAnalysisInput,
): Promise<LibraryTrack> {
  return invokeOrFallback(
    "update_track_analysis",
    { trackId, input },
    () => updateMockTrackAnalysis(trackId, input),
  );
}
