import type { AppArmState, AppMonitorGuideState } from "../appRuntime";

export function applyLibraryArmState(
  state: AppArmState,
  input: {
    setSelectedPlaylistId: (playlistId: string | null) => void;
    setSelectedTrackId: (trackId: string | null) => void;
  },
) {
  input.setSelectedPlaylistId(state.selectedPlaylistId);
  input.setSelectedTrackId(state.selectedTrackId);
}

export function clearLibraryArmState(input: {
  setSelectedPlaylistId: (playlistId: string | null) => void;
  setSelectedTrackId: (trackId: string | null) => void;
}) {
  input.setSelectedPlaylistId(null);
  input.setSelectedTrackId(null);
}

export function applyMonitorGuideState(
  state: AppMonitorGuideState,
  input: {
    setGuideTrack: (path: string | null) => void;
    setGuideTrackPlaylist: (paths: string[]) => void;
  },
) {
  if (state.playlistPaths) {
    input.setGuideTrackPlaylist(state.playlistPaths);
    return;
  }

  input.setGuideTrack(state.trackPath);
}
