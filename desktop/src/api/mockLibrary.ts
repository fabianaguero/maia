import type {
  BaseTrackPlaylist,
  BeatGridPoint,
  BpmCurvePoint,
  ImportTrackInput,
  LibraryTrack,
  SaveBaseTrackPlaylistInput,
  TrackCuePoint,
  TrackSavedLoop,
  TrackStructuralPattern,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../types/library";
import {
  fallbackMusicStyleLabel,
  resolveMusicStyle,
} from "../config/musicStyles";

const STORAGE_KEY = "maia.library.tracks.v1";
const PLAYLIST_STORAGE_KEY = "maia.library.playlists.v1";
let memoryStore: LibraryTrack[] = [];
let memoryPlaylistStore: BaseTrackPlaylist[] = [];

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

function normalizeStructuralPatterns(raw: unknown): TrackStructuralPattern[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    if (
      typeof record.type !== "string" ||
      typeof record.start !== "number" ||
      typeof record.end !== "number" ||
      typeof record.confidence !== "number" ||
      typeof record.label !== "string"
    ) {
      return [];
    }

    return [{
      type: record.type,
      start: record.start,
      end: record.end,
      confidence: record.confidence,
      label: record.label,
    }];
  });
}

function normalizeCuePoints(
  raw: unknown,
  kind: TrackCuePoint["kind"],
): TrackCuePoint[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((entry, index) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    if (typeof record.second !== "number") {
      return [];
    }

    return [{
      id:
        typeof record.id === "string"
          ? record.id
          : `${kind}-cue-${index + 1}`,
      slot:
        typeof record.slot === "number" && Number.isFinite(record.slot)
          ? record.slot
          : null,
      second: record.second,
      label:
        typeof record.label === "string" && record.label.trim()
          ? record.label
          : `${kind} cue ${index + 1}`,
      kind:
        record.kind === "main" || record.kind === "hot" || record.kind === "memory"
          ? record.kind
          : kind,
      color: typeof record.color === "string" ? record.color : null,
    }];
  });
}

function normalizeSavedLoops(raw: unknown): TrackSavedLoop[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((entry, index) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    if (
      typeof record.startSecond !== "number" ||
      typeof record.endSecond !== "number"
    ) {
      return [];
    }

    return [{
      id:
        typeof record.id === "string"
          ? record.id
          : `saved-loop-${index + 1}`,
      slot:
        typeof record.slot === "number" && Number.isFinite(record.slot)
          ? record.slot
          : null,
      startSecond: record.startSecond,
      endSecond: record.endSecond,
      label:
        typeof record.label === "string" && record.label.trim()
          ? record.label
          : `Loop ${index + 1}`,
      color: typeof record.color === "string" ? record.color : null,
      locked: record.locked === true,
    }];
  });
}

function derivePlaybackSource(
  sourcePath: string,
  storagePath: string | null,
): LibraryTrack["file"]["playbackSource"] {
  if (storagePath && !storagePath.startsWith("browser-fallback://")) {
    return "managed_snapshot";
  }

  if (sourcePath && !sourcePath.startsWith("browser-fallback://")) {
    return "source_file";
  }

  return "unavailable";
}

function deriveDefaultHotCues(
  structuralPatterns: TrackStructuralPattern[],
): TrackCuePoint[] {
  const colors = ["#f59e0b", "#22d3ee", "#ef4444", "#8b5cf6"];

  return structuralPatterns.slice(0, 4).map((pattern, index) => ({
    id: `hot-cue-${index + 1}`,
    slot: index + 1,
    second: pattern.start,
    label: pattern.label,
    kind: "hot",
    color: colors[index] ?? null,
  }));
}

