import { buildLiveLogMonitorPanelRenderState } from "./liveLogMonitorPanelRenderState";
import {
  buildLiveLogMonitorDeckModelInput,
  buildLiveLogMonitorOperatorActionsInput,
  buildLiveLogMonitorPanelRenderStateInput,
  buildLiveLogMonitorSessionActionsInput,
} from "./liveLogMonitorPanelDeckRuntimeBridge";
import { useLiveLogMonitorDeckModel } from "./useLiveLogMonitorDeckModel";
import { useLiveLogMonitorOperatorActions } from "./useLiveLogMonitorOperatorActions";
import { useLiveLogMonitorSessionActions } from "./useLiveLogMonitorSessionActions";
import type { UseLiveLogMonitorPanelDeckRuntimeInput } from "./useLiveLogMonitorPanelDeckRuntime";

type SessionActionsState = ReturnType<typeof useLiveLogMonitorSessionActions>;
type OperatorActionsState = ReturnType<typeof useLiveLogMonitorOperatorActions>;
type DeckModelState = ReturnType<typeof useLiveLogMonitorDeckModel>;

export function buildLiveLogMonitorPanelDeckRuntimeState(
  input: UseLiveLogMonitorPanelDeckRuntimeInput,
  state: {
    sessionActions: SessionActionsState;
    operatorActions: OperatorActionsState;
    liveDeckProps: DeckModelState;
  },
) {
  return buildLiveLogMonitorPanelRenderState(
    buildLiveLogMonitorPanelRenderStateInput(input, state.liveDeckProps, state.sessionActions),
  );
}

export function useLiveLogMonitorPanelDeckHookState(input: UseLiveLogMonitorPanelDeckRuntimeInput) {
  const sessionActions = useLiveLogMonitorSessionActions(
    buildLiveLogMonitorSessionActionsInput(input),
  );
  const operatorActions = useLiveLogMonitorOperatorActions(
    buildLiveLogMonitorOperatorActionsInput(input),
  );
  const liveDeckProps = useLiveLogMonitorDeckModel(
    buildLiveLogMonitorDeckModelInput(input, operatorActions),
  );

  return {
    sessionActions,
    operatorActions,
    liveDeckProps,
  };
}
