import type { UseSimpleMonitorDeckVisualStateInput } from "./simpleMonitorDeckVisualTypes";
import type { buildSimpleMonitorDeckVisualDerivedState } from "./simpleMonitorDeckVisualRuntime";

export type SimpleMonitorDeckVisualDerivedStateResult = ReturnType<
  typeof buildSimpleMonitorDeckVisualDerivedState
>;

export function buildSimpleMonitorDeckVisualCanvasEffectsInput(input: {
  visualState: Pick<
    UseSimpleMonitorDeckVisualStateInput,
    "waveformAnomalies" | "trackWaveProgress" | "deckVisualPreset" | "waveformScale" | "safeRuntime"
  >;
  scrub: {
    overviewCanvasRef: { current: HTMLCanvasElement | null };
    waveformCanvasRef: { current: HTMLCanvasElement | null };
    waveformStageRef: { current: HTMLDivElement | null };
  };
  derived: Pick<SimpleMonitorDeckVisualDerivedStateResult, "derivedDeckState" | "trackWaveSamples">;
}) {
  return {
    overviewCanvasRef: input.scrub.overviewCanvasRef,
    waveformCanvasRef: input.scrub.waveformCanvasRef,
    waveformStageRef: input.scrub.waveformStageRef,
    derivedDeckState: input.derived.derivedDeckState,
    waveformAnomalies: input.visualState.waveformAnomalies,
    trackWaveSamples: input.derived.trackWaveSamples,
    trackWaveProgress: input.visualState.trackWaveProgress,
    deckVisualPreset: input.visualState.deckVisualPreset,
    waveformScale: input.visualState.waveformScale,
    safeRuntime: input.visualState.safeRuntime ?? false,
  };
}

export function buildSimpleMonitorDeckVisualStateResult<
  TScrubState extends object,
  TDerivedState extends {
    visibleWindowSeconds: number;
    trackWaveSamples: number[];
    deckTimelineMarkers: unknown;
    deckBeatMarkers: unknown;
    derivedDeckState: object;
  },
>(input: {
  scrub: TScrubState;
  derived: TDerivedState;
}): TScrubState &
  TDerivedState["derivedDeckState"] & {
    visibleWindowSeconds: TDerivedState["visibleWindowSeconds"];
    trackWaveSamples: TDerivedState["trackWaveSamples"];
    deckTimelineMarkers: TDerivedState["deckTimelineMarkers"];
    deckBeatMarkers: TDerivedState["deckBeatMarkers"];
  } {
  return {
    ...input.scrub,
    ...input.derived.derivedDeckState,
    visibleWindowSeconds: input.derived.visibleWindowSeconds,
    trackWaveSamples: input.derived.trackWaveSamples,
    deckTimelineMarkers: input.derived.deckTimelineMarkers,
    deckBeatMarkers: input.derived.deckBeatMarkers,
  };
}
