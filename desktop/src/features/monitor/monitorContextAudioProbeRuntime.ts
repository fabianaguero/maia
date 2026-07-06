export function emitMonitorAudioProbe(input: {
  context: AudioContext;
  frequency: number;
  attackGain: number;
  releaseTimeSec: number;
}): void {
  if (input.context.state !== "running") {
    return;
  }

  const oscillator = input.context.createOscillator();
  const gainNode = input.context.createGain();
  gainNode.gain.setValueAtTime(input.attackGain, input.context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    input.context.currentTime + input.releaseTimeSec,
  );
  oscillator.frequency.value = input.frequency;
  oscillator.connect(gainNode);
  gainNode.connect(input.context.destination);
  oscillator.start(input.context.currentTime);
  oscillator.stop(input.context.currentTime + input.releaseTimeSec);
}
