import { useState } from "react";
import { flushSync } from "react-dom";

import type { AppTranslations } from "../../i18n/en";
import type { RepositoryAnalysis } from "../../types/library";
import { buildMonitorSourceCopy, type MonitorLaunchSource } from "./monitorSourceOptions";
import { executeSimpleMonitorStartRequest } from "./simpleMonitorInteractionRuntime";
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
  const monitorSourceCopy = buildMonitorSourceCopy(t);
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
  } = useSimpleMonitorSourceSelector({
    repositories,
    selectedSoundId,
    isListening,
    copy: monitorSourceCopy,
  });

  const handleStartMonitoringRequest = async () => {
    const didStart = await executeSimpleMonitorStartRequest({
      selectedSourceOption,
      selectedSoundId,
      canStartSelectedSource,
      setLaunchingImmediate: () =>
        flushSync(() => {
          setIsLaunchingMonitor(true);
        }),
      waitForNextFrame: () =>
        new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => resolve());
        }),
      resumeAudio: onResumeAudio,
      startMonitoring: onStartMonitoring,
      resetLaunchingOnFailure: () => setIsLaunchingMonitor(false),
    });
    if (!didStart) {
      console.error("Failed to start monitor from selector");
    }
  };

  return {
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
  };
}
