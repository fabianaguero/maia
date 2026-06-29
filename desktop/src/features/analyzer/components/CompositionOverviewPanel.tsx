import type { CompositionResultRecord } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";

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

export function CompositionOverviewPanel({ composition }: CompositionOverviewPanelProps) {
  const t = useT();
  const plan = arrangementPlan(composition.metrics);

  return (
    <section className="panel waveform-panel">
      <div className="panel-header compact">
        <div>
          <h2>{t.compose.compositionOverview}</h2>
          <p className="support-copy">{t.compose.compositionOverviewCopy}</p>
        </div>
      </div>

      <div className="repo-hero">
        <div className="repo-hero-card">
          <span>{t.compose.summary}</span>
          <strong>{composition.summary}</strong>
        </div>
      </div>

      <dl className="meta-list top-spaced">
        <div>
          <dt>{t.compose.baseAsset}</dt>
          <dd>{composition.baseAssetTitle}</dd>
        </div>
        <div>
          <dt>{t.compose.timingSource}</dt>
          <dd>{composition.referenceTitle}</dd>
        </div>
        <div>
          <dt>{t.compose.strategy}</dt>
          <dd>{composition.strategy}</dd>
        </div>
        <div>
          <dt>{t.compose.baseSourcePath}</dt>
          <dd>{composition.sourcePath}</dd>
        </div>
        <div>
          <dt>{t.compose.planSnapshot}</dt>
          <dd>{composition.exportPath ?? t.compose.pendingMaterialization}</dd>
        </div>
      </dl>

      {plan.length > 0 ? (
        <>
          <div className="panel-header compact top-spaced">
            <div>
              <h2>{t.compose.arrangementPlan}</h2>
              <p className="support-copy">{t.compose.arrangementPlanCopy}</p>
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
