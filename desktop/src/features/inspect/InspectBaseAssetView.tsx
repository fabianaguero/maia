import type { BaseAssetRecord } from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { useT } from "../../i18n/I18nContext";
import { BaseAssetMetricsPanel } from "../analyzer/components/BaseAssetMetricsPanel";
import { BaseAssetOverviewPanel } from "../analyzer/components/BaseAssetOverviewPanel";

interface InspectBaseAssetViewProps {
  baseAsset: BaseAssetRecord;
  analyzerLabel: string;
  contextBar: React.ReactNode;
  onGoCompose: () => void;
}

export function InspectBaseAssetView({
  baseAsset,
  analyzerLabel,
  contextBar,
  onGoCompose,
}: InspectBaseAssetViewProps) {
  const t = useT();

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{t.inspect.title}</p>
          <h2>{baseAsset.title}</h2>
          <p className="support-copy">{t.inspect.baseAssetCopy}</p>
        </div>
        <div className="screen-summary">
          <div className="summary-pill">
            <span>{t.inspect.category}</span>
            <strong>{baseAsset.categoryLabel}</strong>
          </div>
          <div className="summary-pill">
            <span>{t.inspect.reusable}</span>
            <strong>{baseAsset.reusable ? t.inspect.yes : t.inspect.singleUse}</strong>
          </div>
          <div className="summary-pill">
            <span>{t.inspect.imported}</span>
            <strong>{formatShortDate(baseAsset.importedAt)}</strong>
          </div>
        </div>
      </header>
      {contextBar}

      <div className="analyzer-layout">
        <BaseAssetOverviewPanel baseAsset={baseAsset} />
        <div className="analyzer-sidebar">
          <BaseAssetMetricsPanel baseAsset={baseAsset} analyzerLabel={analyzerLabel} />
          <section className="panel metric-panel">
            <details className="panel-collapsible">
              <summary className="panel-collapsible-summary">{t.inspect.notesMetadata}</summary>
              <div className="panel-collapsible-body">
                {baseAsset.notes.length > 0 && (
                  <ul className="stack-list note-list">
                    {baseAsset.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                )}
                <dl className="meta-list compact-meta">
                  <div>
                    <dt>{t.inspect.sourcePath}</dt>
                    <dd>{baseAsset.sourcePath}</dd>
                  </div>
                  <div>
                    <dt>{t.inspect.storagePath}</dt>
                    <dd>{baseAsset.storagePath}</dd>
                  </div>
                  <div>
                    <dt>{t.inspect.checksum}</dt>
                    <dd>{baseAsset.checksum ?? t.inspect.pending}</dd>
                  </div>
                </dl>
              </div>
            </details>
          </section>
          <div className="inspect-compose-cta">
            <p className="support-copy">{t.inspect.useBaseAsset}</p>
            <button type="button" className="action" onClick={onGoCompose}>
              {t.inspect.composeCta}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
