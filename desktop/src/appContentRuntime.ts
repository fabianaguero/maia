import type {
  AnalyzerResponse,
  HealthResponse,
} from "./contracts";
import type {
  AnalyzerViewMode,
  AppPillar,
  AppScreen,
  BaseAssetRecord,
  CompositionResultRecord,
  LibraryTrack,
  RepositoryAnalysis,
} from "./types/library";
import type { LibraryTab } from "./features/library/LibraryScreen";
import type { StreamAdapterKind } from "./types/monitor";

type UserMode = "simple" | "expert";

interface AppContentCopy {
  appShell: {
    analyzerUnavailable: string;
    basePoolArmed: string;
    bootingAnalyzerBridge: string;
    mappingRepository: string;
    poolIngest: string;
    renderingComposition: string;
    scanningTrackDna: string;
    sourceDeckArmed: string;
    trackDeckArmed: string;
  };
  nav: {
    compose: { label: string };
    inspect: { label: string };
    library: { label: string };
    session: { label: string };
  };
}

export interface AppContentRouteState {
  effectivePillar: AppPillar;
  effectiveScreen: AppScreen;
}

export interface AppPillarNavigationState {
  pillar: AppPillar;
  screen: AppScreen;
}

export interface AppOpenConnectionsState {
  pillar: AppPillar;
  screen: AppScreen;
  libraryTab: LibraryTab;
}

export interface AppMutationState {
  isMutating: boolean;
  mutateLabel: string;
}

export interface AppContentStatusViewModel {
  analyzerLabel: string;
  detailDeckLabel: string;
  screenLabel: string;
  selectedItemTitle: string | null;
}

export function isAppHealthResponse(
  response: AnalyzerResponse | null,
): response is HealthResponse {
  return Boolean(response && response.status === "ok" && "analyzerVersion" in response.payload);
}

export function resolveAppContentRouteState(
  userMode: UserMode,
  pillar: AppPillar,
  screen: AppScreen,
): AppContentRouteState {
  return {
    effectivePillar: userMode === "simple" && pillar === "design" ? "curate" : pillar,
    effectiveScreen:
      userMode === "simple" && (screen === "inspect" || screen === "compose")
        ? "library"
        : screen,
  };
}

export function resolveAppPillarNavigationState(
  userMode: UserMode,
  pillar: AppPillar,
): AppPillarNavigationState {
  if (pillar === "perform") {
    return { pillar, screen: "session" };
  }

  if (pillar === "design") {
    return {
      pillar: userMode === "simple" ? "curate" : "design",
      screen: userMode === "simple" ? "library" : "compose",
    };
  }

  return { pillar: "curate", screen: "library" };
}

export function resolveAppOpenConnectionsState(): AppOpenConnectionsState {
  return {
    pillar: "curate",
    screen: "library",
    libraryTab: "connections",
  };
}

export function resolveAppMutationState(
  input: {
    baseAssetsMutating: boolean;
    compositionsMutating: boolean;
    libraryMutating: boolean;
    repositoriesMutating: boolean;
  },
  copy: AppContentCopy,
): AppMutationState {
  const isMutating =
    input.libraryMutating ||
    input.repositoriesMutating ||
    input.baseAssetsMutating ||
    input.compositionsMutating;

  const mutateLabel = input.libraryMutating
    ? copy.appShell.scanningTrackDna
    : input.repositoriesMutating
      ? copy.appShell.mappingRepository
      : input.baseAssetsMutating
        ? copy.appShell.poolIngest
        : copy.appShell.renderingComposition;

  return {
    isMutating,
    mutateLabel,
  };
}

export function buildAppContentStatusViewModel(
  input: {
    analysisMode: AnalyzerViewMode;
    baseAsset: BaseAssetRecord | null;
    booting: boolean;
    composition: CompositionResultRecord | null;
    health: AnalyzerResponse | null;
    playlistName: string | null;
    repository: RepositoryAnalysis | null;
    screen: AppScreen;
    track: LibraryTrack | null;
  },
  copy: AppContentCopy,
): AppContentStatusViewModel {
  const analyzerLabel = isAppHealthResponse(input.health)
    ? `${input.health.payload.analyzerVersion} on ${input.health.payload.runtime}`
    : input.booting
      ? copy.appShell.bootingAnalyzerBridge
      : copy.appShell.analyzerUnavailable;

  const screenLabel =
    input.screen === "library"
      ? copy.nav.library.label
      : input.screen === "session"
        ? copy.nav.session.label
        : input.screen === "inspect"
          ? copy.nav.inspect.label
          : copy.nav.compose.label;

  const detailDeckLabel =
    input.analysisMode === "repo"
      ? copy.appShell.sourceDeckArmed
      : input.analysisMode === "base"
        ? copy.appShell.basePoolArmed
        : copy.appShell.trackDeckArmed;

  const selectedItemTitle =
    input.screen === "compose"
      ? input.composition?.title ?? null
      : input.screen === "inspect" && input.analysisMode === "repo"
        ? input.repository?.title ?? null
        : input.screen === "inspect" && input.analysisMode === "base"
          ? input.baseAsset?.title ?? null
          : input.playlistName ?? input.track?.tags.title ?? null;

  return {
    analyzerLabel,
    detailDeckLabel,
    screenLabel,
    selectedItemTitle,
  };
}

export function resolveSessionRepositorySourceKind(
  adapterKind: StreamAdapterKind,
): RepositoryAnalysis["sourceKind"] {
  return adapterKind === "file" ? "file" : "directory";
}

export function buildFallbackSessionRepository(input: {
  adapterKind: StreamAdapterKind;
  label: string;
  nowIso: string;
  sessionId: string;
  source: string;
}): RepositoryAnalysis {
  return {
    id: input.sessionId,
    title: input.label,
    sourcePath: input.source,
    storagePath: null,
    sourceKind: resolveSessionRepositorySourceKind(input.adapterKind),
    importedAt: input.nowIso,
    suggestedBpm: null,
    confidence: 0,
    summary: "",
    analyzerStatus: "pending",
    buildSystem: "",
    primaryLanguage: "",
    javaFileCount: 0,
    testFileCount: 0,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    notes: [],
    tags: [],
    metrics: {},
  };
}

export function resolveSessionRepository(input: {
  adapterKind: StreamAdapterKind;
  label: string;
  nowIso: string;
  repositories: RepositoryAnalysis[];
  sessionId: string;
  source: string;
}): RepositoryAnalysis {
  return (
    input.repositories.find((repository) => repository.sourcePath === input.source) ??
    buildFallbackSessionRepository(input)
  );
}
