import { describe, expect, it, vi } from "vitest";

import {
  buildAppComposeSectionProps,
  buildAppCurateSectionProps,
  buildAppInspectSectionProps,
  buildAppSessionSectionProps,
} from "../src/appSectionContentPropsRuntime";
import type { AppSectionContentProps } from "../src/AppSectionContent";

function createProps(): AppSectionContentProps {
  return {
    userMode: "expert",
    effectivePillar: "perform",
    effectiveScreen: "session",
    monitorSession: { sessionId: "live-1", persistedSessionId: "persisted-1" } as never,
    monitorIsPlayback: true,
    monitorPlaybackProgress: 0.4,
    manifest: null,
    musicStyles: [],
    baseAssetCategories: [],
    defaultTrackMusicStyleId: "house",
    defaultBaseAssetCategoryId: "fx",
    libraryTab: "tracks",
    tracks: [{ id: "track-1" } as never],
    playlists: [{ id: "playlist-1" } as never],
    repositories: [{ id: "repo-1" } as never],
    baseAssets: [{ id: "asset-1" } as never],
    compositions: [{ id: "comp-1" } as never],
    newlyImportedId: "track-1",
    selectedTrack: { id: "track-1" } as never,
    selectedTrackId: "track-1",
    selectedPlaylistId: "playlist-1",
    selectedRepository: { id: "repo-1" } as never,
    selectedRepositoryId: "repo-1",
    selectedBaseAsset: { id: "asset-1" } as never,
    selectedBaseAssetId: "asset-1",
    selectedComposition: { id: "comp-1" } as never,
    selectedCompositionId: "comp-1",
    trackLoading: false,
    repositoryLoading: false,
    baseAssetLoading: false,
    compositionLoading: false,
    trackBusy: true,
    repositoryBusy: false,
    baseAssetBusy: false,
    compositionBusy: true,
    trackError: null,
    repositoryError: null,
    baseAssetError: null,
    compositionError: null,
    analysisMode: "track",
    analyzerLabel: "Analyzer",
    sessionBookmarksBySessionId: { "persisted-1": [] },
    sessions: [{ id: "persisted-1" } as never],
    selectedSessionId: "persisted-1",
    sessionsLoading: false,
    sessionsMutating: true,
    sessionsError: "boom",
    onImportTrack: vi.fn(async () => true),
    onImportRepository: vi.fn(async () => true),
    onImportBaseAsset: vi.fn(async () => true),
    onImportComposition: vi.fn(async () => true),
    onReanalyzeTrack: vi.fn(async () => true),
    onRelinkTrack: vi.fn(async () => true),
    onRelinkMissingTracks: vi.fn(async () => true),
    onReanalyzeRepository: vi.fn(async () => true),
    onDeleteTrack: vi.fn(async () => true),
    onDeleteRepository: vi.fn(async () => true),
    onSeedDemo: vi.fn(async () => undefined),
    onSavePlaylist: vi.fn(async () => true),
    onDeletePlaylist: vi.fn(async () => true),
    onSelectSimpleTrack: vi.fn(),
    onSelectSimpleRepository: vi.fn(),
    onSelectTrack: vi.fn(),
    onSelectPlaylist: vi.fn(),
    onSelectRepository: vi.fn(),
    onSelectBaseAsset: vi.fn(),
    onSelectComposition: vi.fn(),
    onInspectTrack: vi.fn(),
    onInspectRepository: vi.fn(),
    onInspectBaseAsset: vi.fn(),
    onInspectComposition: vi.fn(),
    onGoLibrary: vi.fn(),
    onGoCompose: vi.fn(),
    onTabChange: vi.fn(),
    onChangeAnalysisMode: vi.fn(),
    onUpdateTrackPerformance: vi.fn(async () => undefined),
    onUpdateTrackAnalysis: vi.fn(async () => undefined),
    onStartSimpleMonitoring: vi.fn(),
    onStartSimpleWizardSession: vi.fn(),
    onStartSession: vi.fn(async () => true),
    onStopSession: vi.fn(async () => undefined),
    onResumeSession: vi.fn(),
    onPlaybackSession: vi.fn(async () => true),
    onReplayBookmark: vi.fn(async () => true),
    onDeleteSession: vi.fn(async () => undefined),
    onSelectSession: vi.fn(),
  };
}

describe("appSectionContentPropsRuntime", () => {
  it("builds curate and inspect section props from the shared shell input", () => {
    const props = createProps();

    const curateProps = buildAppCurateSectionProps(props, {
      showSimpleWizard: false,
      showSimpleLibrary: false,
      showExpertLibrary: true,
    });
    const inspectProps = buildAppInspectSectionProps(props);

    expect(curateProps.showExpertLibrary).toBe(true);
    expect(curateProps.selectedTrackId).toBe("track-1");
    expect(curateProps.onTabChange).toBe(props.onTabChange);
    expect(inspectProps.track).toBe(props.selectedTrack);
    expect(inspectProps.repository).toBe(props.selectedRepository);
    expect(inspectProps.trackMutating).toBe(true);
  });

  it("builds compose and session section props without mutating monitor state", () => {
    const props = createProps();

    const composeProps = buildAppComposeSectionProps(props);
    const sessionProps = buildAppSessionSectionProps(props);

    expect(composeProps.composition).toBe(props.selectedComposition);
    expect(composeProps.busy).toBe(true);
    expect(sessionProps.monitorSession).toBe(props.monitorSession);
    expect(sessionProps.monitorPlaybackProgress).toBe(0.4);
    expect(sessionProps.onStopSession).toBe(props.onStopSession);
  });
});
