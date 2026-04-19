import type {
  ImportRepositoryInput,
  LiveLogComponentCount,
  LiveLogCue,
  LiveLogMarker,
  LiveLogStreamUpdate,
  RepositoryAnalysis,
} from "../types/library";

const STORAGE_KEY = "maia.library.repositories.v1";
let memoryStore: RepositoryAnalysis[] = [];

function readRepositories(): RepositoryAnalysis[] {
  if (typeof window === "undefined") {
    return memoryStore;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as RepositoryAnalysis[];
  } catch {
    return [];
  }
}

function writeRepositories(repositories: RepositoryAnalysis[]): void {
  if (typeof window === "undefined") {
    memoryStore = repositories;
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(repositories));
}

function stableHash(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function deriveRepositoryTitle(
  sourceKind: ImportRepositoryInput["sourceKind"],
  sourcePath: string,
): string {
  if (sourceKind === "url") {
    const parts = sourcePath.split("/").filter(Boolean);
    const tail = parts[parts.length - 1] ?? "remote-repository";
    return tail.replace(/\.git$/, "");
  }

  const tail = sourcePath.trim().split(/[\\/]/).pop() ?? "local-repository";
  return tail || "local-repository";
}

function createLogCadenceBins(seed: number, bucketCount = 24): number[] {
  let state = seed || 1;

  return Array.from({ length: bucketCount }, () => {
    state = Math.imul(state ^ (state >>> 13), 1274126177) >>> 0;
    const sample = ((state >>> 8) & 0xff) / 255;
    return Number((0.16 + sample * 0.84).toFixed(3));
  });
}

function createLogLevelCounts(seed: number) {
  const info = 180 + (seed % 640);
  const warn = 12 + (seed % 48);
  const error = 4 + (seed % 21);
  const debug = 30 + (seed % 70);
  const trace = seed % 8;

  return {
    trace,
    debug,
    info,
    warn,
    error,
  };
}

function createTopComponents(seed: number) {
  const names = ["api-gateway", "billing", "search-worker", "auth-service", "queue-consumer"];
  return names.slice(0, 3 + (seed % 2)).map((component, index) => ({
    component,
    count: 16 + ((seed + index * 11) % 70),
  }));
}

function createAnomalyMarkers(seed: number) {
  const components = ["api-gateway", "billing", "auth-service", "queue-consumer"];
  const levels = ["warn", "error", "error", "warn"];
  const excerpts = [
    "Timeout while waiting for downstream checkout acknowledgement.",
    "Retry storm crossed threshold for payment callback handler.",
    "Connection refused while publishing reconciliation event.",
    "Latency drift exceeded anomaly budget for the current window.",
  ];

  return Array.from({ length: 2 + (seed % 3) }, (_, index) => ({
    lineNumber: 120 + ((seed + index * 47) % 800),
    level: levels[index % levels.length],
    component: components[index % components.length],
    excerpt: excerpts[index % excerpts.length],
  }));
}

function createRepository(
  input: ImportRepositoryInput,
): RepositoryAnalysis {
  const sourcePath = input.sourcePath.trim();
  const title = input.label?.trim() || deriveRepositoryTitle(input.sourceKind, sourcePath);
  const seed = stableHash(`${input.sourceKind}:${sourcePath}:${title}`);
  const logLevelCounts = createLogLevelCounts(seed);
  const anomalyMarkers = createAnomalyMarkers(seed);
  const topComponents = createTopComponents(seed);
  const lineCount = Object.values(logLevelCounts).reduce((sum, count) => sum + count, 0) + 40;
  const buildSystem = ["maven", "gradle", "plain"][seed % 3];
  const primaryLanguage = seed % 5 === 0 ? "kotlin" : seed % 2 === 0 ? "java" : "unknown";
  const javaFileCount = input.sourceKind === "directory" ? 12 + (seed % 90) : 0;
  const testFileCount = input.sourceKind === "directory" ? 2 + (seed % 20) : 0;
  const suggestedBpm = 90 + (seed % 52);
  const provider = sourcePath.includes("github.com") ? "github" : "external";

  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `repo-${Date.now()}-${seed}`,
    title,
    sourcePath,
    storagePath:
      input.sourceKind === "directory" || input.sourceKind === "file"
        ? `browser-fallback://repositories/${seed.toString(16)}/${title}`
        : null,
    sourceKind: input.sourceKind,
    importedAt: new Date().toISOString(),
    suggestedBpm,
    confidence: Number(
      (
        input.sourceKind === "directory"
          ? 0.66 + (seed % 18) / 100
          : input.sourceKind === "file"
            ? 0.62 + (seed % 14) / 100
            : 0.28 + (seed % 10) / 100
      ).toFixed(2),
    ),
    summary:
      input.sourceKind === "directory"
        ? `Filesystem repository ${title} analyzed with deterministic Java heuristics.`
        : input.sourceKind === "file"
          ? `Local log file ${title} analyzed as a deterministic signal source with anomaly markers and cadence bins.`
          : `Remote repository reference ${title} registered for metadata-only BPM inference.`,
    analyzerStatus:
      input.sourceKind === "directory"
        ? "Filesystem repository analyzed"
        : input.sourceKind === "file"
          ? "Log file analyzed"
          : "Remote repository reference analyzed",
    buildSystem: input.sourceKind === "file" ? "log-stream" : buildSystem,
    primaryLanguage: input.sourceKind === "file" ? "logs" : primaryLanguage,
    javaFileCount,
    testFileCount,
    notes:
      input.sourceKind === "directory"
        ? [
            "Filesystem import uses the browser-mode local analyzer fallback.",
            "The browser fallback preserves the repository shape with a simulated managed snapshot path, but it cannot create a native on-disk copy.",
            "Clone-free GitHub support remains metadata-only in MVP.",
          ]
        : input.sourceKind === "file"
          ? [
              "Log import uses the browser-mode deterministic fallback.",
              "The browser fallback preserves the log-analysis shape with a simulated managed snapshot path, but it cannot create a native on-disk copy.",
              "Live log stream listening is still native-runtime work, not browser fallback behavior.",
            ]
        : [
            "GitHub URL intake is metadata-only in fallback mode.",
            "Import a local checkout later to inspect actual source contents.",
          ],
    tags:
      input.sourceKind === "directory"
        ? ["repo-analysis", "filesystem", buildSystem]
        : input.sourceKind === "file"
          ? ["repo-analysis", "log-file", `dominant:${anomalyMarkers[0]?.level ?? "info"}`]
          : ["repo-analysis", "remote-url", provider],
    waveformBins: createLogCadenceBins(seed, 256),
    beatGrid: [],
    bpmCurve: [],
    metrics: {
      buildSystem: input.sourceKind === "file" ? "log-stream" : buildSystem,
      primaryLanguage: input.sourceKind === "file" ? "logs" : primaryLanguage,
      javaFileCount,
      testFileCount,
      provider,
      importMode:
        input.sourceKind === "directory"
          ? "filesystem"
          : input.sourceKind === "file"
            ? "log-file"
            : "remote-url",
      storageMode:
        input.sourceKind === "directory" || input.sourceKind === "file"
          ? "browser-fallback"
          : "remote-url",
      sourceKind: input.sourceKind,
      lineCount: input.sourceKind === "file" ? lineCount : 0,
      nonEmptyLineCount: input.sourceKind === "file" ? lineCount - 12 : 0,
      timestampedLineCount: input.sourceKind === "file" ? Math.floor(lineCount * 0.84) : 0,
      levelCounts: input.sourceKind === "file" ? logLevelCounts : {},
      dominantLevel: input.sourceKind === "file" ? (anomalyMarkers[0]?.level ?? "info") : null,
      anomalyCount: input.sourceKind === "file" ? anomalyMarkers.length : 0,
      anomalyRatio:
        input.sourceKind === "file"
          ? Number((anomalyMarkers.length / Math.max(1, lineCount)).toFixed(3))
          : 0,
      topComponents: input.sourceKind === "file" ? topComponents : [],
      logCadenceBins: input.sourceKind === "file" ? createLogCadenceBins(seed) : [],
      anomalyMarkers: input.sourceKind === "file" ? anomalyMarkers : [],
      trackedAs: input.sourceKind === "file" ? "log-signal" : undefined,
    },
  };
}

