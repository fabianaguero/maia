import type { MonitorDeckPalette } from "./monitorDeckCanvasPalette";
import type { LogWaveOverlayPoint } from "./monitorDeckViewModel";

interface MonitorDeckSampleWindowMetrics {
  avg: number;
  peak: number;
  energy: number;
}

export function buildMonitorDeckSampleWindowMetrics(
  samples: number[],
  step: number,
  steps: number,
  energyResolver: (avg: number, peak: number) => number,
): MonitorDeckSampleWindowMetrics {
  const start = Math.floor((step / steps) * samples.length);
  const end = Math.max(start + 1, Math.floor(((step + 1) / steps) * samples.length));
  let sum = 0;
  let peak = 0;
  let count = 0;

  for (let index = start; index < end; index += 1) {
    const value = samples[index] ?? 0;
    sum += value;
    peak = Math.max(peak, value);
    count += 1;
  }

  const avg = count > 0 ? sum / count : 0;
  return {
    avg,
    peak,
    energy: energyResolver(avg, peak),
  };
}

export function resolveMonitorDeckPhraseRibbonColor(
  palette: MonitorDeckPalette,
  energy: number,
): string {
  if (energy >= 0.78) {
    return palette.phraseHot;
  }
  if (energy >= 0.6) {
    return palette.phraseWarm;
  }
  if (energy >= 0.38) {
    return palette.phraseMid;
  }
  return palette.phraseCool;
}

export function resolveMonitorDeckTrackBandColors(
  palette: MonitorDeckPalette,
  energy: number,
): { colorTop: string; colorBottom: string } {
  if (energy >= 0.82) {
    return {
      colorTop: palette.trackTopHot,
      colorBottom: palette.trackBottomHot,
    };
  }
  if (energy >= 0.62) {
    return {
      colorTop: palette.trackTopWarm,
      colorBottom: palette.trackBottomWarm,
    };
  }
  if (energy >= 0.4) {
    return {
      colorTop: palette.trackTopMid,
      colorBottom: palette.trackBottomMid,
    };
  }
  return {
    colorTop: palette.trackTopCool,
    colorBottom: palette.trackBottomCool,
  };
}

export function buildMonitorDeckQuantizedLogBlockMetrics(input: {
  samples: LogWaveOverlayPoint[];
  step: number;
  steps: number;
  amplitudeScale: number;
  palette: MonitorDeckPalette;
}) {
  const sampleIndex = Math.min(
    input.samples.length - 1,
    Math.floor((input.step / Math.max(1, input.steps - 1)) * input.samples.length),
  );
  const sample = input.samples[sampleIndex];
  if (!sample) {
    return null;
  }

  const height = input.amplitudeScale * (0.12 + Math.max(0.06, sample.level) * 0.72);
  const fillStyle =
    sample.heat >= 0.68
      ? input.palette.logHot
      : sample.heat >= 0.28
        ? input.palette.logWarm
        : input.palette.logCool;

  return {
    sample,
    height,
    fillStyle,
    hasHotOverlay: sample.heat >= 0.68,
  };
}
