import { useState, useEffect, useCallback, useRef } from "react";
import type {
  PlaylistSourceAuth,
  PlaylistMetadata,
  RemoteTrackMetadata,
  ProviderError,
} from "../runtime/types";
import {
  createEmptyPlaylistTrackMap,
  disconnectPlaylistSourceState,
  mergeSourcePlaylists,
  normalizePlaylistSourceError,
  resolvePlaylistsForSource,
  syncPlaylistSourcePlaylists,
} from "./playlistSourcesRuntime";

interface PlaylistSourcesDependencies {
  loadSources?: () => Promise<PlaylistSourceAuth[]>;
  initiateOAuthFlow?: (sourceType: "spotify" | "soundcloud") => Promise<void>;
  addLocalDirectoryEntry?: (dirPath: string) => Promise<void>;
  disconnectSourceEntry?: (sourceId: string) => Promise<void>;
  syncSourcePlaylists?: (input: {
    source: PlaylistSourceAuth | undefined;
    signal?: AbortSignal;
  }) => Promise<PlaylistMetadata[]>;
  createAbortController?: () => AbortController;
}

const defaultLoadSources = async (): Promise<PlaylistSourceAuth[]> => [];

const defaultInitiateOAuthFlow = async (sourceType: "spotify" | "soundcloud"): Promise<void> => {
  console.log(`Initiating OAuth for ${sourceType}`);
};

const defaultAddLocalDirectoryEntry = async (dirPath: string): Promise<void> => {
  console.log(`Adding local directory: ${dirPath}`);
};

const defaultDisconnectSourceEntry = async (): Promise<void> => {};

const defaultCreateAbortController = (): AbortController => new AbortController();

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

export function usePlaylistSources(
  dependencies: PlaylistSourcesDependencies = {},
): UsePlaylistSourcesReturn {
  const [sources, setSources] = useState<PlaylistSourceAuth[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistMetadata[]>([]);
  const [tracks] = useState<Map<string, RemoteTrackMetadata[]>>(createEmptyPlaylistTrackMap);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ProviderError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const {
    loadSources = defaultLoadSources,
    initiateOAuthFlow = defaultInitiateOAuthFlow,
    addLocalDirectoryEntry = defaultAddLocalDirectoryEntry,
    disconnectSourceEntry = defaultDisconnectSourceEntry,
    syncSourcePlaylists = syncPlaylistSourcePlaylists,
    createAbortController = defaultCreateAbortController,
  } = dependencies;

  // Load sources from DB on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const dbSources = await loadSources();
        setSources(dbSources);
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
  }, [loadSources]);

  const initiateOAuth = useCallback(
    async (sourceType: "spotify" | "soundcloud") => {
      setLoading(true);
      setError(null);
      try {
        await initiateOAuthFlow(sourceType);
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
    [initiateOAuthFlow],
  );

  const addLocalDirectory = useCallback(
    async (dirPath: string) => {
      setLoading(true);
      setError(null);
      try {
        await addLocalDirectoryEntry(dirPath);
      } catch (err) {
        console.error("Error adding local directory:", err);
        setError({
          kind: "unknown",
          message: "Failed to add local directory",
        });
      } finally {
        setLoading(false);
      }
    },
    [addLocalDirectoryEntry],
  );

  const syncSource = useCallback(
    async (sourceId: string) => {
      setLoading(true);
      setError(null);
      abortControllerRef.current = createAbortController();

      try {
        const source = sources.find((s) => s.id === sourceId);
        if (!source) {
          throw { kind: "not_found", resourceId: sourceId } as ProviderError;
        }

        const newPlaylists = await syncSourcePlaylists({
          source,
          signal: abortControllerRef.current.signal,
        });

        setPlaylists((prev) => {
          return mergeSourcePlaylists(prev, sourceId, newPlaylists);
        });

        // TODO: Save to DB
        setError(null);
      } catch (err) {
        console.error("Sync error:", err);
        setError(normalizePlaylistSourceError(err, "Unknown sync error"));
      } finally {
        setLoading(false);
      }
    },
    [createAbortController, sources, syncSourcePlaylists],
  );

  const listPlaylistsForSource = useCallback(
    async (sourceId: string): Promise<PlaylistMetadata[]> => {
      return resolvePlaylistsForSource(playlists, sourceId);
    },
    [playlists],
  );

  const disconnectSource = useCallback(
    async (sourceId: string) => {
      setLoading(true);
      try {
        await disconnectSourceEntry(sourceId);
        setSources((prev) => disconnectPlaylistSourceState(prev, [], sourceId).sources);
        setPlaylists((prev) => disconnectPlaylistSourceState([], prev, sourceId).playlists);
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
    },
    [disconnectSourceEntry],
  );

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
