import { resolveDeckScrubProgress, resolveOverviewScrubProgress } from "./monitorDeckScrubRuntime";

export function resolveOverviewViewportSeekProgress(input: {
  canvas: Pick<HTMLCanvasElement, "getBoundingClientRect"> | null;
  clientX: number;
}): number | null {
  if (!input.canvas) {
    return null;
  }

  const rect = input.canvas.getBoundingClientRect();
  return resolveOverviewScrubProgress({
    clientX: input.clientX,
    left: rect.left,
    width: rect.width,
  });
}

export function resolveStageViewportSeekProgress(input: {
  stage: Pick<HTMLDivElement, "getBoundingClientRect"> | null;
  clientX: number;
  startRatio: number;
  startProgress: number;
}): number | null {
  if (!input.stage) {
    return null;
  }

  const rect = input.stage.getBoundingClientRect();
  return resolveDeckScrubProgress({
    clientX: input.clientX,
    left: rect.left,
    width: rect.width,
    startRatio: input.startRatio,
    startProgress: input.startProgress,
  });
}
