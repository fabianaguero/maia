import { useEffect, useState } from "react";

import { listLogSourceConnections } from "../../api/repositories";
import type {
  BaseTrackPlaylist,
  LogSourceConnection,
  SaveBaseTrackPlaylistInput,
} from "../../types/library";
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
import {
  buildLibraryScreenPlaylistSaveHookInput,
  buildLibraryScreenPlaylistSyncInput,
  buildLibraryScreenRefreshConnectionsInput,
  buildLibraryScreenStateHookResult,
  buildLibraryScreenTabChangeHookState,
} from "./libraryScreenStateHookRuntime";

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
    const nextState = buildLibraryScreenTabChangeHookState({
      nextTab: next,
      setTab,
      onTabChange,
      setShowForm,
    });
    nextState.setTab(nextState.nextTab);
    nextState.onTabChange?.(nextState.nextTab);
    nextState.setShowForm(false);
  }

  async function refreshLogConnections(): Promise<void> {
    try {
      setLogConnectionError(null);
      const refreshInput = buildLibraryScreenRefreshConnectionsInput({
        setLogConnectionError,
        setLogConnections,
        listLogSourceConnections,
      });
      refreshInput.setLogConnections(await refreshInput.listLogSourceConnections());
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
    const syncInput = buildLibraryScreenPlaylistSyncInput({
      playlistEditorOpen,
      playlistEditorId,
      playlists,
      selectedPlaylistId,
    });
    const nextState = buildLibraryPlaylistEditorSyncState({
      playlistEditorOpen: syncInput.playlistEditorOpen,
      playlistEditorId: syncInput.playlistEditorId,
      selectedPlaylist: resolveSelectedLibraryPlaylist(
        syncInput.playlists,
        syncInput.selectedPlaylistId,
      ),
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
    const saveInput = buildLibraryScreenPlaylistSaveHookInput({
      onSavePlaylist,
      playlistEditorId,
      playlistName,
      playlistTrackIds,
    });
    const ok = await saveInput.onSavePlaylist(
      buildLibraryPlaylistSaveInput(saveInput.playlistSaveInput),
    );

    if (ok) {
      resetPlaylistEditor();
    }
  }

  return buildLibraryScreenStateHookResult({
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
  });
}
