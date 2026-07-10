import { convertFileSrc, isTauri } from "@tauri-apps/api/core";

import { readAudioBytes } from "../api/repositories";

function inferAudioMimeType(path: string): string {
  const lowerPath = path.toLowerCase();

  if (lowerPath.endsWith(".wav")) return "audio/wav";
  if (lowerPath.endsWith(".flac")) return "audio/flac";
  if (lowerPath.endsWith(".ogg")) return "audio/ogg";
  if (lowerPath.endsWith(".m4a")) return "audio/mp4";
  if (lowerPath.endsWith(".aac")) return "audio/aac";

  return "audio/mpeg";
}

function decodeBase64ToBlobUrl(base64: string, mimeType: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

export async function resolvePreviewAudioUrl(path: string): Promise<string> {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!isTauri()) {
    return path;
  }

  const nativeUrl = convertFileSrc(path);

  try {
    const response = await fetch(nativeUrl, { method: "HEAD" });
    if (response.ok) {
      return nativeUrl;
    }
  } catch {
    // Tauri asset protocol can reject app-data paths depending on runtime scope.
  }

  const base64 = await readAudioBytes(path);
  return decodeBase64ToBlobUrl(base64, inferAudioMimeType(path));
}

export function revokePreviewAudioUrl(url: string | null): void {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
