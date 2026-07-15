export function drawSingleSidedWaveform(
  context: CanvasRenderingContext2D,
  samples: number[],
  width: number,
  baseY: number,
  amplitudeScale: number,
  fillStyle: CanvasGradient | string,
): void {
  if (samples.length === 0) {
    return;
  }

  const stepX = width / Math.max(1, samples.length - 1);
  context.beginPath();
  context.moveTo(0, baseY);

  samples.forEach((value, index) => {
    const x = index * stepX;
    const y = baseY - value * amplitudeScale;
    context.lineTo(x, y);
  });

  context.lineTo(width, baseY);
  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();
}

export function drawWaveContour(
  context: CanvasRenderingContext2D,
  samples: number[],
  width: number,
  centerY: number,
  amplitudeScale: number,
  strokeStyle: string,
  lineWidth: number,
  direction: "top" | "bottom",
): void {
  if (samples.length === 0) {
    return;
  }

  const stepX = width / Math.max(1, samples.length - 1);
  context.beginPath();
  samples.forEach((value, index) => {
    const x = index * stepX;
    const y =
      direction === "top" ? centerY - value * amplitudeScale : centerY + value * amplitudeScale;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.stroke();
}

export function drawRekordboxWaveformBars(input: {
  context: CanvasRenderingContext2D;
  samples: number[];
  width: number;
  centerY: number;
  amplitudeScale: number;
  lowColor: string;
  midColor: string;
  highColor: string;
  symmetric?: boolean;
}): void {
  if (input.samples.length === 0) return;

  const stepX = input.width / input.samples.length;
  const barWidth = Math.max(1, Math.min(3, stepX * 0.72));
  input.samples.forEach((sample, index) => {
    const previous = input.samples[Math.max(0, index - 1)] ?? sample;
    const next = input.samples[Math.min(input.samples.length - 1, index + 1)] ?? sample;
    const energy = Math.max(0.025, Math.min(1, sample));
    const transient = Math.min(1, Math.abs(sample - previous) * 4 + Math.abs(next - sample) * 3);
    const totalHeight = energy * input.amplitudeScale;
    const lowHeight = totalHeight * (0.48 + energy * 0.12);
    const midHeight = totalHeight * (0.24 + transient * 0.18);
    const highHeight = Math.max(1, totalHeight - lowHeight - midHeight);
    const direction = input.symmetric === false ? 1 : 2;
    const x = index * stepX + (stepX - barWidth) / 2;

    input.context.fillStyle = input.lowColor;
    input.context.fillRect(x, input.centerY - lowHeight, barWidth, lowHeight * direction);
    input.context.fillStyle = input.midColor;
    input.context.fillRect(x, input.centerY - lowHeight - midHeight, barWidth, midHeight);
    input.context.fillStyle = input.highColor;
    input.context.fillRect(
      x,
      input.centerY - lowHeight - midHeight - highHeight,
      barWidth,
      highHeight,
    );

    if (input.symmetric !== false) {
      input.context.fillStyle = input.midColor;
      input.context.fillRect(x, input.centerY + lowHeight, barWidth, midHeight);
      input.context.fillStyle = input.highColor;
      input.context.fillRect(x, input.centerY + lowHeight + midHeight, barWidth, highHeight);
    }
  });
}
