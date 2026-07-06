import type { GuideTrackDecodeDependencies } from "./monitorGuideTrackDecodeTypes";

function decodeBase64Bytes(base64: string, decodeBase64: (value: string) => string): Uint8Array {
  const binary = decodeBase64(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function loadGuideTrackArrayBuffer(
  path: string,
  dependencies: GuideTrackDecodeDependencies,
): Promise<ArrayBuffer> {
  try {
    if (!dependencies.isTauri()) {
      throw new Error("convertFileSrc not available in browser");
    }
    const url = dependencies.convertFileSrc(path);
    const response = await dependencies.fetchAudio(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    dependencies.logger.info(
      "audio file loaded %d bytes, decoding via fetch",
      arrayBuffer.byteLength,
    );
    return arrayBuffer;
  } catch (error) {
    if (!dependencies.isTauri()) {
      throw new Error("Audio file not available in browser environment");
    }
    dependencies.logger.info(
      "convertFileSrc failed, falling back to read_audio_bytes: %s",
      error instanceof Error ? error.message : String(error),
    );
    const base64 = await dependencies.invokeReadAudioBytes(path);
    const bytes = decodeBase64Bytes(base64, dependencies.decodeBase64);
    dependencies.logger.info("audio file loaded %d bytes via IPC", bytes.byteLength);
    return new Uint8Array(bytes).buffer;
  }
}
