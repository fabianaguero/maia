import { getLogger } from "../../utils/logger";
import { DEFAULT_SOURCE_TEMPLATE_ID, resolveSourceTemplate } from "../../config/sourceTemplates";
import {
  ingestStreamChunk,
  pollLogStream,
  pollStreamSession,
  startStreamSession,
  stopStreamSession,
} from "../../api/repositories";
import {
  listSessionEvents,
  updatePersistedSessionCursor,
  updatePersistedSessionStatus,
  insertSessionEvent,
} from "../../api/sessions";
import { createGuideTrackDecodeCache } from "./monitorGuideTrackDecodeRuntime";
import { useMonitorProviderContextValue } from "./useMonitorProviderContextValue";
import {
  buildMonitorProviderStateInput,
} from "./monitorProviderControllerHookRuntime";
import { buildMonitorProviderControllerBootstrap } from "./monitorProviderControllerDependenciesRuntime";
import { buildMonitorProviderControllerContextInput } from "./monitorProviderControllerContextRuntime";
import { useMonitorProviderControllerActions } from "./useMonitorProviderControllerActions";
import { useMonitorProviderState } from "./useMonitorProviderState";

const log = getLogger("MonitorCtx");

export function useMonitorProviderController() {
  const bootstrap = buildMonitorProviderControllerBootstrap({
    defaultSourceTemplateId: DEFAULT_SOURCE_TEMPLATE_ID,
    resolveSourceTemplate,
    createGuideTrackDecodeCache,
    fetchFn: ((...args) => globalThis.fetch(...args)) as typeof fetch,
    insertSessionEvent,
    updatePersistedSessionCursor,
    updatePersistedSessionStatus,
  });
  const state = useMonitorProviderState(buildMonitorProviderStateInput(bootstrap));
  const controllerActions = useMonitorProviderControllerActions(
    {
      state,
      logger: log,
      resolveSourceTemplate,
      decodedAudioCache: bootstrap.decodedAudioCache,
      transport: {
        pollStreamSession,
        pollLogStream,
        ingestStreamChunk,
        fetchText: bootstrap.fetchText,
      },
      sessionApi: {
        startStreamSession,
        stopStreamSession,
        listSessionEvents,
      },
      persistence: bootstrap.persistence,
    },
  );

  return useMonitorProviderContextValue(
    buildMonitorProviderControllerContextInput({
      state,
      logger: log,
      ...controllerActions,
    }),
  );
}
