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
import {
  buildAppComposeSectionProps,
  buildAppCurateSectionProps,
  buildAppInspectSectionProps,
  buildAppSessionSectionProps,
} from "./appSectionContentPropsRuntime";
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

export interface AppSectionContentProps {
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
  onUpdateTrackPerformance: (trackId: string, input: UpdateTrackPerformanceInput) => Promise<void>;
  onUpdateTrackAnalysis: (trackId: string, input: UpdateTrackAnalysisInput) => Promise<void>;
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
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => Promise<boolean>;
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
  const curateSectionProps = buildAppCurateSectionProps(props, state);
  const inspectSectionProps = buildAppInspectSectionProps(props);
  const composeSectionProps = buildAppComposeSectionProps(props);
  const sessionSectionProps = buildAppSessionSectionProps(props);

  return (
    <>
      <AppCurateSection {...curateSectionProps} />

      {state.showInspect ? <InspectScreen {...inspectSectionProps} /> : null}

      {state.showCompose ? <ComposeScreen {...composeSectionProps} /> : null}

      {state.showSession ? <AppSessionSection {...sessionSectionProps} /> : null}
    </>
  );
}
