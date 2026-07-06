export const RENDER_SAMPLE_RATE = 44100;
export const DEFAULT_MONITOR_WAV_VOLUME = 0.4;

export interface GuideTrackPCM {
  samples: Float32Array;
  sampleRate: number;
  durationSec: number;
}

export interface CrossfadeHandle {
  gainNode: GainNode;
  source: AudioBufferSourceNode;
  scheduledEndTime: number;
}

export interface MonitorAudioRuntimeLogger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
}
