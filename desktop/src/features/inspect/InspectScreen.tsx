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
import { InspectTrackView } from "./InspectTrackView";
import {
  buildInspectScreenContextBarProps,
  buildInspectScreenRenderState,
} from "./inspectScreenRuntime";
import {
  buildInspectScreenBaseAssetViewInput,
  buildInspectScreenContextBarElementInput,
  buildInspectScreenContextBarInput,
  buildInspectScreenRenderStateInput,
  buildInspectScreenRepositoryViewInput,
  buildInspectScreenTrackViewInput,
  resolveInspectScreenPlaceholderTitle,
  type InspectScreenProps,
} from "./inspectScreenHookRuntime";

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
  const renderState = buildInspectScreenRenderState(
    buildInspectScreenRenderStateInput({
      mode,
      track,
      repository,
      baseAsset,
      availableTracks,
      availableRepositories,
      availableBaseAssets,
    }),
  );
  const contextBarProps = buildInspectScreenContextBarProps(
    buildInspectScreenContextBarInput({
      mode,
      track,
      repository,
      baseAsset,
      availableTracks,
      availableRepositories,
      availableBaseAssets,
      t,
    }),
  );

  const contextBarInput = buildInspectScreenContextBarElementInput({
    contextBarProps,
    onChangeMode,
    onSelectTrack,
    onSelectRepository,
    onSelectBaseAsset,
  });
  const contextBar = (
    <InspectContextBar
      mode={contextBarInput.contextBarProps.mode}
      trackCount={contextBarInput.contextBarProps.trackCount}
      repositoryCount={contextBarInput.contextBarProps.repositoryCount}
      baseAssetCount={contextBarInput.contextBarProps.baseAssetCount}
      selectedTrackId={contextBarInput.contextBarProps.selectedTrackId}
      selectedRepositoryId={contextBarInput.contextBarProps.selectedRepositoryId}
      selectedBaseAssetId={contextBarInput.contextBarProps.selectedBaseAssetId}
      trackOptions={contextBarInput.contextBarProps.trackOptions}
      repositoryOptions={contextBarInput.contextBarProps.repositoryOptions}
      baseAssetOptions={contextBarInput.contextBarProps.baseAssetOptions}
      labels={contextBarInput.contextBarProps.labels}
      onChangeMode={contextBarInput.onChangeMode}
      onSelectTrack={contextBarInput.onSelectTrack}
      onSelectRepository={contextBarInput.onSelectRepository}
      onSelectBaseAsset={contextBarInput.onSelectBaseAsset}
    />
  );

  if (renderState.kind === "empty") {
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

  if (renderState.kind === "track-placeholder") {
    return (
      <section className="screen">
        <header className="screen-header">
          <div>
            <p className="eyebrow">{t.inspect.title}</p>
            <h2>{resolveInspectScreenPlaceholderTitle({ kind: renderState.kind, t })}</h2>
          </div>
        </header>
        {contextBar}
      </section>
    );
  }

  if (renderState.kind === "track" && track) {
    return (
      <InspectTrackView
        {...buildInspectScreenTrackViewInput({
          track,
          analyzerLabel,
          trackMutating,
          contextBar,
          onGoCompose,
          onUpdateTrackPerformance,
          onUpdateTrackAnalysis,
        })}
      />
    );
  }

  if (renderState.kind === "repo-placeholder") {
    return (
      <section className="screen">
        <header className="screen-header">
          <div>
            <p className="eyebrow">{t.inspect.title}</p>
            <h2>{resolveInspectScreenPlaceholderTitle({ kind: renderState.kind, t })}</h2>
          </div>
        </header>
        {contextBar}
      </section>
    );
  }

  if (renderState.kind === "repo" && repository) {
    return (
      <InspectRepositoryView
        {...buildInspectScreenRepositoryViewInput({
          repository,
          availableBaseAssets,
          availableTracks,
          availablePlaylists,
          preferredBaseAssetId: baseAsset?.id ?? null,
          analyzerLabel,
          contextBar,
          onGoCompose,
        })}
      />
    );
  }

  if (renderState.kind === "base-placeholder") {
    return (
      <section className="screen">
        <header className="screen-header">
          <div>
            <p className="eyebrow">{t.inspect.title}</p>
            <h2>{resolveInspectScreenPlaceholderTitle({ kind: renderState.kind, t })}</h2>
          </div>
        </header>
        {contextBar}
      </section>
    );
  }

  return (
    <InspectBaseAssetView
      {...buildInspectScreenBaseAssetViewInput({
        baseAsset: baseAsset!,
        analyzerLabel,
        contextBar,
        onGoCompose,
      })}
    />
  );
}
