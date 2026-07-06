import type { MonitorProviderRuntimePersistenceSlice } from "./monitorProviderRuntimeOrchestrationTypes";

export function buildMonitorProviderFetchText(
  fetchFn: typeof fetch,
): (url: string) => Promise<string> {
  return async (url: string) => {
    const response = await fetchFn(url);
    return response.text();
  };
}

export function buildMonitorProviderPersistenceAdapters(input: {
  insertSessionEvent: MonitorProviderRuntimePersistenceSlice["insertSessionEvent"];
  updatePersistedSessionCursor: MonitorProviderRuntimePersistenceSlice["updatePersistedSessionCursor"];
  updatePersistedSessionStatus: MonitorProviderRuntimePersistenceSlice["updatePersistedSessionStatus"];
}): MonitorProviderRuntimePersistenceSlice {
  return {
    updatePersistedSessionCursor: input.updatePersistedSessionCursor,
    insertSessionEvent: async (payload) => {
      await input.insertSessionEvent(payload);
    },
    updatePersistedSessionStatus: input.updatePersistedSessionStatus,
  };
}
