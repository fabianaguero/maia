import type { ImportRepositoryInput, RepositorySourceKind } from "../../../types/library";

export interface ImportRepositoryFormDraft {
  sourceKind: RepositorySourceKind;
  sourcePath: string;
  label: string;
  gcpProjectId: string;
  gcpServiceName: string;
  gcpRegion: string;
}

export interface ImportRepositoryFormRuntimeCopy {
  gcpRequiresProjectAndService: string;
  cloudRunLabelSuffix: string;
}

export interface ImportRepositoryFormStateSetters {
  setLabel: (value: string) => void;
  setSourcePath: (value: string) => void;
  setGcpProjectId: (value: string) => void;
  setGcpServiceName: (value: string) => void;
  setGcpRegion: (value: string) => void;
}

export function isGcpCloudRunRepositoryDraft(
  draft: Pick<ImportRepositoryFormDraft, "sourceKind" | "sourcePath">,
): boolean {
  return draft.sourceKind === "url" && draft.sourcePath.trim() === "gcp-cloud-run";
}

export function normalizeImportRepositoryDraft(draft: ImportRepositoryFormDraft) {
  return {
    sourceKind: draft.sourceKind,
    sourcePath: draft.sourcePath.trim(),
    label: draft.label.trim(),
    gcpProjectId: draft.gcpProjectId.trim(),
    gcpServiceName: draft.gcpServiceName.trim(),
    gcpRegion: draft.gcpRegion.trim(),
  };
}

export function buildImportRepositorySubmission(
  draft: ImportRepositoryFormDraft,
  copy: ImportRepositoryFormRuntimeCopy,
):
  | { kind: "validation_error"; error: string }
  | { kind: "repository_import"; input: ImportRepositoryInput }
  | {
      kind: "gcp_connection";
      connection: {
        kind: "gcp_cloud_run";
        label: string;
        config: {
          projectId: string;
          serviceName: string;
          region?: string;
          minimumSeverity: "DEFAULT";
        };
      };
    } {
  const normalized = normalizeImportRepositoryDraft(draft);

  if (isGcpCloudRunRepositoryDraft(normalized)) {
    if (!normalized.gcpProjectId || !normalized.gcpServiceName) {
      return {
        kind: "validation_error",
        error: copy.gcpRequiresProjectAndService,
      };
    }

    return {
      kind: "gcp_connection",
      connection: {
        kind: "gcp_cloud_run",
        label: normalized.label || `${normalized.gcpServiceName} · ${copy.cloudRunLabelSuffix}`,
        config: {
          projectId: normalized.gcpProjectId,
          serviceName: normalized.gcpServiceName,
          region: normalized.gcpRegion || undefined,
          minimumSeverity: "DEFAULT",
        },
      },
    };
  }

  if (!normalized.sourcePath) {
    return {
      kind: "validation_error",
      error: "",
    };
  }

  return {
    kind: "repository_import",
    input: {
      sourceKind: normalized.sourceKind,
      sourcePath: normalized.sourcePath,
      label: normalized.label || undefined,
    },
  };
}

export function resetImportRepositoryFormState(
  setters: ImportRepositoryFormStateSetters,
  submissionKind: "repository_import" | "gcp_connection",
): void {
  setters.setLabel("");
  setters.setSourcePath("");

  if (submissionKind === "gcp_connection") {
    setters.setGcpProjectId("");
    setters.setGcpServiceName("");
    setters.setGcpRegion("");
  }
}

export function resolveRepositoryPathFieldCopy(input: {
  sourceKind: RepositorySourceKind;
  localProjectPath: string;
  sourceLogPath: string;
  githubRepositoryUrl: string;
  localProjectPathPlaceholder: string;
  sourceLogPathPlaceholder: string;
  githubRepositoryUrlPlaceholder: string;
}): { label: string; placeholder: string } {
  if (input.sourceKind === "directory") {
    return {
      label: input.localProjectPath,
      placeholder: input.localProjectPathPlaceholder,
    };
  }

  if (input.sourceKind === "file") {
    return {
      label: input.sourceLogPath,
      placeholder: input.sourceLogPathPlaceholder,
    };
  }

  return {
    label: input.githubRepositoryUrl,
    placeholder: input.githubRepositoryUrlPlaceholder,
  };
}
