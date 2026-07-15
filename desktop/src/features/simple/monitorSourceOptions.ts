import type { AppTranslations } from "../../i18n/types";
import type { RepositoryAnalysis } from "../../types/library";
import type { MonitorLaunchSource } from "../../types/monitorLaunch";
import type { LogSourceConnection } from "../../types/monitor";
import type { CodeProject } from "../../types/codeProject";

export type MonitorSourceFilter = "all" | "file" | "folder" | "cloud" | "code";

export interface MonitorSourceSelectionModel {
  allMonitorSourceOptions: MonitorLaunchSource[];
  filteredMonitorSourceOptions: MonitorLaunchSource[];
  selectedSourceOption: MonitorLaunchSource | null;
  cloudConnectionCount: number;
  canStartSelectedSource: boolean;
  sourceEmptyMessage: string;
  startHint: string;
}

export interface MonitorSourceCopy {
  logFile: string;
  folder: string;
  cloudRemote: string;
  cloudConnection: string;
  codeProject: string;
  emptyCloudReady: string;
  emptyCloudMissing: string;
  emptyCodeReady: string;
  emptyCodeMissing: string;
  emptyFolder: string;
  emptyDefault: string;
  startHintDisabledConnection: string;
  startHintCloudManaged: string;
  startHintCodeNotConfigured: string;
  startHintFileOnly: string;
  startHintReady: string;
  startHintSelect: string;
}

export function buildMonitorSourceCopy(t: AppTranslations): MonitorSourceCopy {
  return {
    logFile: t.simpleMode.setup.logFile,
    folder: t.simpleMode.setup.folder,
    cloudRemote: t.simpleMode.setup.cloudRemote,
    cloudConnection: t.simpleMode.setup.cloudConnection,
    codeProject: t.simpleMode.setup.codeProject,
    emptyCloudReady: t.simpleMode.setup.emptyCloudReady,
    emptyCloudMissing: t.simpleMode.setup.emptyCloudMissing,
    emptyCodeReady: t.simpleMode.setup.emptyCodeReady,
    emptyCodeMissing: t.simpleMode.setup.emptyCodeMissing,
    emptyFolder: t.simpleMode.setup.emptyFolder,
    emptyDefault: t.simpleMode.setup.emptyDefault,
    startHintDisabledConnection: t.simpleMode.setup.startHintDisabledConnection,
    startHintCloudManaged: t.simpleMode.setup.startHintCloudManaged,
    startHintCodeNotConfigured: t.simpleMode.setup.startHintCodeNotConfigured,
    startHintFileOnly: t.simpleMode.setup.startHintFileOnly,
    startHintReady: t.simpleMode.setup.startHintReady,
    startHintSelect: t.simpleMode.setup.startHintSelect,
  };
}

function buildRepositorySourceOptions(
  repositories: RepositoryAnalysis[],
  copy: MonitorSourceCopy,
): MonitorLaunchSource[] {
  return repositories.map((repo) => {
    const sourceType: MonitorLaunchSource["sourceType"] =
      repo.sourceKind === "file" ? "file" : repo.sourceKind === "directory" ? "folder" : "cloud";

    return {
      id: repo.id,
      title: repo.title,
      sourcePath: repo.sourcePath,
      sourceType,
      sourceTypeLabel:
        sourceType === "file"
          ? copy.logFile
          : sourceType === "folder"
            ? copy.folder
            : copy.cloudRemote,
      startable: repo.sourceKind === "file" || repo.sourceKind === "directory",
      origin: "repository",
      connectionId: undefined,
      adapterKind: repo.sourceKind === "directory" ? "directory-tail" : "file",
    };
  });
}

function buildCloudConnectionOptions(
  connections: LogSourceConnection[],
  copy: MonitorSourceCopy,
): MonitorLaunchSource[] {
  return connections
    .filter((connection) => connection.kind === "gcp_cloud_run")
    .map((connection) => ({
      id: `connection:${connection.id}`,
      title: connection.label,
      sourcePath: connection.sourceUri,
      sourceType: "cloud",
      sourceTypeLabel: copy.cloudConnection,
      startable: connection.enabled,
      origin: "connection",
      connectionId: connection.id,
    }));
}

