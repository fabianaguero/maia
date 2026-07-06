import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";

export interface MonitorGuideTrackDecodeLogger {
  info: (message: string, ...args: unknown[]) => void;
}

export interface GuideTrackDecodeResponse {
  ok: boolean;
  status: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface GuideTrackDecodeAudioBuffer {
  length: number;
  numberOfChannels: number;
  sampleRate: number;
  getChannelData(channel: number): Float32Array;
}

export interface GuideTrackDecodeOfflineAudioContext {
  decodeAudioData(buffer: ArrayBuffer): Promise<GuideTrackDecodeAudioBuffer>;
}

export interface GuideTrackDecodeDependencies {
  cache: Map<string, Promise<GuideTrackPCM>>;
  logger: MonitorGuideTrackDecodeLogger;
  isTauri: () => boolean;
  convertFileSrc: (path: string) => string;
  fetchAudio: (url: string) => Promise<GuideTrackDecodeResponse>;
  invokeReadAudioBytes: (path: string) => Promise<string>;
  decodeBase64: (value: string) => string;
  createOfflineAudioContext: (
    channels: number,
    frameCount: number,
    sampleRate: number,
  ) => GuideTrackDecodeOfflineAudioContext;
}
