const SCALE = [220, 261.63, 293.66, 349.23, 392, 440, 523.25, 587.33, 698.46, 783.99];

export function getMonitorSynthesisScale(): number[] {
  return SCALE;
}

export function quantizeMonitorFrequency(hz: number): number {
  let best = SCALE[0];
  let bestDistance = Math.abs(hz - best);
  for (const scaleNote of SCALE) {
    const distance = Math.abs(hz - scaleNote);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = scaleNote;
    }
  }
  return best;
}
