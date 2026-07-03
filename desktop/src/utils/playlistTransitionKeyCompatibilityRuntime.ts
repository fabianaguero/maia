import type { PlaylistParsedKeySignature } from "./playlistTransitionKeyParsingRuntime";
import { resolvePlaylistCamelotNumber } from "./playlistTransitionKeyParsingRuntime";

export function resolveParsedPlaylistHarmonicLabel(
  currentKey: PlaylistParsedKeySignature | null,
  nextKey: PlaylistParsedKeySignature | null,
): { label: string; score: number } {
  if (!currentKey || !nextKey) {
    return { label: "Open key", score: 0 };
  }

  if (currentKey.camelot === nextKey.camelot) {
    return { label: `Same key ${nextKey.camelot}`, score: 3 };
  }

  const currentNumber = resolvePlaylistCamelotNumber(currentKey.camelot);
  const nextNumber = resolvePlaylistCamelotNumber(nextKey.camelot);
  if (currentNumber !== null && nextNumber !== null) {
    if (currentNumber === nextNumber && currentKey.mode !== nextKey.mode) {
      return { label: `Relative ${nextKey.camelot}`, score: 2 };
    }

    const wrappedDistance = Math.min(
      Math.abs(currentNumber - nextNumber),
      12 - Math.abs(currentNumber - nextNumber),
    );
    if (wrappedDistance === 1 && currentKey.mode === nextKey.mode) {
      return { label: `Adjacent ${nextKey.camelot}`, score: 2 };
    }
  }

  return { label: `Free mix ${nextKey.camelot}`, score: 1 };
}
