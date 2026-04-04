import type {
  BeatGridPoint,
  BpmCurvePoint,
  ImportTrackInput,
  LibraryTrack,
} from "../types/library";
import {
  fallbackMusicStyleLabel,
  resolveMusicStyle,
} from "../config/musicStyles";

const STORAGE_KEY = "maia.library.tracks.v1";
let memoryStore: LibraryTrack[] = [];

function normalizeBeatGrid(raw: unknown): BeatGridPoint[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    if (
      typeof record.index !== "number" ||
      typeof record.second !== "number"
    ) {
      return [];
    }

    return [{ index: record.index, second: record.second }];
  });
}

function normalizeBpmCurve(raw: unknown): BpmCurvePoint[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    if (
      typeof record.second !== "number" ||
      typeof record.bpm !== "number"
    ) {
      return [];
    }

    return [{ second: record.second, bpm: record.bpm }];
  });
}

function normalizeTrack(track: unknown): LibraryTrack | null {
  if (!track || typeof track !== "object") {
    return null;
  }

  const raw = track as Record<string, unknown>;
  const musicStyleId =
    typeof raw.musicStyleId === "string" ? raw.musicStyleId : "";

  return {
    id: typeof raw.id === "string" ? raw.id : `track-${Date.now()}`,
    title: typeof raw.title === "string" ? raw.title : "Imported Track",
    sourcePath: typeof raw.sourcePath === "string" ? raw.sourcePath : "",
    importedAt:
      typeof raw.importedAt === "string"
        ? raw.importedAt
        : new Date().toISOString(),
    bpm: typeof raw.bpm === "number" ? raw.bpm : null,
    bpmConfidence: typeof raw.bpmConfidence === "number" ? raw.bpmConfidence : 0,
    durationSeconds:
      typeof raw.durationSeconds === "number" ? raw.durationSeconds : null,
    waveformBins: Array.isArray(raw.waveformBins)
      ? raw.waveformBins.filter((value): value is number => typeof value === "number")
      : [],
    beatGrid: normalizeBeatGrid(raw.beatGrid),
    bpmCurve: normalizeBpmCurve(raw.bpmCurve),
    analyzerStatus:
      typeof raw.analyzerStatus === "string"
        ? raw.analyzerStatus
        : "Mock waveform + BPM ready",
    repoSuggestedBpm:
      typeof raw.repoSuggestedBpm === "number" ? raw.repoSuggestedBpm : null,
    repoSuggestedStatus:
      typeof raw.repoSuggestedStatus === "string"
        ? raw.repoSuggestedStatus
        : "Waiting for repository heuristics in a future analyzer pass",
    notes: Array.isArray(raw.notes)
      ? raw.notes.filter((note): note is string => typeof note === "string")
      : [],
    fileExtension:
      typeof raw.fileExtension === "string" ? raw.fileExtension : ".audio",
    analysisMode:
      typeof raw.analysisMode === "string" ? raw.analysisMode : "mock",
    musicStyleId,
    musicStyleLabel:
      typeof raw.musicStyleLabel === "string"
        ? raw.musicStyleLabel
        : fallbackMusicStyleLabel(musicStyleId),
  };
}

function readTracks(): LibraryTrack[] {
  if (typeof window === "undefined") {
    return memoryStore;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((track) => normalizeTrack(track))
      .filter((track): track is LibraryTrack => track !== null);
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

function createBeatGrid(
  bpm: number,
  durationSeconds: number,
): BeatGridPoint[] {
  if (bpm <= 0 || durationSeconds <= 0) {
    return [];
  }

  const beatPeriod = 60 / bpm;
  const beatCount = Math.max(1, Math.floor(durationSeconds / beatPeriod));

  return Array.from({ length: beatCount }, (_, index) => ({
    index,
    second: Number((0.18 + index * beatPeriod).toFixed(3)),
  })).filter((beat) => beat.second <= durationSeconds);
}

function createBpmCurve(
  bpm: number,
  durationSeconds: number,
  seed: number,
): BpmCurvePoint[] {
  if (bpm <= 0 || durationSeconds <= 0) {
    return [];
  }

  const segments = Math.max(2, Math.ceil(durationSeconds / 45));
  const wobble = ((seed % 7) - 3) * 0.08;

  return Array.from({ length: segments + 1 }, (_, index) => {
    const progress = index / segments;
    const second = Number((progress * durationSeconds).toFixed(3));
    const contour = Math.sin(progress * Math.PI) * wobble;
    return {
      second,
      bpm: Number((bpm + contour).toFixed(3)),
    };
  });
}

function deriveTitle(sourcePath: string): string {
  const normalized = sourcePath.trim().split(/[\\/]/).pop() ?? "Imported Track";
  return normalized.replace(/\.[^.]+$/, "") || "Imported Track";
}

function createTrack(input: ImportTrackInput): LibraryTrack {
  const title = input.title.trim() || deriveTitle(input.sourcePath);
  const sourcePath = input.sourcePath.trim();
  const musicStyle = resolveMusicStyle(input.musicStyleId);

  if (!musicStyle) {
    throw new Error("Unknown music style. Reload the app and try again.");
  }

  const seed = stableHash(`${title}:${sourcePath}:${musicStyle.id}`);
  const fileExtension = sourcePath.includes(".")
    ? `.${sourcePath.split(".").pop()?.toLowerCase() ?? "audio"}`
    : ".audio";
  const bpmSpan = Math.max(1, musicStyle.maxBpm - musicStyle.minBpm + 1);
  const bpm = musicStyle.minBpm + (seed % bpmSpan);
  const durationSeconds = 150 + (seed % 210);
  const beatGrid = createBeatGrid(bpm, durationSeconds);
  const bpmCurve = createBpmCurve(bpm, durationSeconds, seed);

  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `track-${Date.now()}-${seed}`,
    title,
    sourcePath,
    importedAt: new Date().toISOString(),
    bpm,
    bpmConfidence: Number((0.56 + (seed % 28) / 100).toFixed(2)),
    durationSeconds,
    waveformBins: createWaveformBins(seed),
    beatGrid,
    bpmCurve,
    analyzerStatus: "Mock waveform + BPM ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus:
      "Waiting for repository heuristics in a future analyzer pass",
    notes: [
      "Browser fallback is active because Tauri is unavailable.",
      `Imported with ${musicStyle.label} prior (${musicStyle.minBpm}-${musicStyle.maxBpm} BPM).`,
      "Beat grid and BPM curve are generated as lightweight local preview artifacts.",
    ],
    fileExtension,
    analysisMode: "mock",
    musicStyleId: musicStyle.id,
    musicStyleLabel: musicStyle.label,
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
      musicStyleId: "melodic-house",
    }),
    createTrack({
      title: "Circuit Azul",
      sourcePath: "~/Music/circuit-azul.mp3",
      musicStyleId: "house",
    }),
    createTrack({
      title: "Jakarta Pulse",
      sourcePath: "~/Music/jakarta-pulse.flac",
      musicStyleId: "trance",
    }),
  ];

  writeTracks(seeded);
  return listMockTracks();
}
