import type { GuideTrackPCM } from "./monitorContextRuntime";
import { RENDER_SAMPLE_RATE } from "./monitorContextRuntime";

export interface MonitorGuideTrackDecodeLogger {
  info: (message: string, ...args: unknown[]) => void;
}

interface GuideTrackDecodeResponse {
  ok: boolean;
  status: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface GuideTrackDecodeAudioBuffer {
  length: number;
  numberOfChannels: number;
  sampleRate: number;
  getChannelData(channel: number): Float32Array;
}

interface GuideTrackDecodeOfflineAudioContext {
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

export function createGuideTrackDecodeCache(): Map<string, Promise<GuideTrackPCM>> {
  return new Map<string, Promise<GuideTrackPCM>>();
}

export function isTauriRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const tauriWindow = window as typeof window & {
    __TAURI_INTERNALS__?: unknown;
    __TAURI__?: unknown;
  };
  return Boolean(tauriWindow.__TAURI_INTERNALS__ || tauriWindow.__TAURI__);
}

export async function decodeGuideTrackFile(
  path: string,
  dependencies: GuideTrackDecodeDependencies,
): Promise<GuideTrackPCM> {
  if (dependencies.cache.has(path)) {
    return dependencies.cache.get(path)!;
  }

  const promise = decodeGuideTrackFileImpl(path, dependencies);
  dependencies.cache.set(path, promise);
  promise.catch(() => {
    dependencies.cache.delete(path);
  });

  return promise;
}

async function decodeGuideTrackFileImpl(
  path: string,
  dependencies: GuideTrackDecodeDependencies,
): Promise<GuideTrackPCM> {
  dependencies.logger.info("decodeAudioFile path=%s", path);

  let arrayBuffer: ArrayBuffer;
  try {
    if (!dependencies.isTauri()) {
      throw new Error("convertFileSrc not available in browser");
    }
    const url = dependencies.convertFileSrc(path);
    const response = await dependencies.fetchAudio(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    arrayBuffer = await response.arrayBuffer();
    dependencies.logger.info(
      "audio file loaded %d bytes, decoding via fetch",
      arrayBuffer.byteLength,
    );
  } catch (error) {
    if (!dependencies.isTauri()) {
      throw new Error("Audio file not available in browser environment");
    }
    dependencies.logger.info(
      "convertFileSrc failed, falling back to read_audio_bytes: %s",
      error instanceof Error ? error.message : String(error),
    );
    const base64 = await dependencies.invokeReadAudioBytes(path);
    const binary = dependencies.decodeBase64(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    arrayBuffer = bytes.buffer;
    dependencies.logger.info(
      "audio file loaded %d bytes via IPC",
      arrayBuffer.byteLength,
    );
  }

  const offlineContext = dependencies.createOfflineAudioContext(
    1,
    RENDER_SAMPLE_RATE * 600,
    RENDER_SAMPLE_RATE,
  );
  const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);
  const mono = new Float32Array(audioBuffer.length);
  const firstChannel = audioBuffer.getChannelData(0);

  if (audioBuffer.numberOfChannels >= 2) {
    const secondChannel = audioBuffer.getChannelData(1);
    for (let index = 0; index < mono.length; index += 1) {
      mono[index] = (firstChannel[index] + secondChannel[index]) * 0.5;
    }
  } else {
    mono.set(firstChannel);
  }

  const durationSec = mono.length / audioBuffer.sampleRate;
  dependencies.logger.info(
    "decoded mono PCM: %d samples, %ss @ %dHz",
    mono.length,
    durationSec.toFixed(2),
    audioBuffer.sampleRate,
  );

  return {
    samples: mono,
    sampleRate: audioBuffer.sampleRate,
    durationSec,
  };
}
