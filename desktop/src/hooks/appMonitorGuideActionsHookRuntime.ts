import type { SessionMonitorDraft } from "../appMonitorActionsRuntime";
import type { UseAppMonitorActionsInput } from "./appMonitorActionsTypes";

type GuideActionsInput = Pick<UseAppMonitorActionsInput, "library" | "monitor">;

export interface AppMonitorTrackArmInput {
  trackId: string | null | undefined;
  tracks: GuideActionsInput["library"]["tracks"];
  setSelectedPlaylistId: GuideActionsInput["library"]["setSelectedPlaylistId"];
  setSelectedTrackId: GuideActionsInput["library"]["setSelectedTrackId"];
}

export interface AppMonitorPlaylistArmInput {
  playlistId: string | null | undefined;
  playlists: GuideActionsInput["library"]["playlists"];
  tracks: GuideActionsInput["library"]["tracks"];
  setSelectedPlaylistId: GuideActionsInput["library"]["setSelectedPlaylistId"];
  setSelectedTrackId: GuideActionsInput["library"]["setSelectedTrackId"];
}

export interface AppMonitorLibraryGuideEffectInput {
  selectedPlaylist: GuideActionsInput["library"]["selectedPlaylist"];
  selectedTrack: GuideActionsInput["library"]["selectedTrack"];
  tracks: GuideActionsInput["library"]["tracks"];
  setGuideTrack: GuideActionsInput["monitor"]["setGuideTrack"];
  setGuideTrackPlaylist: GuideActionsInput["monitor"]["setGuideTrackPlaylist"];
}

export interface AppMonitorSessionGuideInput {
  draft?: SessionMonitorDraft;
  playlists: GuideActionsInput["library"]["playlists"];
  tracks: GuideActionsInput["library"]["tracks"];
  setGuideTrack: GuideActionsInput["monitor"]["setGuideTrack"];
  setGuideTrackPlaylist: GuideActionsInput["monitor"]["setGuideTrackPlaylist"];
}

export interface AppMonitorSessionArmInput {
  draft?: SessionMonitorDraft;
  armPlaylistBase: (playlistId: string | null | undefined) => void;
  armTrackBase: (trackId: string | null | undefined) => void;
  setSelectedPlaylistId: GuideActionsInput["library"]["setSelectedPlaylistId"];
  setSelectedTrackId: GuideActionsInput["library"]["setSelectedTrackId"];
}

export function buildAppMonitorTrackArmInput(
  input: GuideActionsInput,
  trackId: string | null | undefined,
): AppMonitorTrackArmInput {
  return {
    trackId,
    tracks: input.library.tracks,
    setSelectedPlaylistId: input.library.setSelectedPlaylistId,
    setSelectedTrackId: input.library.setSelectedTrackId,
  };
}

export function buildAppMonitorPlaylistArmInput(
  input: GuideActionsInput,
  playlistId: string | null | undefined,
): AppMonitorPlaylistArmInput {
  return {
    playlistId,
    playlists: input.library.playlists,
    tracks: input.library.tracks,
    setSelectedPlaylistId: input.library.setSelectedPlaylistId,
    setSelectedTrackId: input.library.setSelectedTrackId,
  };
}

export function buildAppMonitorLibraryGuideEffectInput(
  input: GuideActionsInput,
): AppMonitorLibraryGuideEffectInput {
  return {
    selectedPlaylist: input.library.selectedPlaylist,
    selectedTrack: input.library.selectedTrack,
    tracks: input.library.tracks,
    setGuideTrack: input.monitor.setGuideTrack,
    setGuideTrackPlaylist: input.monitor.setGuideTrackPlaylist,
  };
}

export function buildAppMonitorSessionGuideInput(
  input: GuideActionsInput,
  draft?: SessionMonitorDraft,
): AppMonitorSessionGuideInput {
  return {
    draft,
    playlists: input.library.playlists,
    tracks: input.library.tracks,
    setGuideTrack: input.monitor.setGuideTrack,
    setGuideTrackPlaylist: input.monitor.setGuideTrackPlaylist,
  };
}

export function buildAppMonitorSessionArmInput(
  input: GuideActionsInput,
  draft: SessionMonitorDraft | undefined,
  armPlaylistBase: (playlistId: string | null | undefined) => void,
  armTrackBase: (trackId: string | null | undefined) => void,
): AppMonitorSessionArmInput {
  return {
    draft,
    armPlaylistBase,
    armTrackBase,
    setSelectedPlaylistId: input.library.setSelectedPlaylistId,
    setSelectedTrackId: input.library.setSelectedTrackId,
  };
}
