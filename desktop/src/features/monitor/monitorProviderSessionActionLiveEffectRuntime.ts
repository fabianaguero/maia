import type { RepositoryAnalysis } from "../../types/library";
import type { StartSessionInput } from "../../types/monitor";
import type {
  MonitorProviderAttachSessionSelection,
  UseMonitorProviderSessionActionsInput,
} from "./monitorProviderSessionActionTypes";
import {
  buildAttachMonitorProviderSessionActionInput,
  buildStartMonitorProviderSessionActionInput,
} from "./monitorProviderSessionActionBuilderRuntime";
import {
  attachMonitorProviderSessionState,
  startMonitorProviderSessionState,
} from "./monitorProviderSessionRuntime";

export async function startMonitorProviderSessionAction(input: {
  dependencies: Pick<
    UseMonitorProviderSessionActionsInput,
    "session" | "runtime" | "api" | "logger"
  >;
  repo: RepositoryAnalysis;
  sessionInput: StartSessionInput;
  persistedSessionId?: string;
  replaceExistingSessionIfPresent: () => Promise<void>;
}): Promise<boolean> {
  return startMonitorProviderSessionState(buildStartMonitorProviderSessionActionInput(input));
}

export async function attachMonitorProviderSessionAction(input: {
  dependencies: Pick<UseMonitorProviderSessionActionsInput, "session" | "runtime" | "logger">;
  selection: MonitorProviderAttachSessionSelection;
  replaceExistingSessionIfPresent: () => Promise<void>;
}): Promise<boolean> {
  const { selection, ...rest } = input;

  return attachMonitorProviderSessionState(
    buildAttachMonitorProviderSessionActionInput({
      ...rest,
      sessionRecord: selection.session,
      repoId: selection.repoId,
      repoTitle: selection.repoTitle,
      trackId: selection.trackId,
      trackTitle: selection.trackTitle,
      sourceTemplateId: selection.sourceTemplateId,
      persistedSessionId: selection.persistedSessionId,
    }),
  );
}
