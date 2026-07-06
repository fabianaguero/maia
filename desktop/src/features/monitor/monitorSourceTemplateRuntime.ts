import { resolveSourceTemplate } from "../../config/sourceTemplates";
import type { SourceTemplate } from "../../config/sourceTemplates";
import type { SetSourceTemplateState } from "./monitorStartupRuntimeTypes";

export function applyMonitorSourceTemplateState(input: {
  sourceTemplateId?: string | null;
  activeTemplateRef: { current: SourceTemplate };
  setActiveTemplateState: SetSourceTemplateState;
}): SourceTemplate {
  const resolved = resolveSourceTemplate(input.sourceTemplateId ?? null);
  input.activeTemplateRef.current = resolved;
  input.setActiveTemplateState(resolved);
  return resolved;
}
