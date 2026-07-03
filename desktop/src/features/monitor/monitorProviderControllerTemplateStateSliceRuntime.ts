import type { SourceTemplate } from "../../config/sourceTemplates";
import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";

export function buildMonitorProviderRuntimeTemplateSlice(input: {
  activeTemplateRef: React.MutableRefObject<SourceTemplate>;
  setActiveTemplateState: React.Dispatch<React.SetStateAction<SourceTemplate>>;
  buildReloadPendingGuideTrack: (reason: "session-start" | "attach-session") => () => void;
}): UseMonitorProviderRuntimeOrchestrationInput["template"] {
  return {
    activeTemplateRef: input.activeTemplateRef,
    setActiveTemplateState: input.setActiveTemplateState,
    buildReloadPendingGuideTrack: input.buildReloadPendingGuideTrack,
  };
}
