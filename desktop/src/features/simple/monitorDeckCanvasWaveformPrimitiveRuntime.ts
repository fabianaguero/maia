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
