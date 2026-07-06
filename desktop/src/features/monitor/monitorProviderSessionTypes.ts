import type { MonitorLiveLifecycleLogger } from "./monitorLiveLifecycleRuntime";

export const FILE_ONLY_MONITORING_ERROR =
  "Week 1 MVP only supports file-backed log monitoring. Use an imported log file as the live source.";

export type MonitorProviderSessionLogger = Pick<MonitorLiveLifecycleLogger, "info">;
