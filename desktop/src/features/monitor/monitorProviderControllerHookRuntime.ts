import type { buildMonitorProviderControllerBootstrap } from "./monitorProviderControllerDependenciesRuntime";
import type { buildMonitorProviderControllerContextInput } from "./monitorProviderControllerContextRuntime";
import type { UseMonitorProviderControllerActionsInput } from "./monitorProviderControllerActionsRuntime";
import type { useMonitorProviderControllerActions } from "./useMonitorProviderControllerActions";
import type { useMonitorProviderState } from "./useMonitorProviderState";

type MonitorProviderState = ReturnType<typeof useMonitorProviderState>;
type MonitorProviderControllerBootstrap = ReturnType<typeof buildMonitorProviderControllerBootstrap>;
type MonitorProviderControllerActions = ReturnType<typeof useMonitorProviderControllerActions>;

export function buildMonitorProviderStateInput(
  bootstrap: Pick<MonitorProviderControllerBootstrap, "initialTemplate">,
) {
  return {
    initialTemplate: bootstrap.initialTemplate,
  };
}

export function buildMonitorProviderActionsInput(input: {
  state: MonitorProviderState;
  logger: Parameters<typeof buildMonitorProviderControllerContextInput>[0]["logger"];
  resolveSourceTemplate: UseMonitorProviderControllerActionsInput["resolveSourceTemplate"];
  decodedAudioCache: MonitorProviderControllerBootstrap["decodedAudioCache"];
  transport: UseMonitorProviderControllerActionsInput["transport"] & {
    fetchText: MonitorProviderControllerBootstrap["fetchText"];
  };
  sessionApi: UseMonitorProviderControllerActionsInput["sessionApi"];
  persistence: MonitorProviderControllerBootstrap["persistence"];
}): UseMonitorProviderControllerActionsInput {
  return input;
}

export function buildMonitorProviderControllerResult(input: {
  contextInput: ReturnType<typeof buildMonitorProviderControllerContextInput>;
  controllerActions: MonitorProviderControllerActions;
}) {
  return {
    contextInput: input.contextInput,
    controllerActions: input.controllerActions,
  };
}
