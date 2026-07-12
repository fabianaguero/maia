import type { Dispatch, SetStateAction } from "react";

import type { MonitorLaunchSource } from "../../types/monitorLaunch";
import type { CodeProject } from "../../types/codeProject";
import type { MonitorSourceFilter } from "./monitorSourceOptions";
import type { MonitorSourceCopy } from "./monitorSourceOptions";
import type { UseSimpleMonitorLaunchStateInput } from "./useSimpleMonitorLaunchState";
import type { SimpleMonitorStartRequest } from "./simpleMonitorInteractionRuntime";

export interface SimpleMonitorLaunchStateSelectorSlice {
  filteredMonitorSourceOptions: MonitorLaunchSource[];
  selectedSourceOption: MonitorLaunchSource | null;
  canStartSelectedSource: boolean;
  sourceEmptyMessage: string;
  startHint: string;
  selectedSourceId: string;
  setSelectedSourceId: Dispatch<SetStateAction<string>>;
  sourceFilter: MonitorSourceFilter;
  setSourceFilter: Dispatch<SetStateAction<MonitorSourceFilter>>;
  isLaunchingMonitor: boolean;
  setIsLaunchingMonitor: Dispatch<SetStateAction<boolean>>;
}

export interface SimpleMonitorLaunchStateResult extends SimpleMonitorLaunchStateSelectorSlice {
  selectedSoundId: string;
  setSelectedSoundId: Dispatch<SetStateAction<string>>;
  handleStartMonitoringRequest: () => Promise<void>;
}

export function buildSimpleMonitorLaunchSelectorInput(
  input: UseSimpleMonitorLaunchStateInput & { codeProjects: CodeProject[] },
  selectedSoundId: string,
  copy: MonitorSourceCopy,
) {
  return {
    repositories: input.repositories,
    codeProjects: input.codeProjects,
    selectedSoundId,
    isListening: input.isListening,
    copy,
  };
}

export function buildSimpleMonitorStartRequestInput(input: {
  selector: Pick<
    SimpleMonitorLaunchStateSelectorSlice,
    "selectedSourceOption" | "canStartSelectedSource"
  >;
  selectedSoundId: string;
  onResumeAudio: UseSimpleMonitorLaunchStateInput["onResumeAudio"];
  onStartMonitoring: UseSimpleMonitorLaunchStateInput["onStartMonitoring"];
  setLaunchingImmediate: () => void;
  waitForNextFrame: () => Promise<void>;
  finishLaunchingOnSuccess: () => void;
  resetLaunchingOnFailure: () => void;
}): SimpleMonitorStartRequest {
  return {
    selectedSourceOption: input.selector.selectedSourceOption,
    selectedSoundId: input.selectedSoundId,
    canStartSelectedSource: input.selector.canStartSelectedSource,
    setLaunchingImmediate: input.setLaunchingImmediate,
    waitForNextFrame: input.waitForNextFrame,
    resumeAudio: input.onResumeAudio,
    startMonitoring: input.onStartMonitoring,
    finishLaunchingOnSuccess: input.finishLaunchingOnSuccess,
    resetLaunchingOnFailure: input.resetLaunchingOnFailure,
  };
}

export function buildSimpleMonitorLaunchStateResult(input: SimpleMonitorLaunchStateResult) {
  return input;
}
