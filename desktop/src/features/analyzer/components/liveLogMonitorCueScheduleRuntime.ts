import type { RoutedLiveCue } from "./liveSonificationScene";

export interface CueSamplePlaybackSpec {
  offsetSeconds: number;
  durationSeconds: number;
  playbackRate: number;
  detuneCents: number;
}

export interface CueTrackSlicePlaybackSpec {
  offsetSeconds: number;
  durationSeconds: number;
  playbackRate: number;
  detuneCents: number;
}

export interface TrackSliceAudioDeck {
  buffer: AudioBuffer;
  entrySecond: number;
}

function connectCueGainNode(
  context: AudioContext,
  cue: RoutedLiveCue,
  gainNode: GainNode,
  startAt: number,
  destination: AudioNode,
): void {
  const stereoPanner =
    typeof context.createStereoPanner === "function" ? context.createStereoPanner() : null;
  if (stereoPanner) {
    stereoPanner.pan.setValueAtTime(cue.pan, startAt);
    gainNode.connect(stereoPanner);
    stereoPanner.connect(destination);
    return;
  }

  gainNode.connect(destination);
}

export function buildSampleCuePlaybackSpec(
  cue: RoutedLiveCue,
  sampleDurationSeconds: number,
): CueSamplePlaybackSpec {
  const routeOffsetRatio =
    cue.routeKey === "info"
      ? 0.08
      : cue.routeKey === "warn"
        ? 0.22
        : cue.routeKey === "error"
          ? 0.42
          : 0.64;
  const cueOffsetRatio = ((cue.eventIndex % 5) * 0.07) % 0.28;
  const offsetSeconds = Math.min(
    Math.max(0, sampleDurationSeconds - 0.04),
    sampleDurationSeconds * Math.min(0.88, routeOffsetRatio + cueOffsetRatio),
  );
  const durationSeconds = Math.min(
    Math.max(0.09, cue.durationMs / 1000),
    Math.max(0.09, sampleDurationSeconds - offsetSeconds),
  );

  return {
    offsetSeconds,
    durationSeconds,
    playbackRate: Math.max(0.55, Math.min(1.85, cue.noteHz / 261.63)),
    detuneCents: cue.accent === "anomaly" ? 120 : 0,
  };
}

export function buildTrackSliceCuePlaybackSpec(
  cue: RoutedLiveCue,
  deckDurationSeconds: number,
  anchorSecond: number,
): CueTrackSlicePlaybackSpec {
  const routeNudge =
    cue.routeKey === "info"
      ? -0.08
      : cue.routeKey === "warn"
        ? 0.02
        : cue.routeKey === "error"
          ? 0.08
          : 0.14;
  const safeDeckDuration = Math.max(0.12, deckDurationSeconds);
  const offsetSeconds = Math.max(
    0,
    Math.min(safeDeckDuration - 0.05, anchorSecond + routeNudge + (cue.eventIndex % 4) * 0.015),
  );
  const durationSeconds = Math.min(
    Math.max(0.08, cue.durationMs / 1000),
    Math.max(0.08, safeDeckDuration - offsetSeconds),
  );

  return {
    offsetSeconds,
    durationSeconds,
    playbackRate:
      cue.routeKey === "anomaly"
        ? 1.08
        : cue.routeKey === "error"
          ? 1.03
          : cue.routeKey === "warn"
            ? 0.98
            : 0.94,
    detuneCents: cue.accent === "anomaly" ? 80 : 0,
  };
}

export function scheduleSynthCue(
  context: AudioContext,
  cue: RoutedLiveCue,
  startAt: number,
  destination: AudioNode,
): void {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = cue.waveform;
  oscillator.frequency.setValueAtTime(cue.noteHz, startAt);
  if (cue.accent === "anomaly") {
    oscillator.detune.setValueAtTime(90, startAt);
  }

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, cue.gain), startAt + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    startAt + Math.max(0.08, cue.durationMs / 1000),
  );

  oscillator.connect(gainNode);
  connectCueGainNode(context, cue, gainNode, startAt, destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + Math.max(0.1, cue.durationMs / 1000) + 0.04);
}

export function scheduleSampleCue(
  context: AudioContext,
  cue: RoutedLiveCue,
  sampleBuffer: AudioBuffer,
  startAt: number,
  destination: AudioNode,
): void {
  const spec = buildSampleCuePlaybackSpec(cue, sampleBuffer.duration);
  const source = context.createBufferSource();
  const gainNode = context.createGain();

  source.buffer = sampleBuffer;
  source.playbackRate.setValueAtTime(spec.playbackRate, startAt);
  if (spec.detuneCents !== 0) {
    source.detune.setValueAtTime(spec.detuneCents, startAt);
  }

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, cue.gain), startAt + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + spec.durationSeconds);

  source.connect(gainNode);
  connectCueGainNode(context, cue, gainNode, startAt, destination);

  source.start(startAt, spec.offsetSeconds, spec.durationSeconds);
  source.stop(startAt + spec.durationSeconds + 0.03);
}

export function scheduleTrackSliceCue(
  context: AudioContext,
  cue: RoutedLiveCue,
  deck: TrackSliceAudioDeck,
  startAt: number,
  destination: AudioNode,
  currentTrackSecond: number | null,
): void {
  const spec = buildTrackSliceCuePlaybackSpec(
    cue,
    deck.buffer.duration,
    currentTrackSecond ?? deck.entrySecond,
  );
  const source = context.createBufferSource();
  const gainNode = context.createGain();

  source.buffer = deck.buffer;
  source.playbackRate.setValueAtTime(spec.playbackRate, startAt);
  if (spec.detuneCents !== 0) {
    source.detune.setValueAtTime(spec.detuneCents, startAt);
  }

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, cue.gain), startAt + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + spec.durationSeconds);

  source.connect(gainNode);
  connectCueGainNode(context, cue, gainNode, startAt, destination);

  source.start(startAt, spec.offsetSeconds, spec.durationSeconds);
  source.stop(startAt + spec.durationSeconds + 0.03);
}
