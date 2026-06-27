import { lazy } from "react";

import type { PersistedSession, SessionBookmark } from "./api/sessions";
import type { BootstrapManifest } from "./contracts";
import type { BaseAssetCategoryOption } from "./types/baseAsset";
import type { MusicStyleOption } from "./types/music";
import type {
  AnalyzerViewMode,
  AppPillar,
  AppScreen,
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
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "./types/library";
import type { StartSessionInput } from "./types/monitor";
import type { LibraryTab } from "./features/library/LibraryScreen";
import type { ActiveMonitorSession } from "./features/monitor/monitorContextTypes";
import type { SessionStartDraft } from "./features/session/sessionScreenRuntime";
import { buildAppSectionContentState } from "./appSectionContentRuntime";

const ComposeScreen = lazy(() =>
  import("./features/compose/ComposeScreen").then((module) => ({
    default: module.ComposeScreen,
  })),
);
const InspectScreen = lazy(() =>
  import("./features/inspect/InspectScreen").then((module) => ({
    default: module.InspectScreen,
  })),
);
const LibraryScreen = lazy(() =>
  import("./features/library/LibraryScreen").then((module) => ({
    default: module.LibraryScreen,
  })),
);
const SessionScreen = lazy(() =>
  import("./features/session/SessionScreen").then((module) => ({
    default: module.SessionScreen,
  })),
);
const SimpleModeWizard = lazy(() =>
  import("./features/simple/SimpleModeWizard").then((module) => ({
    default: module.SimpleModeWizard,
  })),
);
const SimpleModeLibraryView = lazy(() =>
  import("./features/simple/SimpleModeLibraryView").then((module) => ({
    default: module.SimpleModeLibraryView,
  })),
);

interface AppSectionContentProps {
  userMode: "simple" | "expert";
  effectivePillar: AppPillar;
  effectiveScreen: AppScreen;
  monitorSession: ActiveMonitorSession | null;
  monitorIsPlayback: boolean;
  monitorPlaybackProgress: number | null;
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
  selectedTrack: LibraryTrack | null;
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
  selectedRepository: RepositoryAnalysis | null;
  selectedRepositoryId: string | null;
  selectedBaseAsset: BaseAssetRecord | null;
  selectedBaseAssetId: string | null;
  selectedComposition: CompositionResultRecord | null;
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
  analysisMode: AnalyzerViewMode;
  analyzerLabel: string;
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  sessions: PersistedSession[];
  selectedSessionId: string | null;
  sessionsLoading: boolean;
  sessionsMutating: boolean;
  sessionsError: string | null;
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
  onGoLibrary: () => void;
  onGoCompose: () => void;
  onTabChange: (tab: LibraryTab) => void;
  onChangeAnalysisMode: (mode: AnalyzerViewMode) => void;
  onUpdateTrackPerformance: (
    trackId: string,
    input: UpdateTrackPerformanceInput,
  ) => Promise<void>;
  onUpdateTrackAnalysis: (
    trackId: string,
    input: UpdateTrackAnalysisInput,
  ) => Promise<void>;
  onStartSimpleMonitoring: (repoId: string, trackId?: string | null) => void;
  onStartSimpleWizardSession: (repoId: string, presetId: string) => void;
  onStartSession: (
    input: StartSessionInput,
    persistedSessionId: string,
    draft?: SessionStartDraft,
  ) => Promise<boolean>;
  onStopSession: () => Promise<void>;
  onResumeSession: (sessionId: string) => void;
  onPlaybackSession: (session: PersistedSession) => Promise<boolean>;
  onReplayBookmark: (
    session: PersistedSession,
    replayWindowIndex: number,
  ) => Promise<boolean>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onSelectSession: (sessionId: string) => void;
}

export function AppSectionContent(props: AppSectionContentProps) {
  const state = buildAppSectionContentState({
    userMode: props.userMode,
    effectivePillar: props.effectivePillar,
    effectiveScreen: props.effectiveScreen,
    hasMonitorSession: Boolean(props.monitorSession),
    repositoryCount: props.repositories.length,
  });

  return (
    <>
      {state.showSimpleWizard ? (
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

      {state.showSimpleLibrary ? (
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

      {state.showExpertLibrary ? (
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

      {state.showInspect ? (
        <InspectScreen
          track={props.selectedTrack}
          repository={props.selectedRepository}
          baseAsset={props.selectedBaseAsset}
          availableTracks={props.tracks}
          availablePlaylists={props.playlists}
          availableRepositories={props.repositories}
          availableBaseAssets={props.baseAssets}
          mode={props.analysisMode}
          analyzerLabel={props.analyzerLabel}
          onChangeMode={props.onChangeAnalysisMode}
          onSelectTrack={props.onSelectTrack}
          onSelectRepository={props.onSelectRepository}
          onSelectBaseAsset={props.onSelectBaseAsset}
          onGoLibrary={props.onGoLibrary}
          onGoCompose={props.onGoCompose}
          onUpdateTrackPerformance={props.onUpdateTrackPerformance}
          onUpdateTrackAnalysis={props.onUpdateTrackAnalysis}
          trackMutating={props.trackBusy}
        />
      ) : null}

      {state.showCompose ? (
        <ComposeScreen
          composition={props.selectedComposition}
          compositions={props.compositions}
          baseAssets={props.baseAssets}
          tracks={props.tracks}
          playlists={props.playlists}
          repositories={props.repositories}
          analyzerLabel={props.analyzerLabel}
          busy={props.compositionBusy}
          onImportComposition={props.onImportComposition}
          onSelectComposition={props.onSelectComposition}
          onGoLibrary={props.onGoLibrary}
        />
      ) : null}

      {state.showSession ? (
        <SessionScreen
          tracks={props.tracks}
          playlists={props.playlists}
          repositories={props.repositories}
          sessions={props.sessions}
          sessionBookmarksBySessionId={props.sessionBookmarksBySessionId}
          selectedSessionId={props.selectedSessionId}
          loading={props.sessionsLoading}
          mutating={props.sessionsMutating}
          error={props.sessionsError}
          activeSessionId={
            props.monitorSession?.persistedSessionId ?? props.monitorSession?.sessionId ?? null
          }
          activeSessionMode={
            props.monitorSession ? (props.monitorIsPlayback ? "playback" : "live") : null
          }
          activePlaybackProgress={props.monitorIsPlayback ? props.monitorPlaybackProgress : null}
          onStartSession={props.onStartSession}
          onStopSession={props.onStopSession}
          onResume={props.onResumeSession}
          onPlayback={props.onPlaybackSession}
          onReplayBookmark={props.onReplayBookmark}
          onDelete={props.onDeleteSession}
          onSelectSession={props.onSelectSession}
        />
      ) : null}
    </>
  );
}
