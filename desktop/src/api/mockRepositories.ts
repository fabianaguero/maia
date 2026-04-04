import type {
  ImportRepositoryInput,
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

function createRepository(
  input: ImportRepositoryInput,
): RepositoryAnalysis {
  const sourcePath = input.sourcePath.trim();
  const title = input.label?.trim() || deriveRepositoryTitle(input.sourceKind, sourcePath);
  const seed = stableHash(`${input.sourceKind}:${sourcePath}:${title}`);
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
    sourceKind: input.sourceKind,
    importedAt: new Date().toISOString(),
    suggestedBpm,
    confidence: Number(
      (input.sourceKind === "directory" ? 0.66 + (seed % 18) / 100 : 0.28 + (seed % 10) / 100).toFixed(2),
    ),
    summary:
      input.sourceKind === "directory"
        ? `Filesystem repository ${title} analyzed with deterministic Java heuristics.`
        : `Remote repository reference ${title} registered for metadata-only BPM inference.`,
    analyzerStatus:
      input.sourceKind === "directory"
        ? "Filesystem repository analyzed"
        : "Remote repository reference analyzed",
    buildSystem,
    primaryLanguage,
    javaFileCount,
    testFileCount,
    notes:
      input.sourceKind === "directory"
        ? [
            "Filesystem import uses the browser-mode local analyzer fallback.",
            "Clone-free GitHub support remains metadata-only in MVP.",
          ]
        : [
            "GitHub URL intake is metadata-only in fallback mode.",
            "Import a local checkout later to inspect actual source contents.",
          ],
    tags:
      input.sourceKind === "directory"
        ? ["repo-analysis", "filesystem", buildSystem]
        : ["repo-analysis", "remote-url", provider],
    metrics: {
      buildSystem,
      primaryLanguage,
      javaFileCount,
      testFileCount,
      provider,
      importMode: input.sourceKind === "directory" ? "filesystem" : "remote-url",
    },
  };
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
