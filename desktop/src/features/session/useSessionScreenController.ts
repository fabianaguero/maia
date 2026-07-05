import { useT } from "../../i18n/I18nContext";
import { useMonitor } from "../monitor/MonitorContext";
import {
  buildSessionScreenControllerHookResult,
  buildSessionScreenControllerMonitorSnapshot,
} from "./sessionScreenControllerHookRuntime";
import { buildSessionScreenControllerState } from "./sessionScreenControllerRuntime";
import {
  buildSessionScreenControllerStateFromSlices,
  buildSessionScreenControllerMonitorSnapshotInput,
  buildSessionScreenControllerSlicesInput,
} from "./sessionScreenControllerStateRuntime";
import type { SessionScreenControllerInput } from "./sessionScreenControllerTypes";
import { useSessionScreenLocalState } from "./useSessionScreenLocalState";
import { useSessionScreenControllerSlices } from "./useSessionScreenControllerSlices";

export function useSessionScreenController(input: SessionScreenControllerInput) {
  const t = useT();
  const monitor = useMonitor();
  const monitorSnapshot = buildSessionScreenControllerMonitorSnapshot(
    buildSessionScreenControllerMonitorSnapshotInput(monitor),
  );
  const localState = useSessionScreenLocalState({
    trackCount: input.tracks.length,
  });

  const slicesResult = useSessionScreenControllerSlices(
    buildSessionScreenControllerSlicesInput({
      t,
      controllerInput: input,
      monitorSnapshot,
      localState,
    }),
  );

  return buildSessionScreenControllerHookResult(
    buildSessionScreenControllerState(
      buildSessionScreenControllerStateFromSlices({
        t,
        monitor,
        localState,
        slicesResult,
      }),
    ),
  );
}