function normalizeTrack(track: unknown): LibraryTrack | null {
  if (!track || typeof track !== "object") {
    return null;
  }

  const raw = track as Record<string, unknown>;
  const id = typeof raw.id === "string" ? raw.id : `track-${Date.now()}`;
  const title = typeof raw.title === "string" ? raw.title : "Imported Track";
  const sourcePath = typeof raw.sourcePath === "string" ? raw.sourcePath : "";
  const storagePath =
    typeof raw.storagePath === "string" ? raw.storagePath : null;
  const importedAt =
    typeof raw.importedAt === "string"
      ? raw.importedAt
      : new Date().toISOString();
  const bpm = typeof raw.bpm === "number" ? raw.bpm : null;
  const bpmConfidence =
    typeof raw.bpmConfidence === "number" ? raw.bpmConfidence : 0;
  const durationSeconds =
    typeof raw.durationSeconds === "number" ? raw.durationSeconds : null;
  const waveformBins = Array.isArray(raw.waveformBins)
    ? raw.waveformBins.filter((value): value is number => typeof value === "number")
    : [];
  const beatGrid = normalizeBeatGrid(raw.beatGrid);
  const bpmCurve = normalizeBpmCurve(raw.bpmCurve);
  const analyzerStatus =
    typeof raw.analyzerStatus === "string"
      ? raw.analyzerStatus
      : "Mock waveform + BPM ready";
  const repoSuggestedBpm =
    typeof raw.repoSuggestedBpm === "number" ? raw.repoSuggestedBpm : null;
  const repoSuggestedStatus =
    typeof raw.repoSuggestedStatus === "string"
      ? raw.repoSuggestedStatus
      : "Waiting for repository heuristics in a future analyzer pass";
  const notes = Array.isArray(raw.notes)
    ? raw.notes.filter((note): note is string => typeof note === "string")
    : [];
  const fileExtension =
    typeof raw.fileExtension === "string" ? raw.fileExtension : ".audio";
  const analysisMode =
    typeof raw.analysisMode === "string" ? raw.analysisMode : "mock";
  const musicStyleId =
    typeof raw.musicStyleId === "string" ? raw.musicStyleId : "";
  const musicStyleLabel =
    typeof raw.musicStyleLabel === "string"
      ? raw.musicStyleLabel
      : fallbackMusicStyleLabel(musicStyleId);
  const keySignature =
    typeof raw.keySignature === "string" ? raw.keySignature : null;
  const energyLevel =
    typeof raw.energyLevel === "number" ? raw.energyLevel : null;
  const danceability =
    typeof raw.danceability === "number" ? raw.danceability : null;
  const structuralPatterns = normalizeStructuralPatterns(raw.structuralPatterns);
  const rawFile =
    raw.file && typeof raw.file === "object"
      ? (raw.file as Record<string, unknown>)
      : null;
  const rawTags =
    raw.tags && typeof raw.tags === "object"
      ? (raw.tags as Record<string, unknown>)
      : null;
  const rawAnalysis =
    raw.analysis && typeof raw.analysis === "object"
      ? (raw.analysis as Record<string, unknown>)
      : null;
  const rawPerformance =
    raw.performance && typeof raw.performance === "object"
      ? (raw.performance as Record<string, unknown>)
      : null;
  const hotCues = normalizeCuePoints(rawPerformance?.hotCues, "hot");
  const memoryCues = normalizeCuePoints(rawPerformance?.memoryCues, "memory");
  const mainCueSecond =
    typeof rawPerformance?.mainCueSecond === "number"
      ? rawPerformance.mainCueSecond
      : beatGrid[0]?.second ?? null;

  return {
    id,
    file: {
      sourcePath,
      storagePath,
      sourceKind: "file",
      fileExtension,
      sizeBytes:
        typeof rawFile?.sizeBytes === "number" ? rawFile.sizeBytes : null,
      modifiedAt:
        typeof rawFile?.modifiedAt === "string" ? rawFile.modifiedAt : null,
      checksum:
        typeof rawFile?.checksum === "string" ? rawFile.checksum : null,
      availabilityState:
        rawFile?.availabilityState === "missing" ? "missing" : "available",
      playbackSource:
        rawFile?.playbackSource === "managed_snapshot" ||
        rawFile?.playbackSource === "source_file" ||
        rawFile?.playbackSource === "unavailable"
          ? rawFile.playbackSource
          : derivePlaybackSource(sourcePath, storagePath),
    },
    tags: {
      title:
        typeof rawTags?.title === "string" && rawTags.title.trim()
          ? rawTags.title
          : title,
      artist:
        typeof rawTags?.artist === "string" ? rawTags.artist : null,
      album:
        typeof rawTags?.album === "string" ? rawTags.album : null,
      genre:
        typeof rawTags?.genre === "string" ? rawTags.genre : null,
      year:
        typeof rawTags?.year === "number" ? rawTags.year : null,
      comment:
        typeof rawTags?.comment === "string" ? rawTags.comment : null,
      artworkPath:
        typeof rawTags?.artworkPath === "string" ? rawTags.artworkPath : null,
      musicStyleId,
      musicStyleLabel,
    },
    analysis: {
      importedAt,
      bpm,
      bpmConfidence,
      durationSeconds,
      waveformBins,
      beatGrid,
      bpmCurve,
      analyzerStatus,
      analysisMode,
      analyzerVersion:
        typeof rawAnalysis?.analyzerVersion === "string"
          ? rawAnalysis.analyzerVersion
          : null,
      analyzedAt:
        typeof rawAnalysis?.analyzedAt === "string"
          ? rawAnalysis.analyzedAt
          : importedAt,
      repoSuggestedBpm,
      repoSuggestedStatus,
      notes,
      keySignature,
      energyLevel,
      danceability,
      structuralPatterns,
    },
    performance: {
      color:
        typeof rawPerformance?.color === "string" ? rawPerformance.color : null,
      rating:
        typeof rawPerformance?.rating === "number" ? rawPerformance.rating : 0,
      playCount:
        typeof rawPerformance?.playCount === "number"
          ? rawPerformance.playCount
          : 0,
      lastPlayedAt:
        typeof rawPerformance?.lastPlayedAt === "string"
          ? rawPerformance.lastPlayedAt
          : null,
      bpmLock: rawPerformance?.bpmLock === true,
      gridLock: rawPerformance?.gridLock === true,
      mainCueSecond,
      hotCues: hotCues.length > 0 ? hotCues : deriveDefaultHotCues(structuralPatterns),
      memoryCues,
      savedLoops: normalizeSavedLoops(rawPerformance?.savedLoops),
    },
    title,
    sourcePath,
    storagePath,
    importedAt,
    bpm,
    bpmConfidence,
    durationSeconds,
    waveformBins,
    beatGrid,
    bpmCurve,
    analyzerStatus,
    repoSuggestedBpm,
    repoSuggestedStatus,
    notes,
    fileExtension,
    analysisMode,
    musicStyleId,
    musicStyleLabel,
    keySignature,
    energyLevel,
    danceability,
    structuralPatterns,
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

function normalizePlaylist(raw: unknown): BaseTrackPlaylist | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id =
    typeof record.id === "string" && record.id.trim()
      ? record.id
      : `playlist-${Date.now()}`;
  const name =
    typeof record.name === "string" && record.name.trim()
      ? record.name
      : "Base playlist";
  const trackIds = Array.isArray(record.trackIds)
    ? record.trackIds.filter(
        (trackId): trackId is string =>
          typeof trackId === "string" && trackId.trim().length > 0,
      )
    : [];
  const createdAt =
    typeof record.createdAt === "string" && record.createdAt
      ? record.createdAt
      : new Date().toISOString();
  const updatedAt =
    typeof record.updatedAt === "string" && record.updatedAt
      ? record.updatedAt
      : createdAt;

  return {
    id,
    name,
    trackIds,
    createdAt,
    updatedAt,
  };
}

function readPlaylists(): BaseTrackPlaylist[] {
  if (typeof window === "undefined") {
    return memoryPlaylistStore;
  }

  const raw = window.localStorage.getItem(PLAYLIST_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const tracks = readTracks();

    return parsed
      .map((playlist) => normalizePlaylist(playlist))
      .filter((playlist): playlist is BaseTrackPlaylist => playlist !== null)
      .map((playlist) => ({
        ...playlist,
        trackIds: playlist.trackIds.filter((trackId) =>
          tracks.some((track) => track.id === trackId),
        ),
      }));
  } catch {
    return [];
  }
}

function writePlaylists(playlists: BaseTrackPlaylist[]): void {
  if (typeof window === "undefined") {
    memoryPlaylistStore = playlists;
    return;
  }

  window.localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(playlists));
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
  const storagePath = `browser-fallback://tracks/${seed.toString(16)}/${title}${fileExtension}`;
  const bpmSpan = Math.max(1, musicStyle.maxBpm - musicStyle.minBpm + 1);
  const bpm = musicStyle.minBpm + (seed % bpmSpan);
  const durationSeconds = 150 + (seed % 210);
  const beatGrid = createBeatGrid(bpm, durationSeconds);
  const bpmCurve = createBpmCurve(bpm, durationSeconds, seed);
  const keyPool = ["C minor", "D minor", "E minor", "F major", "G minor", "A minor"];
  const keySignature = keyPool[seed % keyPool.length] ?? null;
  const energyLevel = Number((0.42 + ((seed % 45) / 100)).toFixed(2));
  const danceability = Number((0.5 + (((seed >> 3) % 38) / 100)).toFixed(2));
  const structuralPatterns: TrackStructuralPattern[] = [
    {
      type: "intro",
      start: 0,
      end: 24,
      confidence: 0.72,
      label: "Intro",
    },
    {
      type: "drop",
      start: Math.max(24, Math.round(durationSeconds * 0.34)),
      end: Math.max(32, Math.round(durationSeconds * 0.46)),
      confidence: 0.81,
      label: "Drop",
    },
  ];
  const importedAt = new Date().toISOString();
  const waveformBins = createWaveformBins(seed);
  const hotCues = deriveDefaultHotCues(structuralPatterns);
  const mainCueSecond = beatGrid[0]?.second ?? null;
  const notes = [
    "Browser fallback is active because Tauri is unavailable.",
    `Imported with ${musicStyle.label} prior (${musicStyle.minBpm}-${musicStyle.maxBpm} BPM).`,
    "The browser fallback preserves the track shape with a simulated managed storage path, but it cannot create a native on-disk snapshot.",
    "Beat grid and BPM curve are generated as lightweight local preview artifacts.",
  ];

  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `track-${Date.now()}-${seed}`,
    file: {
      sourcePath,
      storagePath,
      sourceKind: "file",
      fileExtension,
      sizeBytes: null,
      modifiedAt: importedAt,
      checksum: null,
      availabilityState: "available",
      playbackSource: "unavailable",
    },
    tags: {
      title,
      artist: null,
      album: null,
      genre: null,
      year: null,
      comment: null,
      artworkPath: null,
      musicStyleId: musicStyle.id,
      musicStyleLabel: musicStyle.label,
    },
    analysis: {
      importedAt,
      bpm,
      bpmConfidence: Number((0.56 + (seed % 28) / 100).toFixed(2)),
      durationSeconds,
      waveformBins,
      beatGrid,
      bpmCurve,
      analyzerStatus: "Mock waveform + BPM ready",
      analysisMode: "mock",
      analyzerVersion: "browser-fallback",
      analyzedAt: importedAt,
      repoSuggestedBpm: null,
      repoSuggestedStatus:
        "Waiting for repository heuristics in a future analyzer pass",
      notes,
      keySignature,
      energyLevel,
      danceability,
      structuralPatterns,
    },
    performance: {
      color: null,
      rating: 0,
      playCount: 0,
      lastPlayedAt: null,
      bpmLock: false,
      gridLock: false,
      mainCueSecond,
      hotCues,
      memoryCues: [],
      savedLoops: [],
    },
    title,
    sourcePath,
    storagePath,
    importedAt,
    bpm,
    bpmConfidence: Number((0.56 + (seed % 28) / 100).toFixed(2)),
    durationSeconds,
    waveformBins,
    beatGrid,
    bpmCurve,
    analyzerStatus: "Mock waveform + BPM ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus:
      "Waiting for repository heuristics in a future analyzer pass",
    notes,
    fileExtension,
    analysisMode: "mock",
    musicStyleId: musicStyle.id,
    musicStyleLabel: musicStyle.label,
    keySignature,
    energyLevel,
    danceability,
    structuralPatterns,
  };
}

