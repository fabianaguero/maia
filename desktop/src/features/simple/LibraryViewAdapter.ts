import type {
  LibraryTrack,
  RepositoryAnalysis,
  BaseAssetRecord,
  ImportRepositoryInput,
  ImportBaseAssetInput,
} from "../../types/library";

/**
 * Adapter: Unified interface for library operations
 * Decouples UI presentation (simple vs expert) from business logic
 */
export interface LibraryViewAdapter {
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
  selectedRepositoryId: string | null;

  onSelectRepository: (repositoryId: string) => void;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  onImportBaseAsset: (input: ImportBaseAssetInput) => Promise<boolean>;
  onStartMonitoring?: (repoId: string, trackId?: string) => void;

  // UI configuration per mode
  showAnalysisTabs: boolean; // expert: true, simple: false
  showCompositionTools: boolean; // expert: true, simple: false
  showPlaylistManagement: boolean; // expert: true, simple: false
}

/**
 * Factory: Creates adapter instance configured for current mode
 */
export function createLibraryAdapter(
  mode: "simple" | "expert",
  config: Omit<
    LibraryViewAdapter,
    "showAnalysisTabs" | "showCompositionTools" | "showPlaylistManagement"
  >,
): LibraryViewAdapter {
  const baseAdapter = {
    ...config,
    showAnalysisTabs: mode === "expert",
    showCompositionTools: mode === "expert",
    showPlaylistManagement: mode === "expert",
  };

  return baseAdapter as LibraryViewAdapter;
}
