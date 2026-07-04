import {
  resolveLibraryMonitorGuideState,
  resolvePlaylistArmState,
  resolveSessionMonitorGuideState,
  resolveTrackArmState,
  type AppArmState,
  type AppMonitorGuideState,
} from "../appRuntime";
import type {
  AppMonitorLibraryGuideEffectInput,
  AppMonitorPlaylistArmInput,
  AppMonitorSessionArmInput,
  AppMonitorSessionGuideInput,
  AppMonitorTrackArmInput,
} from "./appMonitorGuideActionsHookRuntime";

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

export function performTrackArm(input: AppMonitorTrackArmInput): void {
  const nextState = resolveTrackArmState(input.trackId, input.tracks);
  applyLibraryArmState(nextState, {
    setSelectedPlaylistId: input.setSelectedPlaylistId,
    setSelectedTrackId: input.setSelectedTrackId,
  });
}

export function performPlaylistArm(input: AppMonitorPlaylistArmInput): void {
  const nextState = resolvePlaylistArmState(input.playlistId, input.playlists, input.tracks);
  applyLibraryArmState(nextState, {
    setSelectedPlaylistId: input.setSelectedPlaylistId,
    setSelectedTrackId: input.setSelectedTrackId,
  });
}

export function syncLibraryMonitorGuide(input: AppMonitorLibraryGuideEffectInput): void {
  const guideState = resolveLibraryMonitorGuideState({
    selectedPlaylist: input.selectedPlaylist,
    selectedTrack: input.selectedTrack,
    tracks: input.tracks,
  });

  applyMonitorGuideState(guideState, {
    setGuideTrack: input.setGuideTrack,
    setGuideTrackPlaylist: input.setGuideTrackPlaylist,
  });
}

export function performSessionGuidePrime(input: AppMonitorSessionGuideInput): void {
  const guideState = resolveSessionMonitorGuideState(input.draft, input.playlists, input.tracks);
  applyMonitorGuideState(guideState, {
    setGuideTrack: input.setGuideTrack,
    setGuideTrackPlaylist: input.setGuideTrackPlaylist,
  });
}

export function performSessionArm(input: AppMonitorSessionArmInput): void {
  if (input.draft?.playlistId) {
    input.armPlaylistBase(input.draft.playlistId);
    return;
  }

  if (input.draft?.trackId) {
    input.armTrackBase(input.draft.trackId);
    return;
  }

  clearLibraryArmState({
    setSelectedPlaylistId: input.setSelectedPlaylistId,
    setSelectedTrackId: input.setSelectedTrackId,
  });
}
