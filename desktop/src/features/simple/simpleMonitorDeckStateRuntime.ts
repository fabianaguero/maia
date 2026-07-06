import type { AppTranslations } from "../../i18n/types";
import type { ActiveMonitorSession } from "../monitor/monitorContextTypes";
import type { BeatGridPoint, LibraryTrack } from "../../types/library";
import type { MonitorAlertShape } from "./monitorDeckControls";
import {
  buildSimpleMonitorDeckStateViewModel,
  resolveSimpleMonitorActiveTrack,
  type SimpleMonitorDeckPreset,
  type SimpleMonitorVisualPreset,
} from "./simpleMonitorViewModel";

export function resolveSimpleMonitorDeckBpm(
  liveSuggestedBpm: number | null,
  activeTrack: LibraryTrack | null,
): number | null {
  return liveSuggestedBpm ?? activeTrack?.analysis?.bpm ?? null;
}

export interface BuildSimpleMonitorDeckRuntimeStateArgs {
  session: ActiveMonitorSession | null;
  isListening: boolean;
  isLaunchingMonitor: boolean;
  tracks: LibraryTrack[];
  trackName?: string;
  trackDurationSeconds: number | null;
  activePreset: SimpleMonitorDeckPreset;
  alertShape: MonitorAlertShape;
  liveSuggestedBpm: number | null;
  t: AppTranslations;
}

export interface SimpleMonitorDeckRuntimeState {
  activeTrack: LibraryTrack | null;
  deckDurationSeconds: number | null;
  activeBeatGrid: BeatGridPoint[] | null;
  streamAdapterLabel: string;
  isMonitorActive: boolean;
  deckPresetLabel: string;
  deckVisualPreset: SimpleMonitorVisualPreset;
  deckBpm: number | null;
}

function resolveSimpleMonitorDeckActiveTrack(
  input: BuildSimpleMonitorDeckRuntimeStateArgs,
): LibraryTrack | null {
  return resolveSimpleMonitorActiveTrack(
    input.tracks,
    undefined,
    input.trackName,
    input.session?.trackId,
    input.session?.trackName,
  );
}

export function buildSimpleMonitorDeckRuntimeState(
  input: BuildSimpleMonitorDeckRuntimeStateArgs,
): SimpleMonitorDeckRuntimeState {
  const activeTrack = resolveSimpleMonitorDeckActiveTrack(input);
  const deckState = buildSimpleMonitorDeckStateViewModel({
    session: input.session,
    isListening: input.isListening,
    isLaunchingMonitor: input.isLaunchingMonitor,
    activeTrack,
    trackDurationSeconds: input.trackDurationSeconds,
    activePreset: input.activePreset,
    alertShape: input.alertShape,
    t: input.t,
  });

  return {
    activeTrack,
    deckDurationSeconds: deckState.deckDurationSeconds,
    activeBeatGrid: deckState.activeBeatGrid,
    streamAdapterLabel: deckState.streamAdapterLabel,
    isMonitorActive: deckState.isMonitorActive,
    deckPresetLabel: deckState.deckPresetLabel,
    deckVisualPreset: deckState.deckVisualPreset,
    deckBpm: resolveSimpleMonitorDeckBpm(input.liveSuggestedBpm, activeTrack),
  };
}