export async function listMockTracks(): Promise<LibraryTrack[]> {
  return readTracks().sort((left, right) =>
    right.analysis.importedAt.localeCompare(left.analysis.importedAt),
  );
}

export async function listMockPlaylists(): Promise<BaseTrackPlaylist[]> {
  return readPlaylists().sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
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

export async function saveMockPlaylist(
  input: SaveBaseTrackPlaylistInput,
): Promise<BaseTrackPlaylist> {
  const tracks = readTracks();
  const trackIds = [...new Set(input.trackIds)]
    .filter((trackId) => tracks.some((track) => track.id === trackId));

  if (trackIds.length === 0) {
    throw new Error("Select at least one track before saving a playlist.");
  }

  const existing = readPlaylists();
  const current = input.id
    ? existing.find((playlist) => playlist.id === input.id) ?? null
    : null;
  const now = new Date().toISOString();
  const nextPlaylist: BaseTrackPlaylist = {
    id:
      current?.id ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `playlist-${Date.now()}`),
    name: input.name.trim() || "Base playlist",
    trackIds,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };

  writePlaylists([
    nextPlaylist,
    ...existing.filter((playlist) => playlist.id !== nextPlaylist.id),
  ]);

  return nextPlaylist;
}

export async function deleteMockPlaylist(playlistId: string): Promise<void> {
  writePlaylists(readPlaylists().filter((playlist) => playlist.id !== playlistId));
}

