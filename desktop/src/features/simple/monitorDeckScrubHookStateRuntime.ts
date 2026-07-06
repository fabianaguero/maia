import type { buildMonitorDeckScrubInteractionHandlers } from "./monitorDeckScrubControllerRuntime";

export function buildMonitorDeckScrubHookState(input: {
  overviewCanvasRef: { current: HTMLCanvasElement | null };
  waveformCanvasRef: { current: HTMLCanvasElement | null };
  waveformStageRef: { current: HTMLDivElement | null };
  seekToTrackProgress: (nextProgress: number) => void;
  seekTrackFromOverviewViewport: (clientX: number) => void;
  seekTrackFromViewport: (clientX: number) => void;
  interactionHandlers: ReturnType<typeof buildMonitorDeckScrubInteractionHandlers>;
}) {
  return {
    overviewCanvasRef: input.overviewCanvasRef,
    waveformCanvasRef: input.waveformCanvasRef,
    waveformStageRef: input.waveformStageRef,
    seekToTrackProgress: input.seekToTrackProgress,
    seekTrackFromOverviewViewport: input.seekTrackFromOverviewViewport,
    seekTrackFromViewport: input.seekTrackFromViewport,
    ...input.interactionHandlers,
  };
}
