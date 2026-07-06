import { useT } from "../../i18n/I18nContext";
import type {
  LibraryTrack,
  RepositoryAnalysis,
  BaseAssetRecord,
  ImportRepositoryInput,
  ImportBaseAssetInput,
} from "../../types/library";
import { useUnifiedLibraryState } from "./useUnifiedLibraryState";
import { SimpleLibraryHeader } from "./SimpleLibraryHeader";
import { SimpleLibraryRepositoriesSection } from "./SimpleLibraryRepositoriesSection";
import { SimpleLibraryTracksSection } from "./SimpleLibraryTracksSection";
import { useSimpleModeLibraryPreview } from "./useSimpleModeLibraryPreview";

interface SimpleModeLibraryViewProps {
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
  selectedRepositoryId: string | null;
  onSelectRepository: (repositoryId: string) => void;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  onImportBaseAsset: (input: ImportBaseAssetInput) => Promise<boolean>;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
  onStartMonitoring?: (repoId: string, trackId?: string) => void;
}

export function SimpleModeLibraryView({
  tracks,
  repositories,
  baseAssets,
  selectedRepositoryId,
  onSelectRepository,
  onImportRepository,
  onImportBaseAsset,
  selectedTrackId,
  onSelectTrack,
  onStartMonitoring,
}: SimpleModeLibraryViewProps) {
  const t = useT();
  const { previewTrackId, toggleTrackPreview } = useSimpleModeLibraryPreview();

  // Use unified state management (behavior-agnostic)
  const adapter = useUnifiedLibraryState({
    tracks,
    repositories,
    baseAssets,
    selectedRepositoryId,
    onSelectRepository,
    onImportRepository,
    onImportBaseAsset,
    onStartMonitoring,
  });

  return (
    <div className="simple-library-view">
      <SimpleLibraryHeader
        title={t.simpleMode.nav.files}
        subtitle={t.simpleMode.library.subtitle}
      />

      <SimpleLibraryRepositoriesSection
        repositories={adapter.repositories}
        selectedRepositoryId={adapter.selectedRepositoryId}
        selectedTrackId={selectedTrackId}
        baseAssetCount={adapter.baseAssets.length}
        t={t}
        onImportRepository={onImportRepository}
        onSelectRepository={adapter.onSelectRepository}
        onStartMonitoring={adapter.onStartMonitoring}
      />

      {adapter.baseAssets.length > 0 ? (
        <SimpleLibraryTracksSection
          tracks={tracks}
          trackCount={adapter.baseAssets.length}
          selectedTrackId={selectedTrackId}
          previewTrackId={previewTrackId}
          t={t}
          onSelectTrack={onSelectTrack}
          onToggleTrackPreview={toggleTrackPreview}
        />
      ) : null}
    </div>
  );
}