function buildCodeProjectSourceOptions(
  projects: CodeProject[],
  copy: MonitorSourceCopy,
): MonitorLaunchSource[] {
  return projects.map((project) => {
    const config = project.sonarqubeConfig;
    const analysisMode = config?.analysisMode ?? project.analysisMode ?? "local";
    const hasRemoteConfig = Boolean(
      config?.apiUrl.trim() && config.projectKey.trim() && config.authToken.trim(),
    );
    const hasLocalConfig = Boolean(project.repositoryUrl.trim());
    const sourcePath =
      analysisMode === "connected" && config
        ? `sonarqube://${config.apiUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}/${config.projectKey}`
        : project.repositoryUrl;

    return {
      id: `code-project:${project.id}`,
      title: project.label,
      sourcePath,
      sourceType: "code",
      sourceTypeLabel: copy.codeProject,
      startable: project.enabled && (analysisMode === "local" ? hasLocalConfig : hasRemoteConfig),
      origin: "codeProject",
      adapterKind: "sonarqube",
      connectionConfig: {
        analysisMode,
        apiUrl: config?.apiUrl ?? "",
        projectKey: config?.projectKey ?? project.label,
        authToken: config?.authToken ?? "",
        pollingInterval: config?.pollingInterval ?? "30",
        syncRules: config?.syncRules ?? false,
        localRulesProfile: config?.localRulesProfile ?? "maia-default",
        repositoryUrl: project.repositoryUrl,
        codeProjectId: project.id,
      },
    };
  });
}

export function shouldResetSelectedSource(
  selectedSourceId: string,
  selectedSourceOption: MonitorLaunchSource | null,
  sourceFilter: MonitorSourceFilter,
): boolean {
  if (!selectedSourceId || sourceFilter === "all") {
    return false;
  }

  return Boolean(selectedSourceOption && selectedSourceOption.sourceType !== sourceFilter);
}

export function buildMonitorSourceSelectionModel(input: {
  repositories: RepositoryAnalysis[];
  persistentConnections: LogSourceConnection[];
  codeProjects?: CodeProject[];
  selectedSourceId: string;
  selectedSoundId: string;
  sourceFilter: MonitorSourceFilter;
  copy: MonitorSourceCopy;
}): MonitorSourceSelectionModel {
  const monitorSourceOptions = buildRepositorySourceOptions(input.repositories, input.copy);
  const cloudConnectionOptions = buildCloudConnectionOptions(
    input.persistentConnections,
    input.copy,
  );
  const codeProjectOptions = buildCodeProjectSourceOptions(input.codeProjects ?? [], input.copy);
  const allMonitorSourceOptions: MonitorLaunchSource[] = [
    ...monitorSourceOptions,
    ...cloudConnectionOptions,
    ...codeProjectOptions,
  ];

  const cloudConnectionCount = cloudConnectionOptions.length;
  const codeProjectCount = codeProjectOptions.length;
  const filteredMonitorSourceOptions = allMonitorSourceOptions.filter((source) =>
    input.sourceFilter === "all" ? true : source.sourceType === input.sourceFilter,
  );
  const selectedSourceOption =
    allMonitorSourceOptions.find((source) => source.id === input.selectedSourceId) ?? null;
  const canStartSelectedSource = Boolean(selectedSourceOption?.startable);

  const sourceEmptyMessage =
    input.sourceFilter === "cloud"
      ? cloudConnectionCount > 0
        ? input.copy.emptyCloudReady
        : input.copy.emptyCloudMissing
      : input.sourceFilter === "code"
        ? codeProjectCount > 0
          ? input.copy.emptyCodeReady
          : input.copy.emptyCodeMissing
        : input.sourceFilter === "folder"
          ? input.copy.emptyFolder
          : input.copy.emptyDefault;

  const startHint =
    selectedSourceOption && !selectedSourceOption.startable
      ? selectedSourceOption.origin === "codeProject"
        ? input.copy.startHintCodeNotConfigured
        : selectedSourceOption.origin === "connection"
          ? input.copy.startHintDisabledConnection
          : selectedSourceOption.sourceType === "cloud"
            ? input.copy.startHintCloudManaged
            : input.copy.startHintFileOnly
      : input.selectedSourceId && input.selectedSoundId
        ? input.copy.startHintReady
        : input.copy.startHintSelect;

  return {
    allMonitorSourceOptions,
    filteredMonitorSourceOptions,
    selectedSourceOption,
    cloudConnectionCount,
    canStartSelectedSource,
    sourceEmptyMessage,
    startHint,
  };
}
