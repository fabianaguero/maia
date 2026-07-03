import type { AppTranslations } from "../../../i18n/types";
import type { LibraryTrack, UpdateTrackPerformanceInput } from "../../../types/library";
import {
  buildQuantizedPlacementHint,
  buildTrackColorOptions,
  buildTrackPerformanceMetrics,
  buildTrackPerformancePanelState,
} from "./trackPerformancePanelRuntime";

export function buildTrackPerformancePanelViewModel(input: {
  track: LibraryTrack;
  busy: boolean;
  currentTime: number;
  placementSecond: number;
  onUpdatePerformance?: ((input: UpdateTrackPerformanceInput) => Promise<void>) | undefined;
  quantizeEnabled: boolean;
  t: AppTranslations;
}) {
  const panelState = buildTrackPerformancePanelState({
    track: input.track,
    busy: input.busy,
    currentTime: input.currentTime,
    onUpdatePerformance: input.onUpdatePerformance,
  });

  return {
    colorOptions: buildTrackColorOptions(input.t),
    summaryMetrics: buildTrackPerformanceMetrics({
      track: input.track,
      t: input.t,
    }),
    panelState,
    quantizeEnabledLabel: input.quantizeEnabled
      ? input.t.inspect.quantizeOn
      : input.t.inspect.quantizeOff,
    quantizedPlacementHint: buildQuantizedPlacementHint({
      currentTime: input.currentTime,
      placementSecond: input.placementSecond,
      durationSeconds: panelState.durationSeconds,
      quantizedToTemplate: input.t.inspect.quantizedTo,
      pendingLabel: input.t.inspect.pending,
    }),
  };
}
