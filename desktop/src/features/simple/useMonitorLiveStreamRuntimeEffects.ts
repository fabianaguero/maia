import type {
  MonitorLiveStreamControllerRefs,
  MonitorLiveStreamControllerSetters,
  MonitorLiveStreamControllerState,
} from "./monitorLiveStreamControllerTypes";
import {
  buildMonitorLiveStreamIdleMotionControllerInput,
  buildMonitorLiveStreamLifecycleControllerInput,
  buildMonitorLiveStreamSubscriptionControllerInput,
} from "./monitorLiveStreamControllerInputRuntime";
import { useMonitorLiveStreamIdleMotion } from "./useMonitorLiveStreamIdleMotion";
import { useMonitorLiveStreamLifecycle } from "./useMonitorLiveStreamLifecycle";
import { useMonitorLiveStreamSubscription } from "./useMonitorLiveStreamSubscription";

export function useMonitorLiveStreamRuntimeEffects(input: {
  state: MonitorLiveStreamControllerState;
  refs: MonitorLiveStreamControllerRefs;
  setters: MonitorLiveStreamControllerSetters;
}) {
  useMonitorLiveStreamLifecycle(
    buildMonitorLiveStreamLifecycleControllerInput({
      state: input.state,
      refs: input.refs,
      setters: input.setters,
    }),
  );

  useMonitorLiveStreamSubscription(
    buildMonitorLiveStreamSubscriptionControllerInput({
      state: input.state,
      refs: input.refs,
      setters: input.setters,
    }),
  );

  useMonitorLiveStreamIdleMotion(
    buildMonitorLiveStreamIdleMotionControllerInput({
      state: input.state,
      refs: input.refs,
      setters: input.setters,
    }),
  );
}
