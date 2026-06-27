import { useEffect, useMemo, useState } from "react";

import { listLogSourceConnections } from "../../api/repositories";
import type { RepositoryAnalysis } from "../../types/library";
import type { LogSourceConnection } from "../../types/monitor";
import {
  buildMonitorSourceSelectionModel,
  shouldResetSelectedSource,
  type MonitorSourceCopy,
  type MonitorSourceFilter,
} from "./monitorSourceOptions";

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
  const [persistentConnections, setPersistentConnections] = useState<LogSourceConnection[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [sourceFilter, setSourceFilter] = useState<MonitorSourceFilter>("all");
  const [isLaunchingMonitor, setIsLaunchingMonitor] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const nextConnections = await listLogSourceConnections();
        if (!cancelled) {
          setPersistentConnections(Array.isArray(nextConnections) ? nextConnections : []);
        }
      } catch {
        if (!cancelled) {
          setPersistentConnections([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      shouldResetSelectedSource(
        selectedSourceId,
        selectionModel.selectedSourceOption,
        sourceFilter,
      )
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
