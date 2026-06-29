import { useMemo, useState } from "react";

import type {
  BaseTrackPlaylist,
  LibraryTrack,
} from "../types/library";
import { useLibraryBootstrap } from "./useLibraryBootstrap";
import { useLibraryMutationActions } from "./useLibraryMutationActions";

export function useLibrary() {
  const [tracks, setTracks] = useState<LibraryTrack[]>([]);
  const [playlists, setPlaylists] = useState<BaseTrackPlaylist[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLibraryBootstrap({
    setTracks,
    setPlaylists,
    setSelectedTrackId,
    setSelectedPlaylistId,
    setLoading,
    setError,
  });

  const actions = useLibraryMutationActions({
    tracks,
    setTracks,
    setPlaylists,
    setSelectedTrackId,
    setSelectedPlaylistId,
    setMutating,
    setError,
  });

  const selectedTrack = useMemo(
    () => tracks.find((track) => track.id === selectedTrackId) ?? null,
    [selectedTrackId, tracks],
  );
  const selectedPlaylist = useMemo(
    () => playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null,
    [playlists, selectedPlaylistId],
  );

  return {
    tracks,
    playlists,
    selectedTrack,
    selectedPlaylist,
    selectedTrackId,
    selectedPlaylistId,
    setSelectedTrackId,
    setSelectedPlaylistId,
    loading,
    mutating,
    error,
    ...actions,
  };
}
