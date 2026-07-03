import { FolderOpen, GitBranch, ScrollText } from "lucide-react";
import { useT } from "../../../i18n/I18nContext";
import type { ImportRepositoryInput, RepositorySourceKind } from "../../../types/library";
import { Web3Spinner } from "../../../components/Web3Spinner";
import { resolveRepositoryPathFieldCopy } from "./importRepositoryFormRuntime";
import { ImportRepositoryActionsFooter } from "./ImportRepositoryActionsFooter";
import { ImportRepositorySourceFields } from "./ImportRepositorySourceFields";
import { ImportRepositorySourceTypeGrid } from "./ImportRepositorySourceTypeGrid";
import { useImportRepositoryFormController } from "./useImportRepositoryFormController";

interface ImportRepositoryFormProps {
  busy: boolean;
  defaultDirectoryPath?: string;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  onLogConnectionSaved?: () => void;
}

export function ImportRepositoryForm({
  busy,
  defaultDirectoryPath,
  onImportRepository,
  onLogConnectionSaved,
}: ImportRepositoryFormProps) {
  const t = useT();
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
    pickerBusy,
    isGcpCloudRun,
    handleSubmit,
    handleBrowseDirectory,
    handleBrowseFile,
    selectGcpCloudRun,
    useCurrentWorkspace,
  } = useImportRepositoryFormController({
    defaultDirectoryPath,
    onImportRepository,
    onLogConnectionSaved,
    copy: {
      gcpRequiresProjectAndService: t.library.forms.repository.gcpRequiresProjectAndService,
      cloudRunLabelSuffix: t.simpleMode.connections.cloudRunLabelSuffix,
      sourceRequiredError: t.library.forms.repository.sourceRequiredError,
      directoryPickerFailed: t.library.forms.repository.directoryPickerFailed,
      filePickerFailed: t.library.forms.repository.filePickerFailed,
    },
  });

  const importModes: Array<{
    id: RepositorySourceKind;
    label: string;
    help: string;
    icon: typeof FolderOpen;
  }> = [
    {
      id: "directory",
      label: t.library.forms.repository.projectFolder,
      help: t.library.forms.repository.projectFolderHelp,
      icon: FolderOpen,
    },
    {
      id: "file",
      label: t.library.forms.repository.logFile,
      help: t.library.forms.repository.logFileHelp,
      icon: ScrollText,
    },
    {
      id: "url",
      label: t.library.forms.repository.githubRepo,
      help: t.library.forms.repository.githubRepoHelp,
      icon: GitBranch,
    },
  ];
  const sourcePathFieldCopy = resolveRepositoryPathFieldCopy({
    sourceKind,
    localProjectPath: t.library.forms.repository.localProjectPath,
    sourceLogPath: t.library.forms.repository.sourceLogPath,
    githubRepositoryUrl: t.library.forms.repository.githubRepositoryUrl,
    localProjectPathPlaceholder: t.library.forms.repository.localProjectPathPlaceholder,
    sourceLogPathPlaceholder: t.library.forms.repository.sourceLogPathPlaceholder,
    githubRepositoryUrlPlaceholder: t.library.forms.repository.githubRepositoryUrlPlaceholder,
  });

  return (
    <form className="import-form maia-pro-form" onSubmit={(event) => void handleSubmit(event)}>
      <Web3Spinner visible={busy} label={t.library.forms.repository.ingestingTelemetrySource} />
      <div className="form-intro">
        <h2>{t.library.forms.repository.title}</h2>
        <p className="support-copy">{t.library.forms.repository.description}</p>
      </div>

      <ImportRepositorySourceTypeGrid
        importTypeAria={t.library.forms.repository.importTypeAria}
        importModes={importModes}
        sourceKind={sourceKind}
        isGcpCloudRun={isGcpCloudRun}
        gcpCloudRunLabel={t.library.forms.repository.gcpCloudRun}
        gcpCloudRunHelp={t.library.forms.repository.gcpCloudRunHelp}
        onSelectSourceKind={setSourceKind}
        onSelectGcpCloudRun={selectGcpCloudRun}
      />

      <ImportRepositorySourceFields
        isGcpCloudRun={isGcpCloudRun}
        sourceKind={sourceKind}
        sourcePath={sourcePath}
        label={label}
        gcpProjectId={gcpProjectId}
        gcpServiceName={gcpServiceName}
        gcpRegion={gcpRegion}
        sourcePathFieldCopy={sourcePathFieldCopy}
        busy={busy}
        pickerBusy={pickerBusy}
        pickerBusyLabel={t.library.forms.repository.pickerBusy}
        gcpProjectIdLabel={t.library.forms.repository.gcpProjectId}
        gcpProjectIdPlaceholder={t.library.forms.repository.gcpProjectIdPlaceholder}
        cloudRunServiceLabel={t.library.forms.repository.cloudRunService}
        cloudRunServicePlaceholder={t.library.forms.repository.cloudRunServicePlaceholder}
        regionOptionalLabel={t.library.forms.repository.regionOptional}
        regionPlaceholder={t.library.forms.repository.regionPlaceholder}
        targetSessionLabelOptional={t.library.forms.repository.targetSessionLabelOptional}
        targetSessionLabelPlaceholder={t.library.forms.repository.targetSessionLabelPlaceholder}
        onSourcePathChange={setSourcePath}
        onLabelChange={setLabel}
        onGcpProjectIdChange={setGcpProjectId}
        onGcpServiceNameChange={setGcpServiceName}
        onGcpRegionChange={setGcpRegion}
        onBrowseDirectory={() => void handleBrowseDirectory()}
        onBrowseFile={() => void handleBrowseFile()}
      />

      {error ? (
        <div className="form-notice error">
          <span>{error}</span>
        </div>
      ) : null}

      <ImportRepositoryActionsFooter
        busy={busy}
        analyzingLabel={t.library.forms.repository.analyzing}
        startIngestionLabel={t.library.forms.repository.startIngestion}
        defaultDirectoryPath={defaultDirectoryPath}
        useCurrentWorkspaceLabel={t.library.forms.repository.useCurrentWorkspace}
        onUseCurrentWorkspace={useCurrentWorkspace}
      />
    </form>
  );
}
