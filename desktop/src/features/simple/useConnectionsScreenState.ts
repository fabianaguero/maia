import {
  pollStreamSession,
  startLogSourceConnection,
  stopStreamSession,
} from "../../api/repositories";
import type { AppTranslations } from "../../i18n/types";
import { buildConnectionsScreenControllerState } from "./connectionsScreenControllerRuntime";
import {
  buildConnectionsScreenFormControllerInput,
  buildConnectionsScreenTailControllerInput,
  buildConnectionsScreenTestControllerInput,
} from "./connectionsScreenStateHookRuntime";
import { useConnectionTailController } from "./useConnectionTailController";
import { useConnectionTestController } from "./useConnectionTestController";
import { useConnectionsFormController } from "./useConnectionsFormController";

export function useConnectionsScreenState(input: {
  t: AppTranslations;
  defaultCloudLookback: string;
}) {
  const formController = useConnectionsFormController(
    buildConnectionsScreenFormControllerInput({
      t: input.t,
      defaultCloudLookback: input.defaultCloudLookback,
    }),
  );
  const tailController = useConnectionTailController(
    buildConnectionsScreenTailControllerInput({
      t: input.t,
      setError: formController.setError,
      pollStreamSession,
      startLogSourceConnection,
      stopStreamSession,
    }),
  );
  const testController = useConnectionTestController(
    buildConnectionsScreenTestControllerInput({
      t: input.t,
      setError: formController.setError,
      startLogSourceConnection,
      pollStreamSession,
      stopStreamSession,
    }),
  );

  return buildConnectionsScreenControllerState({
    t: input.t,
    form: formController,
    tail: tailController,
    test: testController,
  });
}