export async function updateMockTrackPerformance(
  trackId: string,
  input: UpdateTrackPerformanceInput,
): Promise<LibraryTrack> {
  const tracks = readTracks();
  const track = tracks.find((entry) => entry.id === trackId);

  if (!track) {
    throw new Error(`Track not found: ${trackId}`);
  }

  const nextPerformance = {
    ...track.performance,
    rating:
      typeof input.rating === "number"
        ? Math.max(0, Math.min(5, Math.round(input.rating)))
        : track.performance.rating,
    color:
      input.color !== undefined
        ? input.color?.trim() || null
        : track.performance.color,
    bpmLock:
      typeof input.bpmLock === "boolean"
        ? input.bpmLock
        : track.performance.bpmLock,
    gridLock:
      typeof input.gridLock === "boolean"
        ? input.gridLock
        : track.performance.gridLock,
    playCount:
      input.markPlayed === true
        ? track.performance.playCount + 1
        : track.performance.playCount,
    lastPlayedAt:
      input.markPlayed === true
        ? new Date().toISOString()
        : track.performance.lastPlayedAt,
    mainCueSecond:
      input.mainCueSecond !== undefined
        ? input.mainCueSecond
        : track.performance.mainCueSecond,
    hotCues:
      input.hotCues !== undefined
        ? [...input.hotCues].sort((left, right) => left.second - right.second)
        : track.performance.hotCues,
    memoryCues:
      input.memoryCues !== undefined
        ? [...input.memoryCues].sort((left, right) => left.second - right.second)
        : track.performance.memoryCues,
    savedLoops:
      input.savedLoops !== undefined
        ? [...input.savedLoops].sort(
            (left, right) => left.startSecond - right.startSecond,
          )
        : track.performance.savedLoops,
  };

  const nextTrack: LibraryTrack = {
    ...track,
    performance: nextPerformance,
  };

  writeTracks(
    tracks.map((entry) => (entry.id === trackId ? nextTrack : entry)),
  );

  return nextTrack;
}

