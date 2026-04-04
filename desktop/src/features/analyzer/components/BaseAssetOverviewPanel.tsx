import type { BaseAssetRecord } from "../../../types/library";

interface BaseAssetOverviewPanelProps {
  baseAsset: BaseAssetRecord;
}

export function BaseAssetOverviewPanel({
  baseAsset,
}: BaseAssetOverviewPanelProps) {
  return (
    <section className="panel waveform-panel">
      <div className="panel-header">
        <div>
          <h2>Base asset overview</h2>
          <p className="support-copy">
            Reusable source material registered in the local catalog for future
            composition and pattern workflows.
          </p>
        </div>
      </div>

      <div className="repo-hero">
        <div className="repo-hero-card">
          <span>Summary</span>
          <strong>{baseAsset.summary}</strong>
        </div>
        <div className="repo-hero-card">
          <span>Source path</span>
          <strong>{baseAsset.sourcePath}</strong>
        </div>
        <div className="repo-hero-card">
          <span>Storage path</span>
          <strong>{baseAsset.storagePath}</strong>
        </div>
        <div className="repo-hero-card">
          <span>Tags</span>
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
