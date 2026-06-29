import type { PlaylistSourceAuth, PlaylistMetadata } from "../runtime/types";
import { isoToDisplayDate } from "../runtime/normalization";

export interface SourceCardViewModel {
  id: string;
  displayName: string;
  sourceType: string;
  playlistCount: number;
  lastSyncedAt: string;
  isLoading: boolean;
  canDisconnect: boolean;
}

export interface PlaylistSourcesViewModel {
  cards: SourceCardViewModel[];
  totalPlaylists: number;
  isEmpty: boolean;
}

export function buildPlaylistSourcesViewModel(input: {
  sources: PlaylistSourceAuth[];
  playlists: PlaylistMetadata[];
  loading: boolean;
}): PlaylistSourcesViewModel {
  const { sources, playlists, loading } = input;

  const cards: SourceCardViewModel[] = sources.map((source) => {
    const sourcePlaylistCount = playlists.filter((p) => p.sourceId === source.id).length;
    const lastSyncDisplay = source.lastSyncedAt
      ? isoToDisplayDate(source.lastSyncedAt)
      : "Never synced";

    return {
      id: source.id,
      displayName: source.displayName,
      sourceType: source.sourceType,
      playlistCount: sourcePlaylistCount,
      lastSyncedAt: lastSyncDisplay,
      isLoading: loading,
      canDisconnect: true,
    };
  });

  return {
    cards,
    totalPlaylists: playlists.length,
    isEmpty: sources.length === 0,
  };
}
