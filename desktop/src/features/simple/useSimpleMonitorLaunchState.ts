import { useCallback, useState } from "react";
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
  const [selectedCodeProjectId, setSelectedCodeProjectId] = useState("");
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
    allMonitorSourceOptions,
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
  const codeProjectSourceOptions = (allMonitorSourceOptions ?? []).filter(
    (source) => source.origin === "codeProject",
  );
  const selectedCodeProjectOption =
    codeProjectSourceOptions.find((source) => source.id === selectedCodeProjectId) ?? null;
  const setExclusiveSourceId = useCallback(
    (value: string | ((previous: string) => string)) => {
      setSelectedSourceId((previous) => {
        const next = typeof value === "function" ? value(previous) : value;
        if (next) {
          setSelectedCodeProjectId("");
        }
        return next;
      });
    },
    [setSelectedSourceId],
  );
  const setExclusiveCodeProjectId = useCallback(
    (value: string | ((previous: string) => string)) => {
      setSelectedCodeProjectId((previous) => {
        const next = typeof value === "function" ? value(previous) : value;
        if (next) {
          setSelectedSourceId("");
        }
        return next;
      });
    },
    [setSelectedSourceId],
  );
  const effectiveSelectedSourceOption = selectedCodeProjectOption ?? selectedSourceOption;
  const effectiveCanStartSelectedSource = selectedCodeProjectOption
    ? Boolean(selectedCodeProjectOption.startable)
    : canStartSelectedSource;
  const effectiveStartHint =
    selectedCodeProjectOption && !selectedCodeProjectOption.startable
      ? t.simpleMode.setup.startHintCodeNotConfigured
      : selectedCodeProjectOption && selectedSoundId
        ? t.simpleMode.setup.startHintReady
        : startHint;

  const handleStartMonitoringRequest = async () => {
    const didStart = await executeSimpleMonitorStartRequest(
      buildSimpleMonitorStartRequestInput({
        selector: {
          selectedSourceOption: effectiveSelectedSourceOption,
          canStartSelectedSource: effectiveCanStartSelectedSource,
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
    codeProjectSourceOptions,
    selectedCodeProjectId,
    setSelectedCodeProjectId: setExclusiveCodeProjectId,
    allMonitorSourceOptions,
    filteredMonitorSourceOptions,
    selectedSourceOption,
    canStartSelectedSource: effectiveCanStartSelectedSource,
    sourceEmptyMessage,
    startHint: effectiveStartHint,
    selectedSourceId,
    setSelectedSourceId: setExclusiveSourceId,
    sourceFilter,
    setSourceFilter,
    isLaunchingMonitor,
    handleStartMonitoringRequest,
    setIsLaunchingMonitor,
  });
}
