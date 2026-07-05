import type { LiveLogStreamUpdate } from "../../types/monitor";
import { type applyMonitorLiveStreamSubscriptionResult } from "./monitorLiveStreamSubscriptionApplyRuntime";
import { type applyMonitorLiveStreamSubscriptionUpdate } from "./monitorLiveStreamSubscriptionRuntime";
import {
  buildMonitorLiveStreamSubscriptionApplyResultInput,
  buildMonitorLiveStreamSubscriptionUpdateInput,
} from "./monitorLiveStreamSubscriptionRefRuntime";
import type { UseMonitorLiveStreamSubscriptionInput } from "./monitorLiveStreamSubscriptionTypes";

export interface MonitorLiveStreamSubscriptionListenerDependencies {
  input: UseMonitorLiveStreamSubscriptionInput;
  now: () => number;
  applyUpdate: typeof applyMonitorLiveStreamSubscriptionUpdate;
  applyResult: typeof applyMonitorLiveStreamSubscriptionResult;
}

export function buildMonitorLiveStreamSubscriptionListener(
  dependencies: MonitorLiveStreamSubscriptionListenerDependencies,
): (update: LiveLogStreamUpdate) => void {
  return (update) => {
    const nowMs = dependencies.now();
    const result = dependencies.applyUpdate(
      buildMonitorLiveStreamSubscriptionUpdateInput({
        subscription: dependencies.input,
        update,
        nowMs,
      }),
    );

    dependencies.applyResult(
      buildMonitorLiveStreamSubscriptionApplyResultInput({
        subscription: dependencies.input,
        result,
        nowMs,
      }),
    );
  };
}
