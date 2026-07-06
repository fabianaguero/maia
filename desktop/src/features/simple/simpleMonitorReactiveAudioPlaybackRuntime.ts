import type { SimpleMonitorToneVoicePlan } from "./simpleMonitorReactiveAudioOrchestrationRuntime";

export function playSimpleMonitorVoicePlans(
  context: AudioContext,
  voices: SimpleMonitorToneVoicePlan[],
): void {
  voices.forEach((voice) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = voice.type;
    osc.frequency.setValueAtTime(voice.frequency, voice.startAt);
    gain.gain.setValueAtTime(0.0001, voice.startAt);
    gain.gain.linearRampToValueAtTime(voice.peakGain, voice.startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, voice.releaseAt);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(voice.startAt);
    osc.stop(voice.stopAt);
  });
}
