import { useEffect, useMemo, useState } from "react";

import type { RepositoryAnalysis } from "../../types/library";
import {
  buildMonitorSourceSelectionModel,
  shouldResetSelectedSource,
  type MonitorSourceCopy,
  type MonitorSourceFilter,
} from "./monitorSourceOptions";
import { usePersistentLogSourceConnections } from "./usePersistentLogSourceConnections";

export interface UseSimpleMonitorSourceSelectorInput {
  repositories: RepositoryAnalysis[];
  selectedSoundId: string;
  isListening: boolean;
  copy: MonitorSourceCopy;
}

export function useSimpleMonitorSourceSelector({
  repositories,
  selectedSoundId,
  isListening,
  copy,
}: UseSimpleMonitorSourceSelectorInput) {
  const persistentConnections = usePersistentLogSourceConnections();
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [sourceFilter, setSourceFilter] = useState<MonitorSourceFilter>("all");
  const [isLaunchingMonitor, setIsLaunchingMonitor] = useState(false);

  useEffect(() => {
    if (isListening) {
      setIsLaunchingMonitor(false);
    }
  }, [isListening]);

  const selectionModel = useMemo(
    () =>
      buildMonitorSourceSelectionModel({
        repositories,
        persistentConnections,
        selectedSourceId,
        selectedSoundId,
        sourceFilter,
        copy,
      }),
    [repositories, persistentConnections, selectedSourceId, selectedSoundId, sourceFilter, copy],
  );

  useEffect(() => {
    if (
      shouldResetSelectedSource(selectedSourceId, selectionModel.selectedSourceOption, sourceFilter)
    ) {
      setSelectedSourceId("");
    }
  }, [selectedSourceId, selectionModel.selectedSourceOption, sourceFilter]);

  return {
    persistentConnections,
    selectedSourceId,
    setSelectedSourceId,
    sourceFilter,
    setSourceFilter,
    isLaunchingMonitor,
    setIsLaunchingMonitor,
    ...selectionModel,
  };
}
