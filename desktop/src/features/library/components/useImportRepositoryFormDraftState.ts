import { useState } from "react";

import type { RepositorySourceKind } from "../../../types/library";
import { isGcpCloudRunRepositoryDraft } from "./importRepositoryFormRuntime";

export function useImportRepositoryFormDraftState(defaultDirectoryPath?: string) {
  const [sourceKind, setSourceKind] = useState<RepositorySourceKind>("directory");
  const [sourcePath, setSourcePath] = useState("");
  const [label, setLabel] = useState("");
  const [gcpProjectId, setGcpProjectId] = useState("");
  const [gcpServiceName, setGcpServiceName] = useState("");
  const [gcpRegion, setGcpRegion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pickerBusy, setPickerBusy] = useState(false);

  function selectGcpCloudRun() {
    setSourceKind("url");
    setSourcePath("gcp-cloud-run");
  }

  function useCurrentWorkspace() {
    setSourceKind("directory");
    setSourcePath(defaultDirectoryPath ?? "");
  }

  return {
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
    isGcpCloudRun: isGcpCloudRunRepositoryDraft({
      sourceKind,
      sourcePath,
    }),
    selectGcpCloudRun,
    useCurrentWorkspace,
  };
}
