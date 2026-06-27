import { useState, useEffect, useCallback, useRef } from "react";
import type {
  PlaylistSourceAuth,
  PlaylistMetadata,
  RemoteTrackMetadata,
  ProviderError,
} from "../runtime/types";
import { listSpotifyPlaylists, listTracksInSpotifyPlaylist } from "../runtime/spotify";
import { listSoundCloudPlaylists, listTracksInSoundCloudPlaylist } from "../runtime/soundcloud";

export interface UsePlaylistSourcesReturn {
  sources: PlaylistSourceAuth[];
  playlists: PlaylistMetadata[];
  tracks: Map<string, RemoteTrackMetadata[]>;
  loading: boolean;
  error: ProviderError | null;

  initiateOAuth: (sourceType: "spotify" | "soundcloud") => Promise<void>;
  addLocalDirectory: (dirPath: string) => Promise<void>;
  listPlaylistsForSource: (sourceId: string) => Promise<PlaylistMetadata[]>;
  syncSource: (sourceId: string) => Promise<void>;
  disconnectSource: (sourceId: string) => Promise<void>;
  clearError: () => void;
}

export function usePlaylistSources(): UsePlaylistSourcesReturn {
  const [sources, setSources] = useState<PlaylistSourceAuth[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistMetadata[]>([]);
  const [tracks, setTracks] = useState<Map<string, RemoteTrackMetadata[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ProviderError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load sources from DB on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // TODO: Call Tauri invoke to load from DB
        // const dbSources = await listProviderSourcesFromDB();
        // setSources(dbSources);
        setError(null);
      } catch (err) {
        console.error("Error loading sources:", err);
        setError({
          kind: "unknown",
          message: "Failed to load provider sources",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const initiateOAuth = useCallback(
    async (sourceType: "spotify" | "soundcloud") => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Implement OAuth flow (will need Tauri invoke)
        console.log(`Initiating OAuth for ${sourceType}`);
      } catch (err) {
        console.error("OAuth error:", err);
        setError({
          kind: "unknown",
          message: `Failed to authenticate with ${sourceType}`,
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const addLocalDirectory = useCallback(async (dirPath: string) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Implement local directory addition
      console.log(`Adding local directory: ${dirPath}`);
    } catch (err) {
      console.error("Error adding local directory:", err);
      setError({
        kind: "unknown",
        message: "Failed to add local directory",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const syncSource = useCallback(async (sourceId: string) => {
    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const source = sources.find((s) => s.id === sourceId);
      if (!source) {
        throw { kind: "not_found", resourceId: sourceId } as ProviderError;
      }

      // Route to appropriate runtime based on source type
      let newPlaylists: PlaylistMetadata[] = [];

      if (source.sourceType === "spotify" && source.oauthToken) {
        newPlaylists = await listSpotifyPlaylists({
          auth: source,
          signal: abortControllerRef.current.signal,
        });
      } else if (source.sourceType === "soundcloud" && source.oauthToken) {
        newPlaylists = await listSoundCloudPlaylists({
          auth: source,
          signal: abortControllerRef.current.signal,
        });
      }

      setPlaylists((prev) => {
        // Remove old playlists from this source, add new ones
        const filtered = prev.filter((p) => p.sourceId !== sourceId);
        return [...filtered, ...newPlaylists];
      });

      // TODO: Save to DB
      setError(null);
    } catch (err) {
      console.error("Sync error:", err);
      if (err && typeof err === "object" && "kind" in err) {
        setError(err as ProviderError);
      } else {
        setError({
          kind: "unknown",
          message: "Unknown sync error",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [sources]);

  const listPlaylistsForSource = useCallback(
    async (sourceId: string): Promise<PlaylistMetadata[]> => {
      return playlists.filter((p) => p.sourceId === sourceId);
    },
    [playlists],
  );

  const disconnectSource = useCallback(async (sourceId: string) => {
    setLoading(true);
    try {
      // TODO: Delete from DB
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
      setPlaylists((prev) => prev.filter((p) => p.sourceId !== sourceId));
      setError(null);
    } catch (err) {
      console.error("Disconnect error:", err);
      setError({
        kind: "unknown",
        message: "Failed to disconnect source",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sources,
    playlists,
    tracks,
    loading,
    error,
    initiateOAuth,
    addLocalDirectory,
    listPlaylistsForSource,
    syncSource,
    disconnectSource,
    clearError,
  };
}
