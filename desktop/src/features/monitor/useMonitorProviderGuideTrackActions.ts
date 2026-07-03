import type { SourceTemplate } from "../../config/sourceTemplates";
import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";
import type {
  MonitorProviderOrchestrationControllerState,
  MonitorProviderSessionControllerState,
} from "./monitorProviderControllerStateTypes";
import { buildMonitorProviderGuideTrackInput } from "./monitorProviderControllerViewRuntime";
import type { MonitorProviderGuideTrackLogger } from "./monitorProviderGuideTrackTypes";
import { useMonitorProviderGuideTrack } from "./useMonitorProviderGuideTrack";

interface UseMonitorProviderGuideTrackActionsInput {
  state: MonitorProviderOrchestrationControllerState & MonitorProviderSessionControllerState;
  logger: MonitorProviderGuideTrackLogger;
  resolveSourceTemplate: (id: string) => SourceTemplate;
  decodedAudioCache: Map<string, Promise<GuideTrackPCM>>;
}

export function useMonitorProviderGuideTrackActions(
  input: UseMonitorProviderGuideTrackActionsInput,
) {
  return useMonitorProviderGuideTrack(
    buildMonitorProviderGuideTrackInput({
      state: input.state,
      resolveSourceTemplate: input.resolveSourceTemplate,
      decodedAudioCache: input.decodedAudioCache,
      logger: input.logger,
    }),
  );
}
