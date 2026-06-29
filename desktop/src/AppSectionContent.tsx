import { lazy } from "react";

import { AppCurateSection } from "./AppCurateSection";
import { AppSessionSection } from "./AppSessionSection";
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
import type { LibraryTab } from "./features/library/libraryScreenTypes";
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
      <AppCurateSection
        userMode={props.userMode}
        showSimpleWizard={state.showSimpleWizard}
        showSimpleLibrary={state.showSimpleLibrary}
        showExpertLibrary={state.showExpertLibrary}
        manifest={props.manifest}
        musicStyles={props.musicStyles}
        baseAssetCategories={props.baseAssetCategories}
        defaultTrackMusicStyleId={props.defaultTrackMusicStyleId}
        defaultBaseAssetCategoryId={props.defaultBaseAssetCategoryId}
        libraryTab={props.libraryTab}
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
        onSelectSimpleTrack={props.onSelectSimpleTrack}
        onSelectSimpleRepository={props.onSelectSimpleRepository}
        onSelectTrack={props.onSelectTrack}
        onSelectPlaylist={props.onSelectPlaylist}
        onSelectRepository={props.onSelectRepository}
        onSelectBaseAsset={props.onSelectBaseAsset}
        onSelectComposition={props.onSelectComposition}
        onInspectTrack={props.onInspectTrack}
        onInspectRepository={props.onInspectRepository}
        onInspectBaseAsset={props.onInspectBaseAsset}
        onInspectComposition={props.onInspectComposition}
        onStartSimpleMonitoring={props.onStartSimpleMonitoring}
        onStartSimpleWizardSession={props.onStartSimpleWizardSession}
        onTabChange={props.onTabChange}
      />

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
        <AppSessionSection
          monitorSession={props.monitorSession}
          monitorIsPlayback={props.monitorIsPlayback}
          monitorPlaybackProgress={props.monitorPlaybackProgress}
          tracks={props.tracks}
          playlists={props.playlists}
          repositories={props.repositories}
          sessions={props.sessions}
          sessionBookmarksBySessionId={props.sessionBookmarksBySessionId}
          selectedSessionId={props.selectedSessionId}
          sessionsLoading={props.sessionsLoading}
          sessionsMutating={props.sessionsMutating}
          sessionsError={props.sessionsError}
          onStartSession={props.onStartSession}
          onStopSession={props.onStopSession}
          onResumeSession={props.onResumeSession}
          onPlaybackSession={props.onPlaybackSession}
          onReplayBookmark={props.onReplayBookmark}
          onDeleteSession={props.onDeleteSession}
          onSelectSession={props.onSelectSession}
        />
      ) : null}
    </>
  );
}
