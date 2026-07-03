import {
  buildAppV0MonitorScreenStateInput,
  buildAppV0ScreenModelInput,
} from "./appV0ContentModelRuntime";
import { useAppV0MonitorScreenState } from "./useAppV0MonitorScreenState";
import { useAppV0DomainState } from "./useAppV0DomainState";
import { useAppV0ScreenModel } from "./useAppV0ScreenModel";

export function useAppV0ContentModel() {
  const domainState = useAppV0DomainState();

  const monitorState = useAppV0MonitorScreenState(buildAppV0MonitorScreenStateInput(domainState));

  const { screenModel } = useAppV0ScreenModel(
    buildAppV0ScreenModelInput(domainState, monitorState),
  );

  return { screenModel, t: monitorState.t };
}
