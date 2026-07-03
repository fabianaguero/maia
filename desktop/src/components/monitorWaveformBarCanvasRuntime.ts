import type { MonitorWaveformBandColors, WaveColumn } from "./monitorWaveformBarTypes";

export function syncMonitorWaveformCanvasSize(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  devicePixelRatio = window.devicePixelRatio || 1,
): { width: number; height: number } | null {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width <= 0 || height <= 0) {
    return null;
  }

  const scaledWidth = Math.floor(width * devicePixelRatio);
  const scaledHeight = Math.floor(height * devicePixelRatio);
  if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  return { width, height };
}

function drawOverviewBed(args: {
  ctx: CanvasRenderingContext2D;
  width: number;
  guideWaveform: number[];
  centerY: number;
  trackHeight: number;
  colors: MonitorWaveformBandColors;
}): void {
  const { ctx, width, guideWaveform, centerY, trackHeight, colors } = args;
  if (guideWaveform.length === 0) {
    return;
  }

  const usable = Math.min(guideWaveform.length, Math.max(64, Math.floor(width / 2)));
  for (let index = 0; index < usable; index++) {
    const sourceIndex = Math.floor((index / usable) * guideWaveform.length);
    const amplitude = Math.max(0.03, guideWaveform[sourceIndex] ?? 0);
    const x = (index / usable) * width;
    const lowHeight = amplitude * (trackHeight * 0.52);
    const midHeight = amplitude * (trackHeight * 0.34);
    const highHeight = amplitude * (trackHeight * 0.16);

    ctx.fillStyle = colors.low;
    ctx.fillRect(x, centerY - lowHeight, 1.25, lowHeight * 2);
    ctx.fillStyle = colors.mid;
    ctx.fillRect(x, centerY - midHeight, 1.25, midHeight * 2);
    ctx.fillStyle = colors.high;
    ctx.fillRect(x, centerY - highHeight, 1.25, highHeight * 2);
  }
}

function drawRekordboxWave(args: {
  ctx: CanvasRenderingContext2D;
  width: number;
  halfHeight: number;
  trackHeight: number;
  history: WaveColumn[];
  startIndex: number;
  centerY: number;
  metricsKey: "source" | "processed";
  colors: MonitorWaveformBandColors;
  barWidth: number;
  nowMs: number;
}): void {
  const {
    ctx,
    width,
    halfHeight,
    trackHeight,
    history,
    startIndex,
    centerY,
    metricsKey,
    colors,
    barWidth,
    nowMs,
  } = args;

  for (let index = startIndex; index < history.length; index++) {
    const column = history[index];
    if (column.anomalyHeat > 0.05) {
      const x = width - (history.length - index) * barWidth;
      ctx.fillStyle = `rgba(255, 30, 80, ${column.anomalyHeat * 0.15})`;
      ctx.fillRect(x, centerY - halfHeight / 2, barWidth, halfHeight);
    }
  }

  for (let index = startIndex; index < history.length; index++) {
    const column = history[index];
    const x = width - (history.length - index) * barWidth;
    const metrics = column[metricsKey];
    const jitterFreq = nowMs / 60;
    const jitter = Math.sin(jitterFreq + index) * 0.1;

    const bands = [
      { height: Math.max(1, (metrics.low + jitter) * (trackHeight / 2)), color: colors.low },
      { height: Math.max(1, (metrics.mid - jitter) * (trackHeight / 2)), color: colors.mid },
      {
        height: Math.max(1, (metrics.high + jitter * 0.5) * (trackHeight / 2)),
        color: colors.high,
      },
    ].sort((left, right) => right.height - left.height);

    bands.forEach((band) => {
      ctx.fillStyle = band.color;
      ctx.fillRect(x, centerY - band.height, Math.max(1, barWidth - 0.5), band.height * 2);
    });
  }
}

export function drawMonitorWaveformFrame(args: {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  history: WaveColumn[];
  guideWaveform: number[];
  barWidth: number;
  nowMs?: number;
}): boolean {
  const { ctx, width, height, history, guideWaveform, barWidth, nowMs = Date.now() } = args;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#010204";
  ctx.fillRect(0, 0, width, height);

  const halfHeight = height / 2;
  const trackHeight = halfHeight * 0.85;
  if (history.length === 0 && guideWaveform.length === 0) {
    return false;
  }

  const maxColumns = Math.floor(width / barWidth);
  const startIndex = Math.max(0, history.length - maxColumns);

  drawOverviewBed({
    ctx,
    width,
    guideWaveform,
    centerY: halfHeight / 2,
    trackHeight,
    colors: {
      low: "rgba(0, 85, 255, 0.22)",
      mid: "rgba(255, 145, 32, 0.18)",
      high: "rgba(255, 255, 255, 0.14)",
    },
  });
  drawOverviewBed({
    ctx,
    width,
    guideWaveform,
    centerY: halfHeight + halfHeight / 2,
    trackHeight,
    colors: {
      low: "rgba(0, 220, 255, 0.18)",
      mid: "rgba(255, 70, 125, 0.14)",
      high: "rgba(255, 255, 255, 0.1)",
    },
  });

  drawRekordboxWave({
    ctx,
    width,
    halfHeight,
    trackHeight,
    history,
    startIndex,
    centerY: halfHeight / 2,
    metricsKey: "source",
    colors: {
      low: "rgba(0, 80, 255, 0.9)",
      mid: "rgba(255, 120, 0, 0.8)",
      high: "rgba(255, 255, 255, 0.9)",
    },
    barWidth,
    nowMs,
  });
  drawRekordboxWave({
    ctx,
    width,
    halfHeight,
    trackHeight,
    history,
    startIndex,
    centerY: halfHeight + halfHeight / 2,
    metricsKey: "processed",
    colors: {
      low: "rgba(0, 200, 255, 0.9)",
      mid: "rgba(255, 50, 120, 0.8)",
      high: "rgba(255, 255, 255, 0.9)",
    },
    barWidth,
    nowMs,
  });

  const scanX = ((nowMs / 20) % (width * 1.2)) - width / 5;
  const gradient = ctx.createLinearGradient(scanX, 0, scanX + 60, 0);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.03)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(scanX, 0, 60, height);

  const playheadX = width - 1;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.shadowColor = "rgba(100, 200, 255, 0.5)";
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, height);
  ctx.stroke();
  ctx.shadowBlur = 0;

  return true;
}
