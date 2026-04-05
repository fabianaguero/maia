import type { BootstrapManifest } from "../../contracts";
import type { BaseAssetCategoryOption } from "../../types/baseAsset";
import type { MusicStyleOption } from "../../types/music";
import type {
  BaseAssetRecord,
  CompositionResultRecord,
  ImportCompositionInput,
  ImportBaseAssetInput,
  ImportRepositoryInput,
  ImportTrackInput,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../types/library";
import { BaseAssetsTable } from "./components/BaseAssetsTable";
import { CompositionResultsTable } from "./components/CompositionResultsTable";
import { ImportBaseAssetForm } from "./components/ImportBaseAssetForm";
import { ImportCompositionForm } from "./components/ImportCompositionForm";
import { ImportRepositoryForm } from "./components/ImportRepositoryForm";
import { ImportTrackForm } from "./components/ImportTrackForm";
import { RepositoriesTable } from "./components/RepositoriesTable";
import { TracksTable } from "./components/TracksTable";

interface LibraryScreenProps {
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
  compositions: CompositionResultRecord[];
  selectedTrackId: string | null;
  selectedRepositoryId: string | null;
  selectedBaseAssetId: string | null;
  selectedCompositionId: string | null;
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
  onSeedDemo: () => Promise<void>;
  onSelectTrack: (trackId: string) => void;
  onSelectRepository: (repositoryId: string) => void;
  onSelectBaseAsset: (baseAssetId: string) => void;
  onSelectComposition: (compositionId: string) => void;
  onInspectTrack: (trackId: string) => void;
  onInspectRepository: (repositoryId: string) => void;
  onInspectBaseAsset: (baseAssetId: string) => void;
  onInspectComposition: (compositionId: string) => void;
}

export function LibraryScreen({
  tracks,
  repositories,
  baseAssets,
  compositions,
  selectedTrackId,
  selectedRepositoryId,
  selectedBaseAssetId,
  selectedCompositionId,
  manifest,
  musicStyles,
  baseAssetCategories,
  defaultTrackMusicStyleId,
  defaultBaseAssetCategoryId,
  trackLoading,
  repositoryLoading,
  baseAssetLoading,
  compositionLoading,
  trackBusy,
  repositoryBusy,
  baseAssetBusy,
  compositionBusy,
  trackError,
  repositoryError,
  baseAssetError,
  compositionError,
  onImportTrack,
  onImportRepository,
  onImportBaseAsset,
  onImportComposition,
  onSeedDemo,
  onSelectTrack,
  onSelectRepository,
  onSelectBaseAsset,
  onSelectComposition,
  onInspectTrack,
  onInspectRepository,
  onInspectBaseAsset,
  onInspectComposition,
}: LibraryScreenProps) {
  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">Library screen</p>
          <h2>Imported assets</h2>
          <p className="support-copy">
            Tracks, local code projects, log files, GitHub repository references, and reusable
            base assets stay local-first. Each import persists a lightweight analysis record that
            the analyzer screen can inspect immediately.
          </p>
        </div>
        <div className="screen-summary">
          <div className="summary-pill">
            <span>Tracks / Code-logs / Bases / Comps</span>
            <strong>{tracks.length} / {repositories.length} / {baseAssets.length} / {compositions.length}</strong>
          </div>
          <div className="summary-pill">
            <span>Storage mode</span>
            <strong>{manifest?.persistenceMode ?? "fallback"}</strong>
          </div>
        </div>
      </header>

      <div className="library-layout">
        <section className="panel">
          <ImportTrackForm
            busy={trackBusy}
            musicStyles={musicStyles}
            defaultMusicStyleId={defaultTrackMusicStyleId}
            onImportTrack={onImportTrack}
            onSeedDemo={onSeedDemo}
          />
        </section>

        <section className="panel">
          <ImportRepositoryForm
            busy={repositoryBusy}
            defaultDirectoryPath={manifest?.repoRoot}
            onImportRepository={onImportRepository}
          />
        </section>

        <section className="panel">
          <ImportBaseAssetForm
            busy={baseAssetBusy}
            baseAssetCategories={baseAssetCategories}
            defaultCategoryId={defaultBaseAssetCategoryId}
            onImportBaseAsset={onImportBaseAsset}
          />
        </section>

        <section className="panel storage-panel">
          <div className="panel-header compact">
            <div>
              <h2>Local persistence</h2>
              <p className="support-copy">
                SQLite is the primary store in Tauri. Browser-only fallback uses
                local mock storage so the UI still boots in plain Vite.
              </p>
            </div>
          </div>
          <dl className="meta-list">
            <div>
              <dt>Database path</dt>
              <dd>{manifest?.databasePath ?? "Unavailable outside Tauri"}</dd>
            </div>
            <div>
              <dt>Schema</dt>
              <dd>{manifest?.databaseSchema ?? "../database/schema.sql"}</dd>
            </div>
            <div>
              <dt>Analyzer bridge</dt>
              <dd>{manifest?.analyzerEntrypoint ?? "Mock only"}</dd>
            </div>
            <div>
              <dt>Music style config</dt>
              <dd>
                {manifest?.musicStyleConfigPath ??
                  "../desktop/src/config/music-styles.json"}
              </dd>
            </div>
            <div>
              <dt>Base asset config</dt>
              <dd>
                {manifest?.baseAssetCategoryConfigPath ??
                  "../desktop/src/config/base-asset-categories.json"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <ImportCompositionForm
            busy={compositionBusy}
            baseAssets={baseAssets}
            tracks={tracks}
            repositories={repositories}
            onImportComposition={onImportComposition}
          />
        </section>
      </div>

      <div className="asset-tables">
        <section className="panel library-table-panel">
          <div className="panel-header">
            <div>
              <h2>Track table</h2>
              <p className="support-copy">
                Select a track to inspect the analyzer screen.
              </p>
            </div>
          </div>

          {trackLoading ? (
            <p className="placeholder">Loading local track library...</p>
          ) : tracks.length === 0 ? (
            <div className="empty-state">
              <p>No tracks imported yet.</p>
              <p>Import one manually or load the demo library to populate the table.</p>
            </div>
          ) : (
            <TracksTable
              tracks={tracks}
              selectedTrackId={selectedTrackId}
              onSelectTrack={onSelectTrack}
              onInspectTrack={onInspectTrack}
            />
          )}

          {trackError ? <div className="notice">{trackError}</div> : null}
        </section>

        <section className="panel library-table-panel">
          <div className="panel-header">
            <div>
              <h2>Code and log table</h2>
              <p className="support-copy">
                Import a filesystem project, a local log file, or a GitHub URL and inspect its
                signal state.
              </p>
            </div>
          </div>

          {repositoryLoading ? (
            <p className="placeholder">Loading repository intake...</p>
          ) : repositories.length === 0 ? (
            <div className="empty-state">
              <p>No code or log sources imported yet.</p>
              <p>Use a local directory, a local log file, or a GitHub URL to create the first analysis item.</p>
            </div>
          ) : (
            <RepositoriesTable
              repositories={repositories}
              selectedRepositoryId={selectedRepositoryId}
              onSelectRepository={onSelectRepository}
              onInspectRepository={onInspectRepository}
            />
          )}

          {repositoryError ? <div className="notice">{repositoryError}</div> : null}
        </section>

        <section className="panel library-table-panel">
          <div className="panel-header">
            <div>
              <h2>Base asset table</h2>
              <p className="support-copy">
                Register reusable files and folder packs for future composition flows.
              </p>
            </div>
          </div>

          {baseAssetLoading ? (
            <p className="placeholder">Loading base asset library...</p>
          ) : baseAssets.length === 0 ? (
            <div className="empty-state">
              <p>No base assets registered yet.</p>
              <p>Register a file or folder pack to start the reusable local catalog.</p>
            </div>
          ) : (
            <BaseAssetsTable
              baseAssets={baseAssets}
              selectedBaseAssetId={selectedBaseAssetId}
              onSelectBaseAsset={onSelectBaseAsset}
              onInspectBaseAsset={onInspectBaseAsset}
            />
          )}

          {baseAssetError ? <div className="notice">{baseAssetError}</div> : null}
        </section>

        <section className="panel library-table-panel">
          <div className="panel-header">
            <div>
              <h2>Composition table</h2>
              <p className="support-copy">
                Local arrangement plans derived from reusable bases and reference BPM sources.
              </p>
            </div>
          </div>

          {compositionLoading ? (
            <p className="placeholder">Loading compositions...</p>
          ) : compositions.length === 0 ? (
            <div className="empty-state">
              <p>No composition plans created yet.</p>
              <p>Choose a base asset and a track, repo, or manual BPM to generate the first plan.</p>
            </div>
          ) : (
            <CompositionResultsTable
              compositions={compositions}
              selectedCompositionId={selectedCompositionId}
              onSelectComposition={onSelectComposition}
              onInspectComposition={onInspectComposition}
            />
          )}

          {compositionError ? <div className="notice">{compositionError}</div> : null}
        </section>
      </div>
    </section>
  );
}
