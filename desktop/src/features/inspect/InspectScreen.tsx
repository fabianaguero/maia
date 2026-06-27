import type {
  AnalyzerViewMode,
  BaseAssetRecord,
  BaseTrackPlaylist,
  LibraryTrack,
  RepositoryAnalysis,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../../types/library";
import { useT } from "../../i18n/I18nContext";
import { InspectContextBar } from "./InspectContextBar";
import { InspectBaseAssetView } from "./InspectBaseAssetView";
import { InspectEmptyState } from "./InspectEmptyState";
import { InspectRepositoryView } from "./InspectRepositoryView";
import { getTrackTitle } from "../../utils/track";
import { InspectTrackView } from "./InspectTrackView";

interface InspectScreenProps {
  track: LibraryTrack | null;
  repository: RepositoryAnalysis | null;
  baseAsset: BaseAssetRecord | null;
  availableTracks: LibraryTrack[];
  availablePlaylists: BaseTrackPlaylist[];
  availableRepositories: RepositoryAnalysis[];
  availableBaseAssets: BaseAssetRecord[];
  mode: AnalyzerViewMode;
  analyzerLabel: string;
  onChangeMode: (mode: AnalyzerViewMode) => void;
  onSelectTrack: (id: string) => void;
  onSelectRepository: (id: string) => void;
  onSelectBaseAsset: (id: string) => void;
  onGoLibrary: () => void;
  onGoCompose: () => void;
  onUpdateTrackPerformance: (trackId: string, input: UpdateTrackPerformanceInput) => Promise<void>;
  onUpdateTrackAnalysis: (trackId: string, input: UpdateTrackAnalysisInput) => Promise<void>;
  trackMutating: boolean;
}

export function InspectScreen({
  track,
  repository,
  baseAsset,
  availableTracks,
  availablePlaylists,
  availableRepositories,
  availableBaseAssets,
  mode,
  analyzerLabel,
  onChangeMode,
  onSelectTrack,
  onSelectRepository,
  onSelectBaseAsset,
  onGoLibrary,
  onGoCompose,
  onUpdateTrackPerformance,
  onUpdateTrackAnalysis,
  trackMutating,
}: InspectScreenProps) {
  const t = useT();
  const hasAnyAsset =
    availableTracks.length > 0 ||
    availableRepositories.length > 0 ||
    availableBaseAssets.length > 0;

  const contextBar = (
    <InspectContextBar
      mode={mode}
      trackCount={availableTracks.length}
      repositoryCount={availableRepositories.length}
      baseAssetCount={availableBaseAssets.length}
      selectedTrackId={track?.id ?? null}
      selectedRepositoryId={repository?.id ?? null}
      selectedBaseAssetId={baseAsset?.id ?? null}
      trackOptions={availableTracks.map((entry) => ({
        id: entry.id,
        label: getTrackTitle(entry),
      }))}
      repositoryOptions={availableRepositories.map((entry) => ({
        id: entry.id,
        label: entry.title,
      }))}
      baseAssetOptions={availableBaseAssets.map((entry) => ({
        id: entry.id,
        label: entry.title,
      }))}
      labels={{
        tracks: t.sidebar.tracks,
        logSources: t.library.logSources,
        bases: t.sidebar.bases,
      }}
      onChangeMode={onChangeMode}
      onSelectTrack={onSelectTrack}
      onSelectRepository={onSelectRepository}
      onSelectBaseAsset={onSelectBaseAsset}
    />
  );

  if (!hasAnyAsset) {
    return (
      <InspectEmptyState
        eyebrow={t.inspect.title}
        title={t.inspect.nothingYet}
        description={t.inspect.copy}
        actionLabel={t.inspect.goLibrary}
        onAction={onGoLibrary}
      />
    );
  }

  // ── TRACK ──────────────────────────────────────────────────────────────────
  if (mode === "track") {
    if (!track) {
      return (
        <section className="screen">
          <header className="screen-header">
            <div>
              <p className="eyebrow">{t.inspect.title}</p>
              <h2>{t.inspect.noTrackSelected}</h2>
            </div>
          </header>
          {contextBar}
        </section>
      );
    }
    return (
      <InspectTrackView
        track={track}
        analyzerLabel={analyzerLabel}
        trackMutating={trackMutating}
        contextBar={contextBar}
        onGoCompose={onGoCompose}
        onUpdateTrackPerformance={onUpdateTrackPerformance}
        onUpdateTrackAnalysis={onUpdateTrackAnalysis}
      />
    );
  }

  // ── REPOSITORY / LOG ───────────────────────────────────────────────────────
  if (mode === "repo") {
    if (!repository) {
      return (
        <section className="screen">
          <header className="screen-header">
            <div>
              <p className="eyebrow">{t.inspect.title}</p>
              <h2>{t.inspect.noRepoSelected}</h2>
            </div>
          </header>
          {contextBar}
        </section>
      );
    }

    return (
      <InspectRepositoryView
        repository={repository}
        availableBaseAssets={availableBaseAssets}
        availableTracks={availableTracks}
        availablePlaylists={availablePlaylists}
        preferredBaseAssetId={baseAsset?.id ?? null}
        analyzerLabel={analyzerLabel}
        contextBar={contextBar}
        onGoCompose={onGoCompose}
      />
    );
  }

  // ── BASE ASSET ─────────────────────────────────────────────────────────────
  if (!baseAsset) {
    return (
      <section className="screen">
        <header className="screen-header">
          <div>
            <p className="eyebrow">{t.inspect.title}</p>
            <h2>{t.inspect.noBaseAssetSelected}</h2>
          </div>
        </header>
        {contextBar}
      </section>
    );
  }

  return (
    <InspectBaseAssetView
      baseAsset={baseAsset}
      analyzerLabel={analyzerLabel}
      contextBar={contextBar}
      onGoCompose={onGoCompose}
    />
  );
}
