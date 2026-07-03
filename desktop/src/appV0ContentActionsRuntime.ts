import type { AppV0SectionContentInput } from "./appV0SectionContentRuntime";
import type { AppV0MonitorLaunchExecutionResult } from "./appV0MonitorRuntime";
import type { AppSection } from "./features/simple/appSections";
import type { MonitorLaunchSource } from "./features/simple/monitorSourceOptions";
import type { ImportBaseAssetInput, ImportRepositoryInput } from "./types/library";

export interface AppV0ContentActions {
  onSectionChange: (section: AppSection) => void;
  onInspect: () => void;
  onStopMonitoring: () => void;
  onImportRepository: (nextInput: ImportRepositoryInput) => Promise<boolean>;
  onImportBaseAsset: (nextInput: ImportBaseAssetInput) => Promise<boolean>;
  onStartLibraryMonitoring: (repoId: string) => Promise<void>;
  onStopMonitor: () => Promise<void>;
  onResumeAudio: () => Promise<void>;
  onStartMonitoring: (source: MonitorLaunchSource, trackId?: string) => Promise<void>;
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => Promise<void>;
  onInspectFloatingWaveform: () => void;
}

export function buildAppV0ContentActions(input: {
  setCurrentSection: (section: AppSection) => void;
  stopSession: () => Promise<void>;
  importRepositorySource: (input: ImportRepositoryInput) => Promise<unknown>;
  importLibraryBaseAsset: (input: ImportBaseAssetInput) => Promise<unknown>;
  startLibraryMonitoring: (repoId: string) => Promise<AppV0MonitorLaunchExecutionResult>;
  startSourceMonitoring: (
    source: MonitorLaunchSource,
    trackId?: string,
  ) => Promise<AppV0MonitorLaunchExecutionResult>;
  reportMonitorLaunchFailure: (
    scope: "library" | "source",
    result: AppV0MonitorLaunchExecutionResult,
  ) => void;
  resumeAudio: () => Promise<void>;
  replaySession: (sessionId: string, sourcePath: string, repoTitle: string) => Promise<void>;
}): AppV0ContentActions {
  return {
    onSectionChange: (section: AppSection) => {
      input.setCurrentSection(section);
    },
    onInspect: () => {
      input.setCurrentSection("inspect");
    },
    onStopMonitoring: () => {
      void input.stopSession();
    },
    onImportRepository: async (nextInput: ImportRepositoryInput): Promise<boolean> => {
      const repository = await input.importRepositorySource(nextInput);
      return Boolean(repository);
    },
    onImportBaseAsset: async (nextInput: ImportBaseAssetInput): Promise<boolean> => {
      const asset = await input.importLibraryBaseAsset(nextInput);
      return Boolean(asset);
    },
    onStartLibraryMonitoring: async (repoId: string): Promise<void> => {
      const result = await input.startLibraryMonitoring(repoId);
      input.reportMonitorLaunchFailure("library", result);
    },
    onStopMonitor: () => input.stopSession(),
    onResumeAudio: () => input.resumeAudio(),
    onStartMonitoring: async (source: MonitorLaunchSource, trackId?: string): Promise<void> => {
      const result = await input.startSourceMonitoring(source, trackId);
      input.reportMonitorLaunchFailure("source", result);
    },
    onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) =>
      input.replaySession(sessionId, sourcePath, repoTitle),
    onInspectFloatingWaveform: () => {
      input.setCurrentSection("monitor");
    },
  };
}
