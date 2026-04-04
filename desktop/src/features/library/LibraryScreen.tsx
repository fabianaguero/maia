import type { BootstrapManifest } from "../../contracts";
import type { ImportTrackInput, LibraryTrack } from "../../types/library";
import { ImportTrackForm } from "./components/ImportTrackForm";
import { TracksTable } from "./components/TracksTable";

interface LibraryScreenProps {
  tracks: LibraryTrack[];
  selectedTrackId: string | null;
  manifest: BootstrapManifest | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  onImportTrack: (input: ImportTrackInput) => Promise<boolean>;
  onSeedDemo: () => Promise<void>;
  onSelectTrack: (trackId: string) => void;
  onInspectTrack: (trackId: string) => void;
}

export function LibraryScreen({
  tracks,
  selectedTrackId,
  manifest,
  loading,
  busy,
  error,
  onImportTrack,
  onSeedDemo,
  onSelectTrack,
  onInspectTrack,
}: LibraryScreenProps) {
  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">Library screen</p>
          <h2>Imported tracks</h2>
          <p className="support-copy">
            Tracks stay local. Each import persists a minimal mocked analysis
            that the analyzer screen can inspect without advanced DSP yet.
          </p>
        </div>
        <div className="screen-summary">
          <div className="summary-pill">
            <span>Tracks in library</span>
            <strong>{tracks.length}</strong>
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
            busy={busy}
            onImportTrack={onImportTrack}
            onSeedDemo={onSeedDemo}
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
          </dl>
        </section>
      </div>

      <section className="panel library-table-panel">
        <div className="panel-header">
          <div>
            <h2>Track table</h2>
            <p className="support-copy">
              Select a track to inspect the analyzer screen.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="placeholder">Loading local library...</p>
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

        {error ? <div className="notice">{error}</div> : null}
      </section>
    </section>
  );
}
