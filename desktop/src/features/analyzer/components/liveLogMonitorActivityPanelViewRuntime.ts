import type { RoutedLiveCue } from "./liveSonificationScene";
import type { TailCellStyle, WaveBarStyle } from "./liveLogMonitorActivityPanelTypes";

export function buildLiveWaveBarStyle(
  cue: RoutedLiveCue,
  index: number,
  maxRecentCues: number,
): WaveBarStyle {
  return {
    "--bar-height": `${cue.accent === "anomaly" ? Math.max(60, cue.gain * 400) : Math.max(10, cue.gain * 220)}px`,
    "--bar-opacity": Math.max(0.3, 1 - index / maxRecentCues),
  };
}

export function buildHorizontalTailCellStyle(index: number, maxRecentCues: number): TailCellStyle {
  return {
    "--cell-opacity": Math.max(0.3, 1 - index / maxRecentCues),
  };
}
