import type { AnalyzerResponse, HealthResponse } from "./contracts";
import type {
  AnalyzerViewMode,
  AppPillar,
  AppScreen,
  BaseAssetRecord,
  CompositionResultRecord,
  LibraryTrack,
  RepositoryAnalysis,
} from "./types/library";
import type { LibraryTab } from "./features/library/libraryScreenTypes";

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

export interface AppContentStatusState {
  analyzerLabel: string;
  detailDeckLabel: string;
  screenLabel: string;
}

export function isAppHealthResponse(response: AnalyzerResponse | null): response is HealthResponse {
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
      userMode === "simple" && (screen === "inspect" || screen === "compose") ? "library" : screen,
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

  const mutateLabel = resolveAppMutationLabel(input, copy);

  return {
    isMutating,
    mutateLabel,
  };
}

export function resolveAppMutationLabel(
  input: {
    baseAssetsMutating: boolean;
    compositionsMutating: boolean;
    libraryMutating: boolean;
    repositoriesMutating: boolean;
  },
  copy: AppContentCopy,
): string {
  return input.libraryMutating
    ? copy.appShell.scanningTrackDna
    : input.repositoriesMutating
      ? copy.appShell.mappingRepository
      : input.baseAssetsMutating
        ? copy.appShell.poolIngest
        : copy.appShell.renderingComposition;
}

export function resolveAppScreenLabel(screen: AppScreen, copy: AppContentCopy): string {
  return screen === "library"
    ? copy.nav.library.label
    : screen === "session"
      ? copy.nav.session.label
      : screen === "inspect"
        ? copy.nav.inspect.label
        : copy.nav.compose.label;
}

export function resolveAppDetailDeckLabel(
  analysisMode: AnalyzerViewMode,
  copy: AppContentCopy,
): string {
  return analysisMode === "repo"
    ? copy.appShell.sourceDeckArmed
    : analysisMode === "base"
      ? copy.appShell.basePoolArmed
      : copy.appShell.trackDeckArmed;
}

export function resolveAppSelectedItemTitle(input: {
  analysisMode: AnalyzerViewMode;
  baseAsset: BaseAssetRecord | null;
  composition: CompositionResultRecord | null;
  playlistName: string | null;
  repository: RepositoryAnalysis | null;
  screen: AppScreen;
  track: LibraryTrack | null;
}): string | null {
  return input.screen === "compose"
    ? (input.composition?.title ?? null)
    : input.screen === "inspect" && input.analysisMode === "repo"
      ? (input.repository?.title ?? null)
      : input.screen === "inspect" && input.analysisMode === "base"
        ? (input.baseAsset?.title ?? null)
        : (input.playlistName ?? input.track?.tags.title ?? null);
}

export function buildAppContentStatusState(
  input: Pick<
    Parameters<typeof buildAppContentStatusViewModel>[0],
    "analysisMode" | "booting" | "health" | "screen"
  >,
  copy: AppContentCopy,
): AppContentStatusState {
  const analyzerLabel = isAppHealthResponse(input.health)
    ? `${input.health.payload.analyzerVersion} on ${input.health.payload.runtime}`
    : input.booting
      ? copy.appShell.bootingAnalyzerBridge
      : copy.appShell.analyzerUnavailable;

  return {
    analyzerLabel,
    detailDeckLabel: resolveAppDetailDeckLabel(input.analysisMode, copy),
    screenLabel: resolveAppScreenLabel(input.screen, copy),
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
  const statusState = buildAppContentStatusState(input, copy);

  return {
    ...statusState,
    selectedItemTitle: resolveAppSelectedItemTitle(input),
  };
}
