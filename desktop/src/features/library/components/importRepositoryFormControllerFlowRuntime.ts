import type { ImportRepositoryInput, RepositorySourceKind } from "../../../types/library";
import {
  buildImportRepositorySubmission,
  resetImportRepositoryFormState,
  type ImportRepositoryFormStateSetters,
} from "./importRepositoryFormRuntime";

type ImportRepositorySubmission = ReturnType<typeof buildImportRepositorySubmission>;

export async function completeImportRepositoryDraftSubmission(input: {
  submission: ImportRepositorySubmission;
  sourceRequiredError: string;
  setters: ImportRepositoryFormStateSetters & {
    setError: (value: string | null) => void;
  };
  onImportRepository: (payload: ImportRepositoryInput) => Promise<boolean>;
  onLogConnectionSaved?: () => void;
  saveLogSourceConnection: (connection: {
    kind: "gcp_cloud_run";
    label: string;
    config: {
      projectId: string;
      serviceName: string;
      region?: string;
      minimumSeverity: "DEFAULT";
    };
  }) => Promise<unknown>;
}): Promise<void> {
  if (input.submission.kind === "validation_error") {
    input.setters.setError(input.submission.error || input.sourceRequiredError);
    return;
  }

  input.setters.setError(null);

  if (input.submission.kind === "gcp_connection") {
    await input.saveLogSourceConnection(input.submission.connection);
    resetImportRepositoryFormState(input.setters, "gcp_connection");
    return;
  }

  const imported = await input.onImportRepository(input.submission.input);
  if (!imported) {
    return;
  }

  if (input.submission.input.sourceKind === "file") {
    input.onLogConnectionSaved?.();
  }

  resetImportRepositoryFormState(input.setters, "repository_import");
}

export async function resolveImportRepositoryBrowsePath(input: {
  browseKind: "directory" | "file";
  sourcePath: string;
  defaultDirectoryPath?: string;
  pickDirectory: (currentPath?: string) => Promise<string | null>;
  pickFile: (currentPath: string) => Promise<string | null>;
}): Promise<string | null> {
  return input.browseKind === "directory"
    ? input.pickDirectory(input.sourcePath || input.defaultDirectoryPath)
    : input.pickFile(input.sourcePath);
}

export function resolveImportRepositoryBrowseError(input: {
  error: unknown;
  browseKind: "directory" | "file";
  copy: {
    directoryPickerFailed: string;
    filePickerFailed: string;
  };
}): string {
  if (input.error instanceof Error) {
    return input.error.message;
  }

  return input.browseKind === "directory"
    ? input.copy.directoryPickerFailed
    : input.copy.filePickerFailed;
}

export function applyImportRepositoryBrowseSelection(input: {
  browseKind: "directory" | "file";
  pickedPath: string;
  setSourceKind: (value: RepositorySourceKind) => void;
  setSourcePath: (value: string) => void;
}) {
  input.setSourceKind(input.browseKind);
  input.setSourcePath(input.pickedPath);
}
