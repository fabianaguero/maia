import type { RepositoryAnalysis } from "./types/library";
import type { StreamAdapterKind } from "./types/monitor";

export function resolveSessionRepositorySourceKind(
  adapterKind: StreamAdapterKind,
  source = "",
): RepositoryAnalysis["sourceKind"] {
  if (adapterKind === "file") {
    return "file";
  }

  if (adapterKind === "sonarqube") {
    return source.startsWith("sonarqube://") ? "url" : "directory";
  }

  return "directory";
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
    sourceKind: resolveSessionRepositorySourceKind(input.adapterKind, input.source),
    importedAt: input.nowIso,
    suggestedBpm: null,
    confidence: 0,
    summary:
      input.adapterKind === "sonarqube"
        ? input.source.startsWith("sonarqube://")
          ? "Code quality signal source monitored through SonarQube."
          : "Code quality signal source monitored through Maia local scanner."
        : "",
    analyzerStatus:
      input.adapterKind === "sonarqube"
        ? input.source.startsWith("sonarqube://")
          ? "CodeProject monitor source"
          : "CodeProject local monitor source"
        : "pending",
    buildSystem:
      input.adapterKind === "sonarqube"
        ? input.source.startsWith("sonarqube://")
          ? "sonarqube"
          : "maia-local-code-scanner"
        : "",
    primaryLanguage: input.adapterKind === "sonarqube" ? "code-quality" : "",
    javaFileCount: 0,
    testFileCount: 0,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    notes: [],
    tags:
      input.adapterKind === "sonarqube"
        ? [
            "code-project",
            input.source.startsWith("sonarqube://") ? "sonarqube" : "local-code-scan",
          ]
        : [],
    metrics:
      input.adapterKind === "sonarqube"
        ? {
            sourceKind: "code-project",
            adapterKind: "sonarqube",
            analysisMode: input.source.startsWith("sonarqube://") ? "connected" : "local",
          }
        : {},
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
