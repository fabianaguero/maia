import type { BootstrapManifest } from "../../../contracts";
import type { BaseAssetCategoryOption } from "../../../types/baseAsset";
import type { MusicStyleOption } from "../../../types/music";
import type {
  ImportBaseAssetInput,
  ImportRepositoryInput,
  ImportTrackInput,
} from "../../../types/library";
import type { LibraryTab } from "../LibraryScreen";
import { ImportBaseAssetForm } from "./ImportBaseAssetForm";
import { ImportRepositoryForm } from "./ImportRepositoryForm";
import { ImportTrackForm } from "./ImportTrackForm";

interface LibraryFormDrawerProps {
  visible: boolean;
  tab: LibraryTab;
  manifest: BootstrapManifest | null;
  musicStyles: MusicStyleOption[];
  baseAssetCategories: BaseAssetCategoryOption[];
  defaultTrackMusicStyleId?: string;
  defaultBaseAssetCategoryId?: string;
  trackBusy: boolean;
  repositoryBusy: boolean;
  baseAssetBusy: boolean;
  onImportTrack: (input: ImportTrackInput) => Promise<boolean>;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  onImportBaseAsset: (input: ImportBaseAssetInput) => Promise<boolean>;
  onSeedDemo: () => Promise<void>;
  onClose: () => void;
  onLogConnectionSaved: () => void;
}

export function LibraryFormDrawer({
  visible,
  tab,
  manifest,
  musicStyles,
  baseAssetCategories,
  defaultTrackMusicStyleId,
  defaultBaseAssetCategoryId,
  trackBusy,
  repositoryBusy,
  baseAssetBusy,
  onImportTrack,
  onImportRepository,
  onImportBaseAsset,
  onSeedDemo,
  onClose,
  onLogConnectionSaved,
}: LibraryFormDrawerProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="library-form-drawer">
      {tab === "tracks" && (
        <ImportTrackForm
          busy={trackBusy}
          musicStyles={musicStyles}
          defaultMusicStyleId={defaultTrackMusicStyleId}
          onImportTrack={onImportTrack}
          onSeedDemo={async () => {
            await onSeedDemo();
            onClose();
          }}
        />
      )}
      {(tab === "sources" || tab === "connections") && (
        <ImportRepositoryForm
          busy={repositoryBusy}
          defaultDirectoryPath={manifest?.repoRoot}
          onImportRepository={onImportRepository}
          onLogConnectionSaved={onLogConnectionSaved}
        />
      )}
      {tab === "bases" && (
        <ImportBaseAssetForm
          busy={baseAssetBusy}
          baseAssetCategories={baseAssetCategories}
          defaultCategoryId={defaultBaseAssetCategoryId}
          onImportBaseAsset={onImportBaseAsset}
        />
      )}
    </div>
  );
}
