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

export interface AppMonitorGuideActionRunners {
  armTrackBase: (trackId: string | null | undefined) => void;
  armPlaylistBase: (playlistId: string | null | undefined) => void;
  armSessionMusicalBase: (draft?: { playlistId?: string; trackId?: string }) => void;
  primeMonitorGuideTrack: (draft?: { playlistId?: string; trackId?: string }) => void;
}

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

export function buildAppMonitorGuideActionRunners(input: {
  buildTrackArmInput: (trackId: string | null | undefined) => AppMonitorTrackArmInput;
  buildPlaylistArmInput: (playlistId: string | null | undefined) => AppMonitorPlaylistArmInput;
  buildSessionArmInput: (
    draft: { playlistId?: string; trackId?: string } | undefined,
    armPlaylistBase: (playlistId: string | null | undefined) => void,
    armTrackBase: (trackId: string | null | undefined) => void,
  ) => AppMonitorSessionArmInput;
  buildSessionGuideInput: (draft?: {
    playlistId?: string;
    trackId?: string;
  }) => AppMonitorSessionGuideInput;
}): AppMonitorGuideActionRunners {
  const armTrackBase = (trackId: string | null | undefined) => {
    performTrackArm(input.buildTrackArmInput(trackId));
  };

  const armPlaylistBase = (playlistId: string | null | undefined) => {
    performPlaylistArm(input.buildPlaylistArmInput(playlistId));
  };

  return {
    armTrackBase,
    armPlaylistBase,
    armSessionMusicalBase: (draft) => {
      performSessionArm(input.buildSessionArmInput(draft, armPlaylistBase, armTrackBase));
    },
    primeMonitorGuideTrack: (draft) => {
      performSessionGuidePrime(input.buildSessionGuideInput(draft));
    },
  };
}
