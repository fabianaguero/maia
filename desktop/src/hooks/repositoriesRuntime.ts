import type { AnalyzerResponse, MusicalAsset } from "../contracts";
import type { ImportRepositoryInput, RepositoryAnalysis } from "../types/library";

export function toRepositoryErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return fallback;
}

export function sortRepositoriesByImportedAt(
  repositories: RepositoryAnalysis[],
): RepositoryAnalysis[] {
  return [...repositories].sort((left, right) => right.importedAt.localeCompare(left.importedAt));
}

export function resolveSelectedRepositoryId(
  current: string | null,
  repositories: RepositoryAnalysis[],
): string | null {
  if (current && repositories.some((repository) => repository.id === current)) {
    return current;
  }

  return repositories[0]?.id ?? null;
}

export function appendImportedRepository(
  repositories: RepositoryAnalysis[],
  nextRepository: RepositoryAnalysis,
): RepositoryAnalysis[] {
  return sortRepositoriesByImportedAt([
    nextRepository,
    ...repositories.filter((repository) => repository.id !== nextRepository.id),
  ]);
}

export function applyAnalyzedRepositoryMetadata(
  repositories: RepositoryAnalysis[],
  repositoryId: string,
  analyzed: MusicalAsset,
): RepositoryAnalysis[] {
  return sortRepositoriesByImportedAt(
    repositories.map((repository) =>
      repository.id === repositoryId
        ? {
            ...repository,
            suggestedBpm: analyzed.suggestedBpm ?? repository.suggestedBpm,
            confidence: analyzed.confidence ?? repository.confidence,
            waveformBins: analyzed.artifacts?.waveformBins ?? repository.waveformBins,
            beatGrid: analyzed.artifacts?.beatGrid ?? repository.beatGrid,
            bpmCurve: analyzed.artifacts?.bpmCurve ?? repository.bpmCurve,
          }
        : repository,
    ),
  );
}

export function shouldAnalyzeImportedRepository(repository: RepositoryAnalysis): boolean {
  return repository.analyzerStatus === "pending";
}

export function resolveReanalyzeRepositoryInput(
  repository: RepositoryAnalysis,
): ImportRepositoryInput {
  return {
    sourceKind: repository.sourceKind,
    sourcePath: repository.sourcePath,
    label: repository.title,
  };
}

export function replaceReanalyzedRepository(
  repositories: RepositoryAnalysis[],
  repositoryId: string,
  nextRepository: RepositoryAnalysis,
): RepositoryAnalysis[] {
  return sortRepositoriesByImportedAt(
    repositories.map((repository) => (repository.id === repositoryId ? nextRepository : repository)),
  );
}

export function removeDeletedRepository(
  repositories: RepositoryAnalysis[],
  repositoryId: string,
): RepositoryAnalysis[] {
  return repositories.filter((repository) => repository.id !== repositoryId);
}

export function clearDeletedSelectedRepositoryId(
  selectedRepositoryId: string | null,
  repositoryId: string,
): string | null {
  return selectedRepositoryId === repositoryId ? null : selectedRepositoryId;
}

export function resolveRepositoryAnalysisPayload(
  response: AnalyzerResponse,
): MusicalAsset | null {
  return response.status === "ok" && "musicalAsset" in response.payload
    ? response.payload.musicalAsset
    : null;
}
