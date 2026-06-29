import type { InspectTrackMetadataDetailViewModel } from "./inspectTrackViewRuntime";

interface InspectTrackMetadataPanelProps {
  notesSummaryLabel: string;
  noteItems: string[];
  details: InspectTrackMetadataDetailViewModel[];
}

export function InspectTrackMetadataPanel({
  notesSummaryLabel,
  noteItems,
  details,
}: InspectTrackMetadataPanelProps) {
  return (
    <section className="panel metric-panel">
      <details className="panel-collapsible">
        <summary className="panel-collapsible-summary">{notesSummaryLabel}</summary>
        <div className="panel-collapsible-body">
          {noteItems.length > 0 ? (
            <ul className="stack-list note-list">
              {noteItems.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
          <dl className="meta-list compact-meta">
            {details.map((detail) => (
              <div key={detail.key}>
                <dt>{detail.label}</dt>
                <dd>{detail.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </details>
    </section>
  );
}
