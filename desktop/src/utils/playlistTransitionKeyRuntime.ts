import type { LibraryTrack } from "../types/library";
import { resolveParsedPlaylistHarmonicLabel } from "./playlistTransitionKeyCompatibilityRuntime";
import { parsePlaylistKeySignature } from "./playlistTransitionKeyParsingRuntime";

export function resolvePlaylistHarmonicLabel(
  currentTrack: LibraryTrack | null,
  nextTrack: LibraryTrack,
): { label: string; score: number } {
  const currentKey = parsePlaylistKeySignature(currentTrack?.analysis.keySignature ?? null);
  const nextKey = parsePlaylistKeySignature(nextTrack.analysis.keySignature);
  return resolveParsedPlaylistHarmonicLabel(currentKey, nextKey);
}