function createLiveWindowLevelCounts(seed: number, windowIndex: number): Record<string, number> {
  return {
    trace: (seed + windowIndex) % 2,
    debug: 1 + ((seed + windowIndex * 5) % 3),
    info: 4 + ((seed + windowIndex * 7) % 6),
    warn: 1 + ((seed + windowIndex * 11) % 3),
    error: (seed + windowIndex * 13) % 2,
  };
}

function createLiveWindowMarkers(seed: number, windowIndex: number): LiveLogMarker[] {
  const anomalyCount = 1 + ((seed + windowIndex * 3) % 2);
  const components = ["auth-service", "queue-consumer", "billing", "api-gateway"];
  const excerpts = [
    "Retry burst crossed live threshold for the current polling window.",
    "Unexpected timeout while streaming downstream acknowledgements.",
    "Error ratio exceeded the anomaly budget for this tail segment.",
    "Latency spike persisted across the active live window.",
  ];

  return Array.from({ length: anomalyCount }, (_, index) => ({
    eventIndex: windowIndex * 12 + index + 1,
    level: index === anomalyCount - 1 ? "error" : "warn",
    component: components[(seed + windowIndex + index) % components.length],
    excerpt: excerpts[(seed + windowIndex + index * 2) % excerpts.length],
  }));
}

