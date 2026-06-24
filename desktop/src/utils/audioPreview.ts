import { convertFileSrc, isTauri } from "@tauri-apps/api/core";

import { readAudioBytes } from "../api/repositories";

function inferMimeType(path: string): string {
  const lowerPath = path.toLowerCase();
  if (lowerPath.endsWith(".wav")) return "audio/wav";
  if (lowerPath.endsWith(".flac")) return "audio/flac";
  if (lowerPath.endsWith(".ogg")) return "audio/ogg";
  if (lowerPath.endsWith(".m4a")) return "audio/mp4";
  if (lowerPath.endsWith(".aac")) return "audio/aac";
  return "audio/mpeg";
}

function decodeBase64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

export async function resolvePreviewAudioUrl(path: string): Promise<string> {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!isTauri()) {
    return path;
  }

  try {
    const nativeUrl = convertFileSrc(path);
    const response = await fetch(nativeUrl, { method: "HEAD" });
    if (response.ok) {
      return nativeUrl;
    }
  } catch {
    // Fall back to the native byte reader below.
  }

  const base64 = await readAudioBytes(path);
  const blob = decodeBase64ToBlob(base64, inferMimeType(path));
  return URL.createObjectURL(blob);
}

export function revokePreviewAudioUrl(url: string | null): void {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
