import type { buildMonitorProviderControllerBootstrap } from "./monitorProviderControllerDependenciesRuntime";

type MonitorProviderControllerBootstrap = ReturnType<
  typeof buildMonitorProviderControllerBootstrap
>;

export function buildMonitorProviderStateInput(
  bootstrap: Pick<MonitorProviderControllerBootstrap, "initialTemplate">,
) {
  return {
    initialTemplate: bootstrap.initialTemplate,
  };
}
