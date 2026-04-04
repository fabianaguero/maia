import type { ImportTrackInput, LibraryTrack } from "../types/library";

const STORAGE_KEY = "maia.library.tracks.v1";
let memoryStore: LibraryTrack[] = [];

function readTracks(): LibraryTrack[] {
  if (typeof window === "undefined") {
    return memoryStore;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as LibraryTrack[];
  } catch {
    return [];
  }
}

function writeTracks(tracks: LibraryTrack[]): void {
  if (typeof window === "undefined") {
    memoryStore = tracks;
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
}

function stableHash(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createWaveformBins(seed: number, length = 56): number[] {
  let state = seed || 1;

  return Array.from({ length }, (_, index) => {
    state = Math.imul(state ^ (state >>> 13), 1274126177) >>> 0;
    const raw = ((state >>> 8) & 0xff) / 255;
    const envelope =
      index < length / 2
        ? 0.35 + index / length
        : 0.35 + (length - index) / length;

    return Number(Math.min(1, raw * envelope).toFixed(3));
  });
}

function deriveTitle(sourcePath: string): string {
  const normalized = sourcePath.trim().split(/[\\/]/).pop() ?? "Imported Track";
  return normalized.replace(/\.[^.]+$/, "") || "Imported Track";
}

function createTrack(input: ImportTrackInput): LibraryTrack {
  const title = input.title.trim() || deriveTitle(input.sourcePath);
  const sourcePath = input.sourcePath.trim();
  const seed = stableHash(`${title}:${sourcePath}`);
  const fileExtension = sourcePath.includes(".")
    ? `.${sourcePath.split(".").pop()?.toLowerCase() ?? "audio"}`
    : ".audio";

  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `track-${Date.now()}-${seed}`,
    title,
    sourcePath,
    importedAt: new Date().toISOString(),
    bpm: 96 + (seed % 44),
    bpmConfidence: Number((0.56 + (seed % 28) / 100).toFixed(2)),
    durationSeconds: 150 + (seed % 210),
    waveformBins: createWaveformBins(seed),
    analyzerStatus: "Mock waveform + BPM ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus:
      "Waiting for repository heuristics in a future analyzer pass",
    notes: [
      "Browser fallback is active because Tauri is unavailable.",
      "Waveform rendering stays intentionally lightweight in MVP.",
    ],
    fileExtension,
  };
}

export async function listMockTracks(): Promise<LibraryTrack[]> {
  return readTracks().sort((left, right) =>
    right.importedAt.localeCompare(left.importedAt),
  );
}

export async function importMockTrack(
  input: ImportTrackInput,
): Promise<LibraryTrack> {
  const nextTrack = createTrack(input);
  const nextTracks = [nextTrack, ...readTracks()];
  writeTracks(nextTracks);
  return nextTrack;
}

export async function seedMockTracks(): Promise<LibraryTrack[]> {
  const existing = readTracks();
  if (existing.length > 0) {
    return listMockTracks();
  }

  const seeded = [
    createTrack({
      title: "Night Drive",
      sourcePath: "~/Music/night-drive.wav",
    }),
    createTrack({
      title: "Circuit Azul",
      sourcePath: "~/Music/circuit-azul.mp3",
    }),
    createTrack({
      title: "Jakarta Pulse",
      sourcePath: "~/Music/jakarta-pulse.flac",
    }),
  ];

  writeTracks(seeded);
  return listMockTracks();
}

