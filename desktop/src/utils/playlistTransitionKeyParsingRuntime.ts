import {
  normalizePlaylistKeyNote,
  resolvePlaylistCamelotLabel,
  resolvePlaylistKeyMode,
  resolvePlaylistPitchClass,
} from "./playlistTransitionKeyDomainRuntime";

export interface PlaylistParsedKeySignature {
  pitchClass: number;
  mode: "major" | "minor";
  camelot: string;
}

export function parsePlaylistKeySignature(
  keySignature: string | null | undefined,
): PlaylistParsedKeySignature | null {
  if (!keySignature) {
    return null;
  }

  const match = keySignature.trim().match(/^([A-G](?:#|b)?)(?:\s+)?(major|minor|maj|min)?$/i);
  if (!match) {
    return null;
  }

  const note = match[1] ?? "";
  const normalizedNote = normalizePlaylistKeyNote(note);
  const pitchClass = resolvePlaylistPitchClass(normalizedNote);
  if (pitchClass === null) {
    return null;
  }

  const mode = resolvePlaylistKeyMode(match[2]);
  const camelot = resolvePlaylistCamelotLabel({
    pitchClass,
    mode,
  });
  if (!camelot) {
    return null;
  }

  return {
    pitchClass,
    mode,
    camelot,
  };
}

export function resolvePlaylistCamelotNumber(camelot: string): number | null {
  const value = Number.parseInt(camelot, 10);
  return Number.isFinite(value) ? value : null;
}
