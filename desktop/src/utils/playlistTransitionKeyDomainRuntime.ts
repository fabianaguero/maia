const NOTE_TO_PITCH_CLASS: Record<string, number> = {
  C: 0,
  "B#": 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  "E#": 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

const CAM_MAJOR_BY_PITCH_CLASS: Record<number, number> = {
  11: 1,
  6: 2,
  1: 3,
  8: 4,
  3: 5,
  10: 6,
  5: 7,
  0: 8,
  7: 9,
  2: 10,
  9: 11,
  4: 12,
};

const CAM_MINOR_BY_PITCH_CLASS: Record<number, number> = {
  8: 1,
  3: 2,
  10: 3,
  5: 4,
  0: 5,
  7: 6,
  2: 7,
  9: 8,
  4: 9,
  11: 10,
  6: 11,
  1: 12,
};

export function normalizePlaylistKeyNote(note: string): string {
  return note.charAt(0).toUpperCase() + note.slice(1);
}

export function resolvePlaylistPitchClass(note: string): number | null {
  return NOTE_TO_PITCH_CLASS[note] ?? null;
}

export function resolvePlaylistKeyMode(rawMode: string | null | undefined): "major" | "minor" {
  return (rawMode ?? "major").toLowerCase().startsWith("min") ? "minor" : "major";
}

export function resolvePlaylistCamelotLabel(input: {
  pitchClass: number;
  mode: "major" | "minor";
}): string | null {
  const camelotNumber =
    input.mode === "major"
      ? CAM_MAJOR_BY_PITCH_CLASS[input.pitchClass]
      : CAM_MINOR_BY_PITCH_CLASS[input.pitchClass];

  if (!camelotNumber) {
    return null;
  }

  return `${camelotNumber}${input.mode === "major" ? "B" : "A"}`;
}
