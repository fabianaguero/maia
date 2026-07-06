export interface BackgroundDeckState {
  source: AudioBufferSourceNode;
  buffer: AudioBuffer;
  gain: GainNode;
  trackId: string;
  trackIndex: number;
  startedAtContextTime: number;
  bufferDurationSec: number;
  durationSec: number;
  entrySecond: number;
  playbackRate: number;
  looping: boolean;
}

export interface BackgroundDeckSnapshot {
  trackId: string;
  trackIndex: number;
  looping: boolean;
  entrySecond: number;
  playbackRate: number;
  durationSec: number;
}
