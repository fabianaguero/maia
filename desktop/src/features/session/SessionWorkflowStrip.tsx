import { useT } from "../../i18n/I18nContext";

interface SessionWorkflowStripProps {
  baseReady: boolean;
  sourceReady: boolean;
}

export function SessionWorkflowStrip({
  baseReady,
  sourceReady,
}: SessionWorkflowStripProps) {
  const t = useT();

  return (
    <div className="workflow-strip" aria-hidden="true">
      <div className="workflow-step-wrap">
        <span className={`workflow-step${baseReady ? " active" : ""}`}>
          {t.session.workflowBase}
        </span>
        <span className="workflow-arrow">→</span>
      </div>
      <div className="workflow-step-wrap">
        <span className={`workflow-step${sourceReady ? " active" : ""}`}>
          {t.session.workflowSource}
        </span>
        <span className="workflow-arrow">→</span>
      </div>
      <div className="workflow-step-wrap">
        <span className="workflow-step active">{t.session.workflowName}</span>
        <span className="workflow-arrow">→</span>
      </div>
      <div className="workflow-step-wrap">
        <span className="workflow-step">{t.session.workflowRun}</span>
      </div>
    </div>
  );
}
