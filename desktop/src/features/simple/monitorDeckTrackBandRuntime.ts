import { drawPhraseRibbon, drawTrackEnergyBand } from "./monitorDeckCanvasDrawRuntime";
import { fillVerticalGradientRect } from "./monitorDeckCanvasGradientRuntime";
import type { MonitorDeckMainCanvasState } from "./monitorDeckMainCanvasRuntime";
import type { buildMonitorDeckCanvasScenePlan } from "./monitorDeckMainCanvasSceneRuntime";

export function drawMonitorDeckTrackBand(
  context: CanvasRenderingContext2D,
  state: MonitorDeckMainCanvasState,
  width: number,
  scene: ReturnType<typeof buildMonitorDeckCanvasScenePlan>,
): void {
  const { palette, trackWaveSamples } = state;

  fillVerticalGradientRect(context, scene.track.glowRect, scene.track.glowStops);

  drawTrackEnergyBand(
    context,
    trackWaveSamples,
    width,
    scene.track.energyBandTopY,
    scene.track.energyBandHeight,
    palette,
  );

  drawPhraseRibbon(
    context,
    trackWaveSamples,
    width,
    scene.track.phraseRibbonTopY,
    scene.track.phraseRibbonHeight,
    palette,
  );
}
