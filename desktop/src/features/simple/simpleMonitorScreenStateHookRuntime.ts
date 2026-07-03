import type { BuildSimpleMonitorScreenHookStateArgs } from "./simpleMonitorScreenRuntime";
import type { SimpleMonitorScreenStateInput } from "./useSimpleMonitorScreenState";

export interface SimpleMonitorScreenStateRuntimeInput extends Omit<
  SimpleMonitorScreenStateInput,
  "skin" | "isConsoleExpanded"
> {
  skin: NonNullable<SimpleMonitorScreenStateInput["skin"]>;
  isConsoleExpanded: boolean;
}

export function buildSimpleMonitorScreenStateRuntimeInput(
  input: SimpleMonitorScreenStateInput,
): SimpleMonitorScreenStateRuntimeInput {
  return {
    ...input,
    skin: input.skin ?? "nightfall",
    isConsoleExpanded: input.isConsoleExpanded ?? false,
  };
}

export function buildSimpleMonitorScreenControllerInput(
  input: SimpleMonitorScreenStateRuntimeInput,
): SimpleMonitorScreenStateRuntimeInput {
  return input;
}

export function buildSimpleMonitorScreenStateHookResultInput(
  hookStateArgs: BuildSimpleMonitorScreenHookStateArgs,
): BuildSimpleMonitorScreenHookStateArgs {
  return hookStateArgs;
}
