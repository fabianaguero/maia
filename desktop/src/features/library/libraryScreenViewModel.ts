import type { AppTranslations } from "../../i18n/types";
import type { LibraryTab } from "./libraryScreenTypes";

export interface LibraryScreenCounts {
  tracks: number;
  repositories: number;
  codeProjects: number;
  logConnections: number;
  baseAssets: number;
  missingTracks: number;
}

export interface LibraryScreenLoadingState {
  trackLoading: boolean;
  repositoryLoading: boolean;
  baseAssetLoading: boolean;
}

export interface LibraryScreenErrorState {
  trackError: string | null;
  repositoryError: string | null;
  logConnectionError: string | null;
  baseAssetError: string | null;
}

export interface LibraryTabViewModel {
  id: LibraryTab;
  label: string;
  count: number;
}

export interface LibraryEmptyStateViewModel {
  title: string;
  body: string;
  actionLabel: string;
}

export interface LibraryToolbarViewModel {
  eyebrow: string;
  count: number;
  title: string;
  note: string;
  formToggleLabel: string;
  showSeedDemo: boolean;
  showNewPlaylist: boolean;
  showRelinkMissing: boolean;
  showCleanOrphans: boolean;
}

export interface LibraryScreenViewModel {
  tabs: LibraryTabViewModel[];
  toolbar: LibraryToolbarViewModel;
  emptyState: LibraryEmptyStateViewModel;
  loading: boolean;
  error: string | null;
}

export function resolveLibrarySourceKindLabel(sourceKind: string, t: AppTranslations): string {
  const labels: Record<string, string> = {
    directory: t.library.directory,
    file: t.library.logFile,
    url: t.library.githubUrl,
  };

  return labels[sourceKind] ?? sourceKind;
}

export function resolveLibraryConnectionKindLabel(
  connectionKind: string,
  t: AppTranslations,
): string {
  const labels: Record<string, string> = {
    file_log: t.library.fileTail,
    gcp_cloud_run: t.simpleMode.connections.gcpCloudRun,
  };

  return labels[connectionKind] ?? connectionKind;
}

export function resolveLibraryStatusBadgeClass(status: string | null | undefined): string {
  if (status === "analyzed") return "status-badge--analyzed";
  if (status === "ready") return "status-badge--ready";
  return "status-badge--pending";
}

export function resolveLibraryStatusLabel(
  status: string | null | undefined,
  t: AppTranslations,
): string {
  if (status === "analyzed") return t.library.statusAnalyzed;
  if (status === "ready") return t.library.statusReady;
  return t.library.statusPending;
}

export function buildLibraryScreenViewModel(input: {
  activeTab: LibraryTab;
  showForm: boolean;
  counts: LibraryScreenCounts;
  loadingState: LibraryScreenLoadingState;
  errorState: LibraryScreenErrorState;
  t: AppTranslations;
}): LibraryScreenViewModel {
  const { activeTab, showForm, counts, loadingState, errorState, t } = input;
  const tabs: LibraryTabViewModel[] = [
    { id: "tracks", label: t.library.sounds, count: counts.tracks },
    { id: "sources", label: t.library.logSources, count: counts.repositories },
    { id: "projects", label: "Code Projects", count: counts.codeProjects },
    { id: "connections", label: t.library.connections, count: counts.logConnections },
    { id: "bases", label: t.library.profiles, count: counts.baseAssets },
  ];

  const toolbarByTab: Record<LibraryTab, Omit<LibraryToolbarViewModel, "formToggleLabel">> = {
    tracks: {
      eyebrow: t.library.sounds,
      count: counts.tracks,
      title: t.library.toolbarSoundsTitle,
      note: t.library.toolbarSoundsNote,
      showSeedDemo: true,
      showNewPlaylist: counts.tracks > 0,
      showRelinkMissing: counts.missingTracks > 0,
      showCleanOrphans: counts.tracks > 0,
    },
    sources: {
      eyebrow: t.library.logSources,
      count: counts.repositories,
      title: t.library.toolbarSourcesTitle,
      note: t.library.toolbarSourcesNote,
      showSeedDemo: false,
      showNewPlaylist: false,
      showRelinkMissing: false,
      showCleanOrphans: counts.repositories > 0,
    },
    projects: {
      eyebrow: "Code Projects",
      count: counts.codeProjects,
      title: "Code Projects with SonarQube",
      note: "Analyze repositories for code quality issues",
      showSeedDemo: false,
      showNewPlaylist: false,
      showRelinkMissing: false,
      showCleanOrphans: counts.codeProjects > 0,
    },
    connections: {
      eyebrow: t.library.connections,
      count: counts.logConnections,
      title: t.library.toolbarConnectionsTitle,
      note: t.library.toolbarConnectionsNote,
      showSeedDemo: false,
      showNewPlaylist: false,
      showRelinkMissing: false,
      showCleanOrphans: false,
    },
    bases: {
      eyebrow: t.library.profiles,
      count: counts.baseAssets,
      title: t.library.toolbarProfilesTitle,
      note: t.library.toolbarProfilesNote,
      showSeedDemo: false,
      showNewPlaylist: false,
      showRelinkMissing: false,
      showCleanOrphans: false,
    },
  };

  const emptyStateByTab: Record<LibraryTab, LibraryEmptyStateViewModel> = {
    tracks: {
      title: t.library.noTracksYet,
      body: t.library.noTracksBody,
      actionLabel: t.library.addTrack,
    },
    sources: {
      title: t.library.noSourcesYet,
      body: t.library.noSourcesBody,
      actionLabel: t.library.addSource,
    },
    projects: {
      title: "No Code Projects yet",
      body: "Create your first SonarQube project to analyze code quality",
      actionLabel: "New Project",
    },
    connections: {
      title: t.library.noConnectionsYet,
      body: t.library.noConnectionsBody,
      actionLabel: t.library.addConnection,
    },
    bases: {
      title: t.library.noBasePacksYet,
      body: t.library.noBasePacksBody,
      actionLabel: t.library.addBase,
    },
  };

  const loading =
    (activeTab === "tracks" && loadingState.trackLoading) ||
    (activeTab === "sources" && loadingState.repositoryLoading) ||
    (activeTab === "bases" && loadingState.baseAssetLoading);

  const error =
    activeTab === "tracks"
      ? errorState.trackError
      : activeTab === "sources"
        ? errorState.repositoryError
        : activeTab === "connections"
          ? errorState.logConnectionError
          : errorState.baseAssetError;

  const formToggleLabel = showForm
    ? t.library.cancel
    : activeTab === "tracks"
      ? t.library.importTrack
      : activeTab === "bases"
        ? t.library.importBaseAsset
        : activeTab === "connections"
          ? t.library.addConnection
          : t.library.importRepository;

  return {
    tabs,
    toolbar: {
      ...toolbarByTab[activeTab],
      formToggleLabel,
    },
    emptyState: emptyStateByTab[activeTab],
    loading,
    error,
  };
}
