import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";
import { decodeGuideTrackPcm } from "./monitorGuideTrackPcmDecodeRuntime";
import { loadGuideTrackArrayBuffer } from "./monitorGuideTrackDecodeTransportRuntime";
import type {
  GuideTrackDecodeDependencies,
  MonitorGuideTrackDecodeLogger,
} from "./monitorGuideTrackDecodeTypes";

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
  const arrayBuffer = await loadGuideTrackArrayBuffer(path, dependencies);
  return decodeGuideTrackPcm({ arrayBuffer, dependencies });
}
