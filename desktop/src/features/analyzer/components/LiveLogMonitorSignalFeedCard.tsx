import type { LiveLogMonitorLaunchPanelProps } from "./liveLogMonitorLaunchPanelTypes";

type Props = Pick<
  LiveLogMonitorLaunchPanelProps,
  | "adapterKind"
  | "adapterLabel"
  | "adapterDescription"
  | "adapterTarget"
  | "fileTailLabel"
  | "labels"
  | "onChangeAdapterKind"
>;

export function LiveLogMonitorSignalFeedCard({
  adapterKind,
  adapterLabel,
  adapterDescription,
  adapterTarget,
  fileTailLabel,
  labels,
  onChangeAdapterKind,
}: Props) {
  return (
    <div className="audio-path-card monitor-setup-card">
      <span>{labels.signalFeedTitle}</span>
      <strong>{adapterLabel}</strong>
      <p className="support-copy">{adapterDescription}</p>
      <div className="monitor-setup-stack">
        <select
          className="compact-select"
          value={adapterKind}
          onChange={(event) => onChangeAdapterKind(event.target.value)}
          disabled
        >
          <option value="file">{fileTailLabel}</option>
        </select>
        <p className="support-copy">{labels.weekOnePipeline}</p>
        <div className="monitor-source-summary">
          <small>{labels.targetLabel}</small>
          <strong>{adapterTarget}</strong>
        </div>
      </div>
    </div>
  );
}
