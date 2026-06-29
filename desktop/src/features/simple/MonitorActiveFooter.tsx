import type { MonitorFooterStatusPillViewModel } from "./monitorFooterViewModel";

export interface MonitorActiveFooterProps {
  statusPills: MonitorFooterStatusPillViewModel[];
  audioStatus: AudioContextState;
  audioActionLabel?: string;
  onResumeAudio: () => Promise<void> | void;
}

export function MonitorActiveFooter(props: MonitorActiveFooterProps) {
  return (
    <div className="monitor-footer">
      <div className="monitor-footer__rack">
        <div className="monitor-footer__status">
          {props.statusPills.map((pill) => (
            <span
              key={pill.key}
              className={`monitor-footer__status-pill${pill.tone === "live" ? " is-live" : pill.tone === "muted" ? " is-muted" : ""}`}
            >
              <span className="monitor-footer__status-pill-label">{pill.label}</span>
              <span className="monitor-footer__status-pill-value">{pill.value}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="monitor-footer__actions">
        <button
          className={`monitor-footer__action monitor-footer__action--audio${props.audioStatus === "running" ? " is-live" : ""}`}
          onClick={() => void props.onResumeAudio()}
        >
          {props.audioActionLabel}
        </button>
      </div>
    </div>
  );
}
