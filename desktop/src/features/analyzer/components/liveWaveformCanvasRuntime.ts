export interface LiveWaveformCanvasSize {
  width: number;
  height: number;
  dpr: number;
}

export interface LiveWaveformCanvasFrame {
  timeData: Uint8Array;
  freqData: Uint8Array;
}

export function resolveLiveWaveformCanvasSize(input: {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  dpr?: number;
}): LiveWaveformCanvasSize {
  const width = Math.max(1, Math.floor(input.canvas.offsetWidth));
  const height = Math.max(1, Math.floor(input.canvas.offsetHeight));
  const dpr = input.dpr && Number.isFinite(input.dpr) && input.dpr > 0 ? input.dpr : 1;

  if (input.canvas.width !== width * dpr || input.canvas.height !== height * dpr) {
    input.canvas.width = width * dpr;
    input.canvas.height = height * dpr;
  }

  input.context.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { width, height, dpr };
}

export function sampleLiveWaveformAnalyser(analyser: AnalyserNode): LiveWaveformCanvasFrame {
  const bufferLength = analyser.frequencyBinCount;
  const timeData = new Uint8Array(bufferLength);
  const freqData = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(timeData);
  analyser.getByteFrequencyData(freqData);

  return { timeData, freqData };
}

export function drawLiveWaveformFrame(input: {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  accentColor: string;
  isAnomaly: boolean;
  timeData: Uint8Array;
  freqData: Uint8Array;
}): void {
  const { context, width, height, accentColor, isAnomaly, timeData, freqData } = input;
  context.clearRect(0, 0, width, height);

  const bgGradient = context.createLinearGradient(0, 0, 0, height);
  if (isAnomaly) {
    bgGradient.addColorStop(0, "rgba(244, 63, 94, 0.4)");
    bgGradient.addColorStop(1, "rgba(244, 63, 94, 0.1)");
  } else {
    bgGradient.addColorStop(0, "rgba(0, 0, 0, 0.3)");
    bgGradient.addColorStop(1, "rgba(0, 0, 0, 0.05)");
  }
  context.fillStyle = bgGradient;
  context.fillRect(0, 0, width, height);

  const barCount = 64;
  const barWidth = width / barCount;
  const step = Math.max(1, Math.floor(freqData.length / barCount));
  for (let index = 0; index < barCount; index += 1) {
    const value = freqData[Math.min(freqData.length - 1, index * step)] / 255;
    const barHeight = value * height * 0.8;
    const alpha = 0.15 + value * 0.3;
    context.fillStyle = `rgba(33, 180, 184, ${alpha})`;
    context.fillRect(index * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
  }

  context.beginPath();
  context.lineWidth = 2;
  const waveformGradient = context.createLinearGradient(0, 0, width, 0);
  waveformGradient.addColorStop(0, `${accentColor}88`);
  waveformGradient.addColorStop(0.5, accentColor);
  waveformGradient.addColorStop(1, `${accentColor}88`);
  context.strokeStyle = waveformGradient;

  const sliceWidth = width / Math.max(1, timeData.length);
  let x = 0;
  for (let index = 0; index < timeData.length; index += 1) {
    const value = timeData[index] / 128;
    const y = (value * height) / 2;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
    x += sliceWidth;
  }
  context.lineTo(width, height / 2);
  context.stroke();

  context.shadowColor = isAnomaly ? "#f43f5e" : accentColor;
  context.shadowBlur = isAnomaly ? 24 : 8;
  context.stroke();
  context.shadowBlur = 0;

  context.strokeStyle = isAnomaly ? "rgba(244, 63, 94, 0.4)" : "rgba(244, 242, 233, 0.08)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.stroke();
}
