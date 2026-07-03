import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";

export interface UseMonitorProviderReplayPlaybackRuntimeInput {
  input: UseMonitorProviderRuntimeOrchestrationInput;
  emitUpdate: (
    update: LiveLogStreamUpdate,
    options?: {
      accumulateMetrics?: boolean;
      persistPlaybackEvent?: boolean;
    },
  ) => void;
  syncReplayTelemetry: (processedEvents: number) => void;
  syncGuideTrackToReplayProgress: (progress: number) => void;
}
