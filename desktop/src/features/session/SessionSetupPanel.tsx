import { useT } from "../../i18n/I18nContext";
import { SessionCreateFooter } from "./SessionCreateFooter";
import { SessionSetupSelectionGrid } from "./SessionSetupSelectionGrid";
import { SessionTemplatePresetStrip } from "./SessionTemplatePresetStrip";
import { SessionWorkflowStrip } from "./SessionWorkflowStrip";
import { buildSessionSetupPanelSections } from "./sessionSetupPanelRuntime";
import type { SessionSetupPanelProps } from "./sessionSetupPanelTypes";

export function SessionSetupPanel({ ...props }: SessionSetupPanelProps) {
  const t = useT();
  const sections = buildSessionSetupPanelSections({
    ...props,
    t,
  });

  return (
    <section className="panel session-form-panel">
      <div className="panel-header">
        <h3>{sections.header.title}</h3>
        <p className="support-copy">{sections.header.summary}</p>
      </div>

      <SessionTemplatePresetStrip {...sections.templateStripProps} />

      <SessionWorkflowStrip {...sections.workflowProps} />

      <SessionSetupSelectionGrid {...sections.selectionGridProps} />

      <SessionCreateFooter {...sections.createFooterProps} />
    </section>
  );
}
