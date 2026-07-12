import type { PlaylistMetadata, ProviderError } from "./types";
import { normalizePlaylistId, normalizeIsoTimestamp } from "./normalization";
import { createHash } from "node:crypto";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function extractPlaylistNameFromPath(filePath: string): string {
  const filename = filePath.split("/").pop() || "";
  return filename.replace(/\.[^/.]+$/, ""); // Remove extension
}

export function parseM3UPlaylist(content: string, filePath: string): PlaylistMetadata {
  const lines = content.split("\n");
  let trackCount = 0;

  for (const line of lines) {
    if (line.startsWith("#EXTINF:")) {
      trackCount++;
    }
  }

  const name = extractPlaylistNameFromPath(filePath);
  const hash = createHash("md5").update(filePath).digest("hex");

  return {
    id: normalizePlaylistId("local_directory", hash),
    sourceType: "local_directory",
    sourceId: hash,
    sourceName: "Local Directory",
    name,
    description: null,
    trackCount,
    imageUrl: null,
    isPublic: false,
    externalUrl: null,
    syncedAt: normalizeIsoTimestamp(),
  };
}

export function parseJSONPlaylist(content: string, filePath: string): PlaylistMetadata {
  let parsed: UnknownRecord = {};

  try {
    parsed = asRecord(JSON.parse(content));
  } catch (e) {
    const error: ProviderError = {
      kind: "parsing_error",
      sourceType: "local_directory",
      details: `Invalid JSON: ${e instanceof Error ? e.message : "unknown error"}`,
    };
    throw error;
  }

  const name = asString(parsed.name, extractPlaylistNameFromPath(filePath));
  const trackCount = Array.isArray(parsed.tracks) ? parsed.tracks.length : 0;
  const hash = createHash("md5").update(filePath).digest("hex");

  return {
    id: normalizePlaylistId("local_directory", hash),
    sourceType: "local_directory",
    sourceId: hash,
    sourceName: "Local Directory",
    name,
    description: asString(parsed.description) || null,
    trackCount,
    imageUrl: null,
    isPublic: false,
    externalUrl: null,
    syncedAt: normalizeIsoTimestamp(),
  };
}

export async function listLocalPlaylists(_dirPath: string): Promise<PlaylistMetadata[]> {
  // Stub: actual implementation depends on Tauri file API (Task 11)
  return [];
}
