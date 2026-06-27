import { useEffect, useState } from "react";

import { listLogSourceConnections } from "../../api/repositories";
import type { BaseTrackPlaylist, LogSourceConnection, SaveBaseTrackPlaylistInput } from "../../types/library";
import type { LibraryTab } from "./LibraryScreen";

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
      setLogConnectionError(error instanceof Error ? error.message : String(error));
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
    const selectedPlaylist =
      playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null;

    if (!selectedPlaylist) {
      if (!playlistEditorOpen) {
        setPlaylistEditorId(null);
        setPlaylistName("");
        setPlaylistTrackIds([]);
      }
      return;
    }

    if (playlistEditorOpen && playlistEditorId === selectedPlaylist.id) {
      setPlaylistName(selectedPlaylist.name);
      setPlaylistTrackIds(selectedPlaylist.trackIds);
    }
  }, [playlistEditorId, playlistEditorOpen, playlists, selectedPlaylistId]);

  function openPlaylistEditor(playlist?: BaseTrackPlaylist) {
    setPlaylistEditorOpen(true);
    setPlaylistEditorId(playlist?.id ?? null);
    setPlaylistName(playlist?.name ?? "");
    setPlaylistTrackIds(playlist?.trackIds ?? []);
    if (playlist) {
      onSelectPlaylist(playlist.id);
    }
  }

  function resetPlaylistEditor() {
    setPlaylistEditorOpen(false);
    setPlaylistEditorId(null);
    setPlaylistName("");
    setPlaylistTrackIds([]);
  }

  function togglePlaylistTrack(trackId: string) {
    setPlaylistTrackIds((current) =>
      current.includes(trackId) ? current.filter((id) => id !== trackId) : [...current, trackId],
    );
  }

  async function handleSavePlaylist() {
    const ok = await onSavePlaylist({
      id: playlistEditorId ?? undefined,
      name: playlistName,
      trackIds: playlistTrackIds,
    });

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