function createLiveWindowComponents(seed: number, windowIndex: number): LiveLogComponentCount[] {
  const components = ["auth-service", "queue-consumer", "billing", "api-gateway"];
  return components.slice(0, 3).map((component, index) => ({
    component,
    count: 2 + ((seed + windowIndex * 5 + index * 7) % 5),
  }));
}

function createLiveWindowCues(markers: LiveLogMarker[], seed: number, windowIndex: number): LiveLogCue[] {
  const baseLevels = ["info", "debug", "warn", "info"];
  const baseComponents = ["tail-reader", "queue-consumer", "auth-service", "api-gateway"];
  const baseCues = Array.from({ length: 3 }, (_, index) => {
    const level = baseLevels[(seed + windowIndex + index) % baseLevels.length] ?? "info";
    const waveform: LiveLogCue["waveform"] = level === "warn" ? "triangle" : "sine";
    const noteHz =
      level === "warn" ? 329.63 : level === "debug" ? 220 : 261.63 + ((windowIndex + index) % 3) * 24;

    return {
      id: `mock-live-${windowIndex}-${index}`,
      eventIndex: windowIndex * 12 + index + 1,
      level,
      component: baseComponents[(seed + windowIndex + index) % baseComponents.length] ?? "tail-reader",
      excerpt: `Live tail window ${windowIndex + 1} generated ${level} activity.`,
      noteHz,
      durationMs: level === "warn" ? 180 : 120,
      gain: level === "warn" ? 0.16 : 0.1,
      waveform,
      accent: level,
    } satisfies LiveLogCue;
  });

  return [
    ...baseCues,
    ...markers.map((marker, index) => ({
      id: `mock-live-${windowIndex}-anomaly-${index}`,
      eventIndex: marker.eventIndex,
      level: marker.level,
      component: marker.component,
      excerpt: marker.excerpt,
      noteHz: marker.level === "error" ? 392 : 329.63,
      durationMs: marker.level === "error" ? 260 : 200,
      gain: marker.level === "error" ? 0.22 : 0.18,
      waveform: "sawtooth" as LiveLogCue["waveform"],
      accent: "anomaly",
    })),
  ];
}

