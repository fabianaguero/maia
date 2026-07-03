import type { AppTranslations } from "../../i18n/en";
import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  CompositionResultRecord,
  ImportCompositionInput,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../types/library";
import type { ComposeTab, ComposeScreenViewModel } from "./composeScreenRuntime";

export interface ComposeScreenProps {
  composition: CompositionResultRecord | null;
  compositions: CompositionResultRecord[];
  baseAssets: BaseAssetRecord[];
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  repositories: RepositoryAnalysis[];
  analyzerLabel: string;
  busy: boolean;
  onImportComposition: (input: ImportCompositionInput) => Promise<boolean>;
  onSelectComposition: (id: string) => void;
  onGoLibrary: () => void;
}

export function buildComposeScreenViewModelInput(input: {
  t: AppTranslations;
  tab: ComposeTab;
  composition: CompositionResultRecord | null;
  compositions: CompositionResultRecord[];
  baseAssets: BaseAssetRecord[];
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
}) {
  return input;
}

export function buildComposeScreenSummaryState(input: {
  composition: CompositionResultRecord | null;
  viewModel: ComposeScreenViewModel;
}) {
  return {
    showSummary: input.viewModel.showSummary,
    selectedComposition: input.composition,
    compositionsCount: input.viewModel.compositionsCount,
    targetBpmLabel: input.viewModel.targetBpmLabel,
    timingSourceLabel: input.viewModel.timingSourceLabel,
  };
}

export function buildComposeScreenFormInput(input: {
  busy: boolean;
  baseAssets: BaseAssetRecord[];
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  repositories: RepositoryAnalysis[];
  onImportComposition: ComposeScreenProps["onImportComposition"];
}) {
  return input;
}

export function buildComposeScreenPickerInput(input: {
  composition: CompositionResultRecord | null;
  compositionOptions: ComposeScreenViewModel["compositionOptions"];
  onSelectComposition: ComposeScreenProps["onSelectComposition"];
}) {
  return input;
}

export function buildComposeScreenWaveformInput(input: {
  composition: CompositionResultRecord;
  currentTime: number;
  onSeek: ((timeSeconds: number) => void) | undefined;
  analysisProgress: number | null | undefined;
}) {
  return {
    bins: input.composition.waveformBins,
    beatGrid: input.composition.beatGrid,
    durationSeconds:
      typeof input.composition.metrics.previewDurationSeconds === "number"
        ? input.composition.metrics.previewDurationSeconds
        : null,
    hotCues: input.composition.visualization?.hotCues,
    currentTime: input.currentTime,
    hero: true,
    onSeek: input.onSeek,
    analysisProgress: input.analysisProgress,
  };
}

export function buildComposeScreenBpmCurveInput(input: { composition: CompositionResultRecord }) {
  return {
    bpmCurve: input.composition.bpmCurve,
    fallbackBpm: input.composition.targetBpm,
    durationSeconds:
      typeof input.composition.metrics.previewDurationSeconds === "number"
        ? input.composition.metrics.previewDurationSeconds
        : null,
  };
}

export function buildComposeScreenTabButtonState(input: {
  tabOptions: ComposeScreenViewModel["tabOptions"];
  setTab: (tab: ComposeTab) => void;
}) {
  return input;
}

export function buildComposeScreenRenderPreviewInput(input: {
  composition: CompositionResultRecord;
  onTimeUpdate: (value: number) => void;
}) {
  return input;
}
