import type { MonitorLiveLifecycleLogger } from "./monitorLiveLifecycleRuntime";

export const FILE_ONLY_MONITORING_ERROR =
  "This source adapter cannot run as a live monitor session. Use a file log or CodeProject source.";

export type MonitorProviderSessionLogger = Pick<MonitorLiveLifecycleLogger, "info">;
