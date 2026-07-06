import type { AppTranslations } from "../../i18n/types";
import type { ActiveMonitorSession } from "../monitor/MonitorContext";
import type { BeatGridPoint, LibraryTrack } from "../../types/library";
import { getTrackTitle as getLibraryTrackTitle } from "../../utils/track";
import { getStreamAdapterCode } from "../../utils/monitorLabels";
import type { MonitorLaunchSource } from "../../types/monitorLaunch";
import type { MonitorAlertShape } from "./monitorDeckControls";
import {
  resolveSimpleMonitorDeckRemainingSeconds,
  resolveSimpleMonitorSourceBinding,
  resolveSimpleMonitorTrackLabel,
} from "./simpleMonitorScreenViewModelRuntime";

export interface SimpleMonitorScreenViewModel {
  monitorSourceTitle: string;
  monitorSourcePath: string;
  monitorTrackTitle: string;
  isConnectingMonitor: boolean;
  uptimeLabel: string;
  deckRemainingSeconds: number | null;
}

export type SimpleMonitorDeckPreset = "passive" | "balanced" | "alert" | "custom";
export type SimpleMonitorVisualPreset = "passive" | "balanced" | "alert";

export interface SimpleMonitorDeckStateViewModel {
  deckDurationSeconds: number | null;
  activeBeatGrid: BeatGridPoint[];
  streamAdapterLabel: string;
  isMonitorActive: boolean;
  deckPresetLabel: string;
  deckVisualPreset: SimpleMonitorVisualPreset;
}

export function coerceSimpleMonitorCollection<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export function resolveSimpleMonitorDeckPresetLabel(
  preset: SimpleMonitorDeckPreset,
  t: AppTranslations,
): string {
  switch (preset) {
    case "passive":
      return t.simpleMode.deckSetup.presetPassive;
    case "alert":
      return t.simpleMode.deckSetup.presetAlert;
    case "custom":
      return t.simpleMode.deckSetup.presetCustom;
    default:
      return t.simpleMode.deckSetup.presetBalanced;
  }
}

export function resolveSimpleMonitorVisualPreset(input: {
  activePreset: SimpleMonitorDeckPreset;
  alertShape: MonitorAlertShape;
}): SimpleMonitorVisualPreset {
  if (
    input.activePreset === "passive" ||
    input.activePreset === "balanced" ||
    input.activePreset === "alert"
  ) {
    return input.activePreset;
  }

  if (input.alertShape === "soft") {
    return "passive";
  }

  if (input.alertShape === "aggressive") {
    return "alert";
  }

  return "balanced";
}

export function buildSimpleMonitorDeckStateViewModel(input: {
  session: ActiveMonitorSession | null;
  isListening: boolean;
  isLaunchingMonitor: boolean;
  activeTrack: LibraryTrack | null;
  trackDurationSeconds: number | null;
  activePreset: SimpleMonitorDeckPreset;
  alertShape: MonitorAlertShape;
  t: AppTranslations;
}): SimpleMonitorDeckStateViewModel {
  return {
    deckDurationSeconds:
      input.trackDurationSeconds ?? input.activeTrack?.analysis?.durationSeconds ?? null,
    activeBeatGrid: input.activeTrack?.analysis?.beatGrid ?? input.activeTrack?.beatGrid ?? [],
    streamAdapterLabel: getStreamAdapterCode(input.session?.adapterKind),
    isMonitorActive: input.isListening || input.isLaunchingMonitor,
    deckPresetLabel: resolveSimpleMonitorDeckPresetLabel(input.activePreset, input.t),
    deckVisualPreset: resolveSimpleMonitorVisualPreset({
      activePreset: input.activePreset,
      alertShape: input.alertShape,
    }),
  };
}

export function resolveSimpleMonitorActiveTrack(
  tracks: LibraryTrack[],
  trackId?: string,
  trackName?: string,
  sessionTrackId?: string,
  sessionTrackName?: string,
): LibraryTrack | null {
  const resolvedTrackId = trackId || sessionTrackId;
  if (resolvedTrackId) {
    const matchedTrack = tracks.find((track) => track.id === resolvedTrackId) ?? null;
    if (matchedTrack) {
      return matchedTrack;
    }
  }

  const resolvedTrackName = trackName || sessionTrackName;
  if (!resolvedTrackName) {
    return null;
  }

  return tracks.find((track) => getLibraryTrackTitle(track) === resolvedTrackName) ?? null;
}

export function formatSimpleMonitorUptimeLabel(uptimeSeconds: number): string {
  return uptimeSeconds < 60
    ? `${uptimeSeconds}s`
    : `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`;
}

export function buildSimpleMonitorScreenViewModel(input: {
  session: ActiveMonitorSession | null;
  launchingSource: MonitorLaunchSource | null;
  isLaunchingMonitor: boolean;
  selectedSoundId: string;
  tracks: LibraryTrack[];
  trackName?: string;
  t: AppTranslations;
  nowMs: number;
  totalAnomalies: number;
  trackElapsedSeconds: number;
  deckDurationSeconds: number | null;
}): SimpleMonitorScreenViewModel {
  const { monitorSourceTitle, monitorSourcePath } = resolveSimpleMonitorSourceBinding({
    session: input.session,
    launchingSource: input.launchingSource,
    t: input.t,
  });
  const monitorTrackTitle = resolveSimpleMonitorTrackLabel({
    trackName: input.trackName,
    session: input.session,
    selectedSoundId: input.selectedSoundId,
    tracks: input.tracks,
    t: input.t,
  });
  const isConnectingMonitor = input.isLaunchingMonitor && !input.session;
  const uptimeSeconds = input.session
    ? Math.floor((input.nowMs - input.session.startedAt) / 1000)
    : 0;

  return {
    monitorSourceTitle,
    monitorSourcePath,
    monitorTrackTitle,
    isConnectingMonitor,
    uptimeLabel: formatSimpleMonitorUptimeLabel(uptimeSeconds),
    deckRemainingSeconds: resolveSimpleMonitorDeckRemainingSeconds({
      deckDurationSeconds: input.deckDurationSeconds,
      trackElapsedSeconds: input.trackElapsedSeconds,
    }),
  };
}
