import type { CompositionResultRecord } from "../../../types/library";

interface CompositionOverviewPanelProps {
  composition: CompositionResultRecord;
}

function arrangementPlan(metrics: Record<string, unknown>): string[] {
  const raw = metrics.arrangementPlan;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((entry): entry is string => typeof entry === "string");
}

export function CompositionOverviewPanel({
  composition,
}: CompositionOverviewPanelProps) {
  const plan = arrangementPlan(composition.metrics);

  return (
    <section className="panel waveform-panel">
      <div className="panel-header compact">
        <div>
          <h2>Composition overview</h2>
          <p className="support-copy">
            Local arrangement plan derived from the selected reusable base and timing reference.
          </p>
        </div>
      </div>

      <div className="repo-hero">
        <div className="repo-hero-card">
          <span>Summary</span>
          <strong>{composition.summary}</strong>
        </div>
      </div>

      <dl className="meta-list top-spaced">
        <div>
          <dt>Base asset</dt>
          <dd>{composition.baseAssetTitle}</dd>
        </div>
        <div>
          <dt>Reference</dt>
          <dd>{composition.referenceTitle}</dd>
        </div>
        <div>
          <dt>Strategy</dt>
          <dd>{composition.strategy}</dd>
        </div>
        <div>
          <dt>Base source path</dt>
          <dd>{composition.sourcePath}</dd>
        </div>
        <div>
          <dt>Plan snapshot</dt>
          <dd>{composition.exportPath ?? "Pending materialization"}</dd>
        </div>
      </dl>

      {plan.length > 0 ? (
        <>
          <div className="panel-header compact top-spaced">
            <div>
              <h2>Arrangement plan</h2>
              <p className="support-copy">
                Deterministic steps returned by the analyzer planner.
              </p>
            </div>
          </div>
          <ul className="stack-list">
            {plan.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
