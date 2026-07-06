import type { RepositoryAnalysis } from "./types/library";
import type { StreamAdapterKind } from "./types/monitor";

export function resolveSessionRepositorySourceKind(
  adapterKind: StreamAdapterKind,
): RepositoryAnalysis["sourceKind"] {
  return adapterKind === "file" ? "file" : "directory";
}

export function buildFallbackSessionRepository(input: {
  adapterKind: StreamAdapterKind;
  label: string;
  nowIso: string;
  sessionId: string;
  source: string;
}): RepositoryAnalysis {
  return {
    id: input.sessionId,
    title: input.label,
    sourcePath: input.source,
    storagePath: null,
    sourceKind: resolveSessionRepositorySourceKind(input.adapterKind),
    importedAt: input.nowIso,
    suggestedBpm: null,
    confidence: 0,
    summary: "",
    analyzerStatus: "pending",
    buildSystem: "",
    primaryLanguage: "",
    javaFileCount: 0,
    testFileCount: 0,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    notes: [],
    tags: [],
    metrics: {},
  };
}

export function resolveSessionRepository(input: {
  adapterKind: StreamAdapterKind;
  label: string;
  nowIso: string;
  repositories: RepositoryAnalysis[];
  sessionId: string;
  source: string;
}): RepositoryAnalysis {
  return (
    input.repositories.find((repository) => repository.sourcePath === input.source) ??
    buildFallbackSessionRepository(input)
  );
}
