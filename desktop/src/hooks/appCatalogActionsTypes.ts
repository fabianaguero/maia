import type { AppTranslations } from "../i18n/types";
import type {
  BaseTrackPlaylist,
  ImportBaseAssetInput,
  ImportCompositionInput,
  ImportRepositoryInput,
  ImportTrackInput,
  LibraryTrack,
  RelinkMissingTracksResult,
  RepositoryAnalysis,
  SaveBaseTrackPlaylistInput,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../types/library";

export type { AppTranslations };

export interface UseAppCatalogActionsInput {
  t: AppTranslations;
  notify: (tone: "success" | "error" | "info", title: string, body: string) => void;
  setNewlyImportedId: (id: string | null) => void;
  setAnalysisMode: (mode: "track" | "repo" | "base") => void;
  setScreen: (screen: "inspect" | "compose") => void;
  library: {
    importLibraryTrack: (input: ImportTrackInput) => Promise<LibraryTrack | null>;
    reanalyzeTrack: (trackId: string) => Promise<LibraryTrack | null>;
    relinkTrack: (trackId: string) => Promise<LibraryTrack | null>;
    relinkMissingTracksFromDirectory: () => Promise<RelinkMissingTracksResult | null>;
    deleteLibraryTrack: (trackId: string) => Promise<boolean>;
    updateTrackPerformance: (
      trackId: string,
      input: UpdateTrackPerformanceInput,
    ) => Promise<LibraryTrack | null>;
    updateTrackAnalysis: (
      trackId: string,
      input: UpdateTrackAnalysisInput,
    ) => Promise<LibraryTrack | null>;
    savePlaylist: (input: SaveBaseTrackPlaylistInput) => Promise<BaseTrackPlaylist | null>;
    deletePlaylist: (playlistId: string) => Promise<boolean>;
  };
  repositories: {
    importRepositorySource: (input: ImportRepositoryInput) => Promise<RepositoryAnalysis | null>;
    reanalyzeRepository: (repositoryId: string) => Promise<RepositoryAnalysis | null>;
    deleteLibraryRepository: (repositoryId: string) => Promise<boolean>;
  };
  baseAssets: {
    importLibraryBaseAsset: (
      input: ImportBaseAssetInput,
    ) => Promise<{ id: string; title: string } | null>;
  };
  compositions: {
    importLibraryComposition: (input: ImportCompositionInput) => Promise<{ title: string } | null>;
  };
}
