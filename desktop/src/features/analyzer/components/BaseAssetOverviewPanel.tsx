import type { BaseAssetRecord } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";

interface BaseAssetOverviewPanelProps {
  baseAsset: BaseAssetRecord;
}

export function BaseAssetOverviewPanel({ baseAsset }: BaseAssetOverviewPanelProps) {
  const t = useT();
  return (
    <section className="panel waveform-panel">
      <div className="panel-header">
        <div>
          <h2>{t.inspect.baseAssetOverview}</h2>
          <p className="support-copy">{t.inspect.baseAssetOverviewCopy}</p>
        </div>
      </div>

      <div className="repo-hero">
        <div className="repo-hero-card">
          <span>{t.inspect.summary}</span>
          <strong>{baseAsset.summary}</strong>
        </div>
        <div className="repo-hero-card">
          <span>{t.inspect.sourcePath}</span>
          <strong>{baseAsset.sourcePath}</strong>
        </div>
        <div className="repo-hero-card">
          <span>{t.inspect.storagePath}</span>
          <strong>{baseAsset.storagePath}</strong>
        </div>
        <div className="repo-hero-card">
          <span>{t.inspect.tags}</span>
          <div className="pill-strip">
            {baseAsset.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
