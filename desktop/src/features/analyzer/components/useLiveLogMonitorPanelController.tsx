import { useT } from "../../../i18n/I18nContext";
import { useMonitor } from "../../monitor/MonitorContext";
import { useLiveLogMonitorPanelRuntime } from "./useLiveLogMonitorPanelRuntime";
import { useLiveLogMonitorSurfaceState } from "./useLiveLogMonitorSurfaceState";
import type {
  BaseTrackPlaylist,
  BaseAssetRecord,
  CompositionResultRecord,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../../types/library";

export interface LiveLogMonitorPanelProps {
  repository: RepositoryAnalysis;
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  preferredBaseAssetId?: string | null;
  preferredCompositionId?: string | null;
  availableTracks: LibraryTrack[];
  availablePlaylists: BaseTrackPlaylist[];
}

export function useLiveLogMonitorPanelController(props: LiveLogMonitorPanelProps) {
  const t = useT();
  const monitor = useMonitor();
  const liveEnabled = monitor.session?.repoId === props.repository.id;
  const replayActive = liveEnabled && monitor.isPlayback;
  const playbackPercent =
    typeof monitor.playbackProgress === "number"
      ? Math.max(0, Math.min(100, Math.round(monitor.playbackProgress * 100)))
      : null;
  const playbackWindowLabel =
    replayActive && monitor.playbackEventIndex !== null && monitor.playbackEventCount !== null
      ? `${monitor.playbackEventIndex}/${monitor.playbackEventCount}`
      : null;

  const surfaceState = useLiveLogMonitorSurfaceState({
    repository: props.repository,
    availableBaseAssets: props.availableBaseAssets,
    availableCompositions: props.availableCompositions,
    preferredBaseAssetId: props.preferredBaseAssetId,
    preferredCompositionId: props.preferredCompositionId,
  });

  const renderState = useLiveLogMonitorPanelRuntime({
    ...props,
    monitor,
    t,
    liveEnabled,
    replayActive,
    playbackPercent,
    playbackWindowLabel,
    surfaceState,
  });

  return {
    liveEnabled,
    expanded: surfaceState.expanded,
    setExpanded: surfaceState.setExpanded,
    ...renderState,
  };
}
