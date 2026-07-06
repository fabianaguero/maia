import type { SourceTemplate } from "../../config/sourceTemplates";
import type { MonitorProviderRuntimePersistenceSlice } from "./monitorProviderRuntimeOrchestrationTypes";
import {
  buildMonitorProviderFetchText,
  buildMonitorProviderPersistenceAdapters,
} from "./monitorProviderControllerExternalRuntime";
import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";

export function buildMonitorProviderControllerBootstrap(input: {
  defaultSourceTemplateId: string;
  resolveSourceTemplate: (id: string) => SourceTemplate;
  createGuideTrackDecodeCache: () => Map<string, Promise<GuideTrackPCM>>;
  fetchFn: typeof fetch;
  insertSessionEvent: MonitorProviderRuntimePersistenceSlice["insertSessionEvent"];
  updatePersistedSessionCursor: MonitorProviderRuntimePersistenceSlice["updatePersistedSessionCursor"];
  updatePersistedSessionStatus: MonitorProviderRuntimePersistenceSlice["updatePersistedSessionStatus"];
}) {
  return {
    initialTemplate: input.resolveSourceTemplate(input.defaultSourceTemplateId),
    decodedAudioCache: input.createGuideTrackDecodeCache(),
    fetchText: buildMonitorProviderFetchText(input.fetchFn),
    persistence: buildMonitorProviderPersistenceAdapters({
      insertSessionEvent: input.insertSessionEvent,
      updatePersistedSessionCursor: input.updatePersistedSessionCursor,
      updatePersistedSessionStatus: input.updatePersistedSessionStatus,
    }),
  };
}