export async function updateMockTrackAnalysis(
  trackId: string,
  input: UpdateTrackAnalysisInput,
): Promise<LibraryTrack> {
  const tracks = readTracks();
  const track = tracks.find((entry) => entry.id === trackId);

  if (!track) {
    throw new Error(`Track not found: ${trackId}`);
  }

  const nextBpm =
    input.bpm !== undefined
      ? typeof input.bpm === "number" && Number.isFinite(input.bpm)
        ? input.bpm
        : null
      : track.analysis.bpm;
  const nextBeatGrid =
    input.beatGrid !== undefined
      ? normalizeBeatGrid(input.beatGrid)
      : track.analysis.beatGrid;
  const nextBpmCurve =
    input.bpmCurve !== undefined
      ? normalizeBpmCurve(input.bpmCurve)
      : track.analysis.bpmCurve;
  const analyzedAt = new Date().toISOString();

  const nextTrack: LibraryTrack = {
    ...track,
    analysis: {
      ...track.analysis,
      bpm: nextBpm,
      beatGrid: nextBeatGrid,
      bpmCurve: nextBpmCurve,
      analyzedAt,
    },
    bpm: nextBpm,
    beatGrid: nextBeatGrid,
    bpmCurve: nextBpmCurve,
  };

  writeTracks(
    tracks.map((entry) => (entry.id === trackId ? nextTrack : entry)),
  );

  return nextTrack;
}
