import { useCallback } from "react";
import { useUserMode } from "./UserModeContext";
import type { LibraryViewAdapter } from "./LibraryViewAdapter";
import { createLibraryAdapter } from "./LibraryViewAdapter";
import type {
  LibraryTrack,
  RepositoryAnalysis,
  BaseAssetRecord,
  ImportRepositoryInput,
  ImportBaseAssetInput,
} from "../../types/library";

/**
 * Hook: Unified library state management
 * Provides single interface regardless of UI mode
 * Behavior common to both simple and expert modes
 */
export function useUnifiedLibraryState(props: {
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
  selectedRepositoryId: string | null;

  onSelectRepository: (repositoryId: string) => void;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  onImportBaseAsset: (input: ImportBaseAssetInput) => Promise<boolean>;
  onStartMonitoring?: (repoId: string) => void;
}): LibraryViewAdapter {
  const { userMode } = useUserMode();

  // Wrapped callbacks with mode-agnostic behavior
  const handleSelectRepository = useCallback(
    (repositoryId: string) => {
      props.onSelectRepository(repositoryId);
    },
    [props]
  );

  const handleImportRepository = useCallback(
    async (input: ImportRepositoryInput) => {
      return props.onImportRepository(input);
    },
    [props]
  );

  const handleImportBaseAsset = useCallback(
    async (input: ImportBaseAssetInput) => {
      return props.onImportBaseAsset(input);
    },
    [props]
  );

  const handleStartMonitoring = useCallback(
    (repoId: string) => {
      props.onStartMonitoring?.(repoId);
    },
    [props]
  );

  // Create mode-appropriate adapter
  return createLibraryAdapter(userMode, {
    tracks: props.tracks,
    repositories: props.repositories,
    baseAssets: props.baseAssets,
    selectedRepositoryId: props.selectedRepositoryId,

    onSelectRepository: handleSelectRepository,
    onImportRepository: handleImportRepository,
    onImportBaseAsset: handleImportBaseAsset,
    onStartMonitoring: handleStartMonitoring,
  });
}
