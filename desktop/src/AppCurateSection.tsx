import type { BootstrapManifest } from "./contracts";
import { LibraryScreen } from "./features/library/LibraryScreen";
import type { LibraryTab } from "./features/library/libraryScreenTypes";
import { SimpleModeLibraryView } from "./features/simple/SimpleModeLibraryView";
import { SimpleModeWizard } from "./features/simple/SimpleModeWizard";
import type { BaseAssetCategoryOption } from "./types/baseAsset";
import type { MusicStyleOption } from "./types/music";
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
} from "./types/library";

interface AppCurateSectionProps {
  userMode: "simple" | "expert";
  showSimpleWizard: boolean;
  showSimpleLibrary: boolean;
  showExpertLibrary: boolean;
  manifest: BootstrapManifest | null;
  musicStyles: MusicStyleOption[];
  baseAssetCategories: BaseAssetCategoryOption[];
  defaultTrackMusicStyleId?: string;
  defaultBaseAssetCategoryId?: string;
  libraryTab: LibraryTab;
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
  compositions: CompositionResultRecord[];
  newlyImportedId: string | null;
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
  selectedRepositoryId: string | null;
  selectedBaseAssetId: string | null;
  selectedCompositionId: string | null;
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
  onSelectSimpleTrack: (trackId: string) => void;
  onSelectSimpleRepository: (repositoryId: string) => void;
  onSelectTrack: (trackId: string) => void;
  onSelectPlaylist: (playlistId: string) => void;
  onSelectRepository: (repositoryId: string) => void;
  onSelectBaseAsset: (baseAssetId: string) => void;
  onSelectComposition: (compositionId: string) => void;
  onInspectTrack: (trackId: string) => void;
  onInspectRepository: (repositoryId: string) => void;
  onInspectBaseAsset: (baseAssetId: string) => void;
  onInspectComposition: (compositionId: string) => void;
  onStartSimpleMonitoring: (repoId: string, trackId?: string | null) => void;
  onStartSimpleWizardSession: (repoId: string, presetId: string) => void;
  onTabChange: (tab: LibraryTab) => void;
}

export function AppCurateSection(props: AppCurateSectionProps) {
  return (
    <>
      {props.showSimpleWizard ? (
        <SimpleModeWizard
          busyRepository={props.repositoryBusy}
          busyBaseAsset={props.baseAssetBusy}
          onImportRepository={props.onImportRepository}
          onImportBaseAsset={props.onImportBaseAsset}
          onStartSession={async (repoId, presetId) => {
            props.onStartSimpleWizardSession(repoId, presetId);
          }}
          repositoryCount={props.repositories.length}
          baseAssetCount={props.baseAssets.length}
          baseAssetCategories={props.manifest?.baseAssetCategories ?? []}
          defaultCategoryId={props.manifest?.defaultBaseAssetCategoryId}
        />
      ) : null}

      {props.showSimpleLibrary ? (
        <SimpleModeLibraryView
          tracks={props.tracks}
          repositories={props.repositories}
          baseAssets={props.baseAssets}
          selectedRepositoryId={props.selectedRepositoryId}
          selectedTrackId={props.selectedTrackId}
          onSelectRepository={props.onSelectSimpleRepository}
          onSelectTrack={props.onSelectSimpleTrack}
          onImportRepository={props.onImportRepository}
          onImportBaseAsset={props.onImportBaseAsset}
          onStartMonitoring={props.onStartSimpleMonitoring}
        />
      ) : null}

      {props.showExpertLibrary ? (
        <LibraryScreen
          tracks={props.tracks}
          playlists={props.playlists}
          repositories={props.repositories}
          baseAssets={props.baseAssets}
          compositions={props.compositions}
          newlyImportedId={props.newlyImportedId}
          selectedTrackId={props.selectedTrackId}
          selectedPlaylistId={props.selectedPlaylistId}
          selectedRepositoryId={props.selectedRepositoryId}
          selectedBaseAssetId={props.selectedBaseAssetId}
          selectedCompositionId={props.selectedCompositionId}
          activeTab={props.libraryTab}
          onTabChange={props.onTabChange}
          manifest={props.manifest}
          musicStyles={props.musicStyles}
          baseAssetCategories={props.baseAssetCategories}
          defaultTrackMusicStyleId={props.defaultTrackMusicStyleId}
          defaultBaseAssetCategoryId={props.defaultBaseAssetCategoryId}
          trackLoading={props.trackLoading}
          repositoryLoading={props.repositoryLoading}
          baseAssetLoading={props.baseAssetLoading}
          compositionLoading={props.compositionLoading}
          trackBusy={props.trackBusy}
          repositoryBusy={props.repositoryBusy}
          baseAssetBusy={props.baseAssetBusy}
          compositionBusy={props.compositionBusy}
          trackError={props.trackError}
          repositoryError={props.repositoryError}
          baseAssetError={props.baseAssetError}
          compositionError={props.compositionError}
          onImportTrack={props.onImportTrack}
          onImportRepository={props.onImportRepository}
          onImportBaseAsset={props.onImportBaseAsset}
          onImportComposition={props.onImportComposition}
          onReanalyzeTrack={props.onReanalyzeTrack}
          onRelinkTrack={props.onRelinkTrack}
          onRelinkMissingTracks={props.onRelinkMissingTracks}
          onReanalyzeRepository={props.onReanalyzeRepository}
          onDeleteTrack={props.onDeleteTrack}
          onDeleteRepository={props.onDeleteRepository}
          onSeedDemo={props.onSeedDemo}
          onSavePlaylist={props.onSavePlaylist}
          onDeletePlaylist={props.onDeletePlaylist}
          onSelectTrack={props.onSelectTrack}
          onSelectPlaylist={props.onSelectPlaylist}
          onSelectRepository={props.onSelectRepository}
          onSelectBaseAsset={props.onSelectBaseAsset}
          onSelectComposition={props.onSelectComposition}
          onInspectTrack={props.onInspectTrack}
          onInspectRepository={props.onInspectRepository}
          onInspectBaseAsset={props.onInspectBaseAsset}
          onInspectComposition={props.onInspectComposition}
        />
      ) : null}
    </>
  );
}
