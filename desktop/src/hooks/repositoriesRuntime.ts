import type { AnalyzerResponse, MusicalAsset } from "../contracts";
import type { ImportRepositoryInput, RepositoryAnalysis } from "../types/library";
import {
  appendUniqueEntity,
  clearDeletedSelectedEntityId,
  removeEntityById,
  replaceEntityById,
  resolveSelectedEntityId,
  sortEntitiesByDescendingTimestamp,
} from "./entityCollectionRuntime";

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
  return sortEntitiesByDescendingTimestamp(repositories, (repository) => repository.importedAt);
}

export function resolveSelectedRepositoryId(
  current: string | null,
  repositories: RepositoryAnalysis[],
): string | null {
  return resolveSelectedEntityId(current, repositories);
}

export function appendImportedRepository(
  repositories: RepositoryAnalysis[],
  nextRepository: RepositoryAnalysis,
): RepositoryAnalysis[] {
  return sortRepositoriesByImportedAt(appendUniqueEntity(repositories, nextRepository));
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
    replaceEntityById(repositories, repositoryId, nextRepository),
  );
}

export function removeDeletedRepository(
  repositories: RepositoryAnalysis[],
  repositoryId: string,
): RepositoryAnalysis[] {
  return removeEntityById(repositories, repositoryId);
}

export function clearDeletedSelectedRepositoryId(
  selectedRepositoryId: string | null,
  repositoryId: string,
): string | null {
  return clearDeletedSelectedEntityId(selectedRepositoryId, repositoryId);
}

export function resolveRepositoryAnalysisPayload(response: AnalyzerResponse): MusicalAsset | null {
  return response.status === "ok" && "musicalAsset" in response.payload
    ? response.payload.musicalAsset
    : null;
}
