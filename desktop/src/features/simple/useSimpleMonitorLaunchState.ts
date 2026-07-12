import { useState } from "react";
import { flushSync } from "react-dom";

import type { AppTranslations } from "../../i18n/types";
import type { RepositoryAnalysis } from "../../types/library";
import { buildMonitorSourceCopy } from "./monitorSourceOptions";
import type { MonitorLaunchSource } from "../../types/monitorLaunch";
import { useCodeProjectsState } from "../library/useCodeProjectsState";
import { executeSimpleMonitorStartRequest } from "./simpleMonitorInteractionRuntime";
import {
  buildSimpleMonitorLaunchSelectorInput,
  buildSimpleMonitorLaunchStateResult,
  buildSimpleMonitorStartRequestInput,
} from "./simpleMonitorLaunchStateHookRuntime";
import { useSimpleMonitorSourceSelector } from "./useSimpleMonitorSourceSelector";

export interface UseSimpleMonitorLaunchStateInput {
  repositories: RepositoryAnalysis[];
  isListening: boolean;
  t: AppTranslations;
  onResumeAudio: () => Promise<void> | void;
  onStartMonitoring: (source: MonitorLaunchSource, trackId?: string) => void | Promise<void>;
}

export function useSimpleMonitorLaunchState({
  repositories,
  isListening,
  t,
  onResumeAudio,
  onStartMonitoring,
}: UseSimpleMonitorLaunchStateInput) {
  const [selectedSoundId, setSelectedSoundId] = useState("");
  const { projects: codeProjects } = useCodeProjectsState();
  const monitorSourceCopy = buildMonitorSourceCopy(t);
  const selector = useSimpleMonitorSourceSelector(
    buildSimpleMonitorLaunchSelectorInput(
      {
        repositories,
        codeProjects,
        isListening,
        t,
        onResumeAudio,
        onStartMonitoring,
      },
      selectedSoundId,
      monitorSourceCopy,
    ),
  );
  const {
    filteredMonitorSourceOptions,
    selectedSourceOption,
    canStartSelectedSource,
    sourceEmptyMessage,
    startHint,
    selectedSourceId,
    setSelectedSourceId,
    sourceFilter,
    setSourceFilter,
    isLaunchingMonitor,
    setIsLaunchingMonitor,
  } = selector;

  const handleStartMonitoringRequest = async () => {
    const didStart = await executeSimpleMonitorStartRequest(
      buildSimpleMonitorStartRequestInput({
        selector: {
          selectedSourceOption,
          canStartSelectedSource,
        },
        selectedSoundId,
        onResumeAudio,
        onStartMonitoring,
        setLaunchingImmediate: () =>
          flushSync(() => {
            setIsLaunchingMonitor(true);
          }),
        waitForNextFrame: () =>
          new Promise<void>((resolve) => {
            window.requestAnimationFrame(() => resolve());
          }),
        finishLaunchingOnSuccess: () => setIsLaunchingMonitor(false),
        resetLaunchingOnFailure: () => setIsLaunchingMonitor(false),
      }),
    );
    if (!didStart) {
      console.error("Failed to start monitor from selector");
    }
  };

  return buildSimpleMonitorLaunchStateResult({
    selectedSoundId,
    setSelectedSoundId,
    filteredMonitorSourceOptions,
    selectedSourceOption,
    canStartSelectedSource,
    sourceEmptyMessage,
    startHint,
    selectedSourceId,
    setSelectedSourceId,
    sourceFilter,
    setSourceFilter,
    isLaunchingMonitor,
    handleStartMonitoringRequest,
    setIsLaunchingMonitor,
  });
}
