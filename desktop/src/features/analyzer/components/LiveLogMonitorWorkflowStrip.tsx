interface WorkflowStep {
  label: string;
  active?: boolean;
}

interface LiveLogMonitorWorkflowStripProps {
  steps: WorkflowStep[];
}

export function LiveLogMonitorWorkflowStrip({ steps }: LiveLogMonitorWorkflowStripProps) {
  return (
    <div className="workflow-strip" aria-hidden="true">
      {steps.map((step, index) => (
        <div key={`${step.label}-${index}`} className="workflow-step-wrap">
          <span className={`workflow-step${step.active ? " active" : ""}`}>{step.label}</span>
          {index < steps.length - 1 ? <span className="workflow-arrow">→</span> : null}
        </div>
      ))}
    </div>
  );
}
