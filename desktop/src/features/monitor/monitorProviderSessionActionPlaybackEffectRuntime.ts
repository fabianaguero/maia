import type { PlaybackSessionSelection } from "./monitorPlaybackRuntime";
import { buildMonitorProviderPlaybackSessionInput } from "./monitorProviderPlaybackSessionControllerRuntime";
import { startMonitorProviderPlaybackSessionState } from "./monitorProviderPlaybackSessionRuntime";
import type { UseMonitorProviderSessionActionsInput } from "./monitorProviderSessionActionTypes";

export async function startMonitorProviderPlaybackSessionAction(input: {
  dependencies: UseMonitorProviderSessionActionsInput;
  selection: PlaybackSessionSelection;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
}): Promise<boolean> {
  return startMonitorProviderPlaybackSessionState(buildMonitorProviderPlaybackSessionInput(input));
}
