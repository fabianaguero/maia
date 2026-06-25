import { en, type AppTranslations } from "../../i18n/en";
import type { LogSourceConnection, RepositoryAnalysis } from "../../types/library";

export type MonitorSourceFilter = "all" | "file" | "folder" | "cloud";

export interface MonitorLaunchSource {
  id: string;
  title: string;
  sourcePath: string;
  sourceType: Exclude<MonitorSourceFilter, "all">;
  sourceTypeLabel: string;
  startable: boolean;
  origin: "repository" | "connection";
  connectionId?: string;
}

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
  emptyCloudReady: string;
  emptyCloudMissing: string;
  emptyFolder: string;
  emptyDefault: string;
  startHintDisabledConnection: string;
  startHintCloudManaged: string;
  startHintFileOnly: string;
  startHintReady: string;
  startHintSelect: string;
}

const DEFAULT_MONITOR_SOURCE_COPY: MonitorSourceCopy = {
  logFile: en.simpleMode.setup.logFile,
  folder: en.simpleMode.setup.folder,
  cloudRemote: en.simpleMode.setup.cloudRemote,
  cloudConnection: en.simpleMode.setup.cloudConnection,
  emptyCloudReady: en.simpleMode.setup.emptyCloudReady,
  emptyCloudMissing: en.simpleMode.setup.emptyCloudMissing,
  emptyFolder: en.simpleMode.setup.emptyFolder,
  emptyDefault: en.simpleMode.setup.emptyDefault,
  startHintDisabledConnection: en.simpleMode.setup.startHintDisabledConnection,
  startHintCloudManaged: en.simpleMode.setup.startHintCloudManaged,
  startHintFileOnly: en.simpleMode.setup.startHintFileOnly,
  startHintReady: en.simpleMode.setup.startHintReady,
  startHintSelect: en.simpleMode.setup.startHintSelect,
};

export function buildMonitorSourceCopy(t: AppTranslations): MonitorSourceCopy {
  return {
    logFile: t.simpleMode.setup.logFile,
    folder: t.simpleMode.setup.folder,
    cloudRemote: t.simpleMode.setup.cloudRemote,
    cloudConnection: t.simpleMode.setup.cloudConnection,
    emptyCloudReady: t.simpleMode.setup.emptyCloudReady,
    emptyCloudMissing: t.simpleMode.setup.emptyCloudMissing,
    emptyFolder: t.simpleMode.setup.emptyFolder,
    emptyDefault: t.simpleMode.setup.emptyDefault,
    startHintDisabledConnection: t.simpleMode.setup.startHintDisabledConnection,
    startHintCloudManaged: t.simpleMode.setup.startHintCloudManaged,
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
      startable: repo.sourceKind === "file",
      origin: "repository",
      connectionId: undefined,
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
  selectedSourceId: string;
  selectedSoundId: string;
  sourceFilter: MonitorSourceFilter;
  copy?: Partial<MonitorSourceCopy>;
}): MonitorSourceSelectionModel {
  const copy: MonitorSourceCopy = {
    ...DEFAULT_MONITOR_SOURCE_COPY,
    ...input.copy,
  };
  const monitorSourceOptions = buildRepositorySourceOptions(input.repositories, copy);
  const cloudConnectionOptions = buildCloudConnectionOptions(input.persistentConnections, copy);
  const allMonitorSourceOptions: MonitorLaunchSource[] = [
    ...monitorSourceOptions,
    ...cloudConnectionOptions,
  ];

  const cloudConnectionCount = cloudConnectionOptions.length;
  const filteredMonitorSourceOptions = allMonitorSourceOptions.filter((source) =>
    input.sourceFilter === "all" ? true : source.sourceType === input.sourceFilter,
  );
  const selectedSourceOption =
    allMonitorSourceOptions.find((source) => source.id === input.selectedSourceId) ?? null;
  const canStartSelectedSource = Boolean(selectedSourceOption?.startable);

  const sourceEmptyMessage =
    input.sourceFilter === "cloud"
      ? cloudConnectionCount > 0
        ? copy.emptyCloudReady
        : copy.emptyCloudMissing
      : input.sourceFilter === "folder"
        ? copy.emptyFolder
        : copy.emptyDefault;

  const startHint =
    selectedSourceOption && !selectedSourceOption.startable
      ? selectedSourceOption.origin === "connection"
        ? copy.startHintDisabledConnection
        : selectedSourceOption.sourceType === "cloud"
          ? copy.startHintCloudManaged
          : copy.startHintFileOnly
      : input.selectedSourceId && input.selectedSoundId
        ? copy.startHintReady
        : copy.startHintSelect;

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