function createLiveWindowParsedLines(
  markers: LiveLogMarker[],
  components: LiveLogComponentCount[],
  seed: number,
  windowIndex: number,
): string[] {
  const focusComponent = components[0]?.component ?? "tail-reader";
  const detailComponent = components[1]?.component ?? "scheduler";
  const anomalyExcerpt = markers[0]?.excerpt ?? "No anomaly marker raised in this window.";
  const severity = markers.some((marker) => marker.level === "error") ? "error" : "warn";
  const latencyMs = 40 + ((seed + windowIndex * 17) % 180);
  const queueDepth = 2 + ((seed + windowIndex * 13) % 21);

  return [
    `${new Date(Date.UTC(2026, 3, 12, 18, (windowIndex * 3) % 60, (seed + windowIndex) % 60)).toISOString()} info ${focusComponent} window=${windowIndex + 1} cursor=${windowIndex * 512}`,
    `${new Date(Date.UTC(2026, 3, 12, 18, (windowIndex * 3) % 60, ((seed + windowIndex) % 60) + 1)).toISOString()} debug ${detailComponent} latency_ms=${latencyMs} queue_depth=${queueDepth}`,
    `${new Date(Date.UTC(2026, 3, 12, 18, (windowIndex * 3) % 60, ((seed + windowIndex) % 60) + 2)).toISOString()} ${severity} ${focusComponent} ${anomalyExcerpt}`,
    `${new Date(Date.UTC(2026, 3, 12, 18, (windowIndex * 3) % 60, ((seed + windowIndex) % 60) + 3)).toISOString()} info sonifier cues=${markers.length + 3} accent=${markers.length > 0 ? "anomaly" : "steady"}`,
    `${new Date(Date.UTC(2026, 3, 12, 18, (windowIndex * 3) % 60, ((seed + windowIndex) % 60) + 4)).toISOString()} trace renderer window_summary=\"chunk ${windowIndex + 1} mapped to reactive output\"`,
  ];
}

export async function listMockRepositories(): Promise<RepositoryAnalysis[]> {
  return readRepositories().sort((left, right) =>
    right.importedAt.localeCompare(left.importedAt),
  );
}

export async function importMockRepository(
  input: ImportRepositoryInput,
): Promise<RepositoryAnalysis> {
  const nextRepository = createRepository(input);
  const nextRepositories = [nextRepository, ...readRepositories()];
  writeRepositories(nextRepositories);
  return nextRepository;
}

export async function pollMockLogStream(
  sourcePath: string,
  cursor?: number,
  _maxBytes?: number,
): Promise<LiveLogStreamUpdate> {
  const seed = stableHash(sourcePath);
  const fromOffset = cursor ?? 0;
  const windowSize = 384 + (seed % 192);
  const toOffset = fromOffset + windowSize;
  const windowIndex = Math.floor(fromOffset / Math.max(1, windowSize));
  const levelCounts = createLiveWindowLevelCounts(seed, windowIndex);
  const anomalyMarkers = createLiveWindowMarkers(seed, windowIndex);
  const topComponents = createLiveWindowComponents(seed, windowIndex);
  const sonificationCues = createLiveWindowCues(anomalyMarkers, seed, windowIndex);
  const parsedLines = createLiveWindowParsedLines(
    anomalyMarkers,
    topComponents,
    seed,
    windowIndex,
  );
  const lineCount = Object.values(levelCounts).reduce((sum, count) => sum + count, 0);
  const anomalyCount = anomalyMarkers.length;
  const dominantLevel =
    anomalyCount > 0 ? anomalyMarkers[anomalyMarkers.length - 1]?.level ?? "warn" : "info";

  return {
    sourcePath,
    fromOffset,
    toOffset,
    hasData: true,
    summary: `Live tail window ${windowIndex + 1} mapped into ${sonificationCues.length} audio cues.`,
    suggestedBpm: 112 + ((seed + windowIndex * 9) % 22),
    confidence: Number((0.62 + ((seed + windowIndex * 7) % 18) / 100).toFixed(2)),
    dominantLevel,
    lineCount,
    anomalyCount,
    levelCounts,
    anomalyMarkers,
    topComponents,
    sonificationCues,
    parsedLines,
    warnings: [
      "Browser fallback is simulating live tail windows locally.",
      "Open the Tauri runtime to poll a real growing log file from disk.",
    ],
  };
}
