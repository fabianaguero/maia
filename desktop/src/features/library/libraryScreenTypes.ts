import type { BootstrapManifest } from "../../contracts";
import type { BaseAssetCategoryOption } from "../../types/baseAsset";
import type { MusicStyleOption } from "../../types/music";
import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  CompositionResultRecord,
  ImportBaseAssetInput,
  ImportCompositionInput,
  ImportRepositoryInput,
  ImportTrackInput,
  LibraryTrack,
  RepositoryAnalysis,
  SaveBaseTrackPlaylistInput,
} from "../../types/library";

export type LibraryTab = "tracks" | "sources" | "connections" | "bases";

export interface LibraryScreenProps {
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
  compositions: CompositionResultRecord[];
  newlyImportedId?: string | null;
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
  selectedRepositoryId: string | null;
  selectedBaseAssetId: string | null;
  selectedCompositionId: string | null;
  activeTab?: LibraryTab;
  onTabChange?: (tab: LibraryTab) => void;
  manifest: BootstrapManifest | null;
  musicStyles: MusicStyleOption[];
  baseAssetCategories: BaseAssetCategoryOption[];
  defaultTrackMusicStyleId?: string;
  defaultBaseAssetCategoryId?: string;
  trackLoading: boolean;
  repositoryLoading: boolean;
  baseAssetLoading: boolean;
  compositionLoading: boolean;
  trackBusy: boolean;
  repositoryBusy: boolean;
  baseAssetBusy: boolean;
  compositionBusy: boolean;
  trackError: string | null;
  repositoryError: string | null;
  baseAssetError: string | null;
  compositionError: string | null;
  onImportTrack: (input: ImportTrackInput) => Promise<boolean>;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  onImportBaseAsset: (input: ImportBaseAssetInput) => Promise<boolean>;
  onImportComposition: (input: ImportCompositionInput) => Promise<boolean>;
  onReanalyzeTrack: (trackId: string) => Promise<boolean>;
  onRelinkTrack: (trackId: string) => Promise<boolean>;
  onRelinkMissingTracks: () => Promise<boolean>;
  onReanalyzeRepository: (repositoryId: string) => Promise<boolean>;
  onDeleteTrack: (trackId: string) => Promise<boolean>;
  onDeleteRepository: (repositoryId: string) => Promise<boolean>;
  onSeedDemo: () => Promise<void>;
  onSavePlaylist: (input: SaveBaseTrackPlaylistInput) => Promise<boolean>;
  onDeletePlaylist: (playlistId: string) => Promise<boolean>;
  onSelectTrack: (trackId: string) => void;
  onSelectPlaylist: (playlistId: string) => void;
  onSelectRepository: (repositoryId: string) => void;
  onSelectBaseAsset: (baseAssetId: string) => void;
  onSelectComposition: (compositionId: string) => void;
  onInspectTrack: (trackId: string) => void;
  onInspectRepository: (repositoryId: string) => void;
  onInspectBaseAsset: (baseAssetId: string) => void;
  onInspectComposition: (compositionId: string) => void;
}
