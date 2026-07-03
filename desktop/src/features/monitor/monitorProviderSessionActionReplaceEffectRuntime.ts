import type { UseMonitorProviderSessionActionsInput } from "./monitorProviderSessionActionTypes";
import { buildReplaceExistingMonitorProviderSessionInput } from "./monitorProviderSessionActionBuilderRuntime";
import { replaceExistingMonitorSessionIfPresent } from "./monitorProviderStartRuntime";

export async function replaceExistingMonitorProviderSessionState(
  input: Pick<UseMonitorProviderSessionActionsInput, "session" | "runtime" | "api">,
): Promise<void> {
  await replaceExistingMonitorSessionIfPresent(
    buildReplaceExistingMonitorProviderSessionInput(input),
  );
}
