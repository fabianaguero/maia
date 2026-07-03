import { AudioWaveform } from "lucide-react";

import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  ImportCompositionInput,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../types/library";
import { ImportCompositionForm } from "../library/components/ImportCompositionForm";
import type { AppTranslations } from "../../i18n/types";
import { buildComposeScreenFormInput } from "./composeScreenHookRuntime";

interface ComposeCreationPanelProps {
  t: AppTranslations;
  canCompose: boolean;
  busy: boolean;
  baseAssets: BaseAssetRecord[];
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  repositories: RepositoryAnalysis[];
  onImportComposition: (input: ImportCompositionInput) => Promise<boolean>;
  onGoLibrary: () => void;
}

export function ComposeCreationPanel({
  t,
  canCompose,
  busy,
  baseAssets,
  tracks,
  playlists,
  repositories,
  onImportComposition,
  onGoLibrary,
}: ComposeCreationPanelProps) {
  return (
    <section className="panel compose-form-panel">
      {!canCompose ? (
        <div className="empty-state">
          <AudioWaveform size={28} style={{ opacity: 0.3, marginBottom: 10 }} />
          <p>{t.compose.emptyRequirements}</p>
          <button type="button" className="action" onClick={onGoLibrary}>
            {t.compose.goLibrary}
          </button>
        </div>
      ) : (
        <ImportCompositionForm
          {...buildComposeScreenFormInput({
            busy,
            baseAssets,
            tracks,
            playlists,
            repositories,
            onImportComposition,
          })}
        />
      )}
    </section>
  );
}
