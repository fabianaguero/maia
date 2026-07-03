import type { FormEvent } from "react";

import {
  pickRepositoryDirectory,
  pickRepositoryFile,
  upsertLogSourceConnection,
} from "../../../api/repositories";
import type { ImportRepositoryInput } from "../../../types/library";
import {
  browseImportRepositorySource,
  submitImportRepositoryDraft,
  type ImportRepositoryFormControllerCopy,
} from "./importRepositoryFormControllerRuntime";
import { useImportRepositoryFormDraftState } from "./useImportRepositoryFormDraftState";

interface UseImportRepositoryFormControllerInput {
  defaultDirectoryPath?: string;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  onLogConnectionSaved?: () => void;
  copy: ImportRepositoryFormControllerCopy;
}

export function useImportRepositoryFormController({
  defaultDirectoryPath,
  onImportRepository,
  onLogConnectionSaved,
  copy,
}: UseImportRepositoryFormControllerInput) {
  const draftState = useImportRepositoryFormDraftState(defaultDirectoryPath);
  const {
    sourceKind,
    setSourceKind,
    sourcePath,
    setSourcePath,
    label,
    setLabel,
    gcpProjectId,
    setGcpProjectId,
    gcpServiceName,
    setGcpServiceName,
    gcpRegion,
    setGcpRegion,
    error,
    setError,
    pickerBusy,
    setPickerBusy,
    isGcpCloudRun,
    selectGcpCloudRun,
    useCurrentWorkspace,
  } = draftState;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitImportRepositoryDraft({
      draft: {
        sourceKind,
        sourcePath,
        label,
        gcpProjectId,
        gcpServiceName,
        gcpRegion,
      },
      copy: {
        gcpRequiresProjectAndService: copy.gcpRequiresProjectAndService,
        cloudRunLabelSuffix: copy.cloudRunLabelSuffix,
        sourceRequiredError: copy.sourceRequiredError,
      },
      setters: {
        setLabel,
        setSourcePath,
        setGcpProjectId,
        setGcpServiceName,
        setGcpRegion,
        setError,
      },
      onImportRepository,
      onLogConnectionSaved,
      saveLogSourceConnection: upsertLogSourceConnection,
    });
  }

  async function handleBrowseDirectory(): Promise<void> {
    await browseImportRepositorySource({
      browseKind: "directory",
      sourcePath,
      defaultDirectoryPath,
      copy,
      setters: {
        setSourceKind,
        setSourcePath,
        setError,
        setPickerBusy,
      },
      pickDirectory: pickRepositoryDirectory,
      pickFile: pickRepositoryFile,
    });
  }

  async function handleBrowseFile(): Promise<void> {
    await browseImportRepositorySource({
      browseKind: "file",
      sourcePath,
      defaultDirectoryPath,
      copy,
      setters: {
        setSourceKind,
        setSourcePath,
        setError,
        setPickerBusy,
      },
      pickDirectory: pickRepositoryDirectory,
      pickFile: pickRepositoryFile,
    });
  }

  return {
    ...draftState,
    error,
    pickerBusy,
    isGcpCloudRun,
    handleSubmit,
    handleBrowseDirectory,
    handleBrowseFile,
    selectGcpCloudRun,
    useCurrentWorkspace,
  };
}
