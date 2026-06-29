import { useEffect, useState } from "react";

import { listLogSourceConnections } from "../../api/repositories";
import type { BaseTrackPlaylist, LogSourceConnection, SaveBaseTrackPlaylistInput } from "../../types/library";
import type { LibraryTab } from "./libraryScreenTypes";
import {
  buildLibraryPlaylistEditorOpenState,
  buildLibraryPlaylistEditorResetState,
  buildLibraryPlaylistEditorSyncState,
  buildLibraryPlaylistSaveInput,
  resolveLibraryLogConnectionError,
  resolveSelectedLibraryPlaylist,
  toggleLibraryPlaylistTrackId,
} from "./libraryScreenStateRuntime";

interface UseLibraryScreenStateInput {
  activeTab?: LibraryTab;
  onSavePlaylist: (input: SaveBaseTrackPlaylistInput) => Promise<boolean>;
  onSelectPlaylist: (playlistId: string) => void;
  onTabChange?: (tab: LibraryTab) => void;
  playlists: BaseTrackPlaylist[];
  selectedPlaylistId: string | null;
}

export function useLibraryScreenState({
  activeTab,
  onSavePlaylist,
  onSelectPlaylist,
  onTabChange,
  playlists,
  selectedPlaylistId,
}: UseLibraryScreenStateInput) {
  const [tab, setTab] = useState<LibraryTab>(activeTab ?? "tracks");
  const [logConnections, setLogConnections] = useState<LogSourceConnection[]>([]);
  const [logConnectionError, setLogConnectionError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [playlistEditorOpen, setPlaylistEditorOpen] = useState(false);
  const [playlistEditorId, setPlaylistEditorId] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistTrackIds, setPlaylistTrackIds] = useState<string[]>([]);

  function handleTabChange(next: LibraryTab) {
    setTab(next);
    onTabChange?.(next);
    setShowForm(false);
  }

  async function refreshLogConnections(): Promise<void> {
    try {
      setLogConnectionError(null);
      setLogConnections(await listLogSourceConnections());
    } catch (error) {
      setLogConnectionError(resolveLibraryLogConnectionError(error));
    }
  }

  useEffect(() => {
    void refreshLogConnections();
  }, []);

  useEffect(() => {
    if (activeTab) {
      setTab(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const nextState = buildLibraryPlaylistEditorSyncState({
      playlistEditorOpen,
      playlistEditorId,
      selectedPlaylist: resolveSelectedLibraryPlaylist(playlists, selectedPlaylistId),
    });

    if (nextState) {
      setPlaylistEditorOpen(nextState.playlistEditorOpen);
      setPlaylistEditorId(nextState.playlistEditorId);
      setPlaylistName(nextState.playlistName);
      setPlaylistTrackIds(nextState.playlistTrackIds);
    }
  }, [playlistEditorId, playlistEditorOpen, playlists, selectedPlaylistId]);

  function openPlaylistEditor(playlist?: BaseTrackPlaylist) {
    const nextState = buildLibraryPlaylistEditorOpenState(playlist);
    setPlaylistEditorOpen(nextState.playlistEditorOpen);
    setPlaylistEditorId(nextState.playlistEditorId);
    setPlaylistName(nextState.playlistName);
    setPlaylistTrackIds(nextState.playlistTrackIds);
    if (playlist) {
      onSelectPlaylist(playlist.id);
    }
  }

  function resetPlaylistEditor() {
    const nextState = buildLibraryPlaylistEditorResetState();
    setPlaylistEditorOpen(nextState.playlistEditorOpen);
    setPlaylistEditorId(nextState.playlistEditorId);
    setPlaylistName(nextState.playlistName);
    setPlaylistTrackIds(nextState.playlistTrackIds);
  }

  function togglePlaylistTrack(trackId: string) {
    setPlaylistTrackIds((current) => toggleLibraryPlaylistTrackId(current, trackId));
  }

  async function handleSavePlaylist() {
    const ok = await onSavePlaylist(
      buildLibraryPlaylistSaveInput({
        playlistEditorId,
        playlistName,
        playlistTrackIds,
      }),
    );

    if (ok) {
      resetPlaylistEditor();
    }
  }

  return {
    tab,
    handleTabChange,
    logConnections,
    logConnectionError,
    setLogConnectionError,
    showForm,
    setShowForm,
    playlistEditorOpen,
    playlistEditorId,
    playlistName,
    setPlaylistName,
    playlistTrackIds,
    openPlaylistEditor,
    resetPlaylistEditor,
    togglePlaylistTrack,
    handleSavePlaylist,
    refreshLogConnections,
  };
}
