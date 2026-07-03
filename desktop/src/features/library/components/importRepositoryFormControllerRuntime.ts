import type { ImportRepositoryInput, RepositorySourceKind } from "../../../types/library";
import {
  buildImportRepositorySubmission,
  type ImportRepositoryFormDraft,
  type ImportRepositoryFormStateSetters,
} from "./importRepositoryFormRuntime";
import {
  applyImportRepositoryBrowseSelection,
  completeImportRepositoryDraftSubmission,
  resolveImportRepositoryBrowseError,
  resolveImportRepositoryBrowsePath,
} from "./importRepositoryFormControllerFlowRuntime";

export interface ImportRepositoryFormControllerCopy {
  gcpRequiresProjectAndService: string;
  cloudRunLabelSuffix: string;
  sourceRequiredError: string;
  directoryPickerFailed: string;
  filePickerFailed: string;
}

export type ImportRepositoryFormControllerDraft = ImportRepositoryFormDraft;

export interface ImportRepositoryFormControllerSetters extends ImportRepositoryFormStateSetters {
  setSourceKind: (value: RepositorySourceKind) => void;
  setError: (value: string | null) => void;
  setPickerBusy: (value: boolean) => void;
}

export async function submitImportRepositoryDraft(input: {
  draft: ImportRepositoryFormControllerDraft;
  copy: Pick<
    ImportRepositoryFormControllerCopy,
    "gcpRequiresProjectAndService" | "cloudRunLabelSuffix" | "sourceRequiredError"
  >;
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
  const submission = buildImportRepositorySubmission(input.draft, {
    gcpRequiresProjectAndService: input.copy.gcpRequiresProjectAndService,
    cloudRunLabelSuffix: input.copy.cloudRunLabelSuffix,
  });

  await completeImportRepositoryDraftSubmission({
    submission,
    sourceRequiredError: input.copy.sourceRequiredError,
    setters: input.setters,
    onImportRepository: input.onImportRepository,
    onLogConnectionSaved: input.onLogConnectionSaved,
    saveLogSourceConnection: input.saveLogSourceConnection,
  });
}

export async function browseImportRepositorySource(input: {
  browseKind: "directory" | "file";
  sourcePath: string;
  defaultDirectoryPath?: string;
  copy: Pick<ImportRepositoryFormControllerCopy, "directoryPickerFailed" | "filePickerFailed">;
  setters: Pick<
    ImportRepositoryFormControllerSetters,
    "setSourceKind" | "setSourcePath" | "setError" | "setPickerBusy"
  >;
  pickDirectory: (currentPath?: string) => Promise<string | null>;
  pickFile: (currentPath: string) => Promise<string | null>;
}): Promise<void> {
  input.setters.setPickerBusy(true);
  input.setters.setError(null);

  try {
    const pickedPath = await resolveImportRepositoryBrowsePath({
      browseKind: input.browseKind,
      sourcePath: input.sourcePath,
      defaultDirectoryPath: input.defaultDirectoryPath,
      pickDirectory: input.pickDirectory,
      pickFile: input.pickFile,
    });

    if (!pickedPath) {
      return;
    }

    applyImportRepositoryBrowseSelection({
      browseKind: input.browseKind,
      pickedPath,
      setSourceKind: input.setters.setSourceKind,
      setSourcePath: input.setters.setSourcePath,
    });
  } catch (nextError) {
    input.setters.setError(
      resolveImportRepositoryBrowseError({
        error: nextError,
        browseKind: input.browseKind,
        copy: input.copy,
      }),
    );
  } finally {
    input.setters.setPickerBusy(false);
  }
}
