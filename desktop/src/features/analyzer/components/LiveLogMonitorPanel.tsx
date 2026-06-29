import { LiveLogMonitorHeader } from "./LiveLogMonitorHeader";
import { LiveLogMonitorLiveDeck } from "./LiveLogMonitorLiveDeck";
import { LiveLogMonitorSetupSection } from "./LiveLogMonitorSetupSection";
import {
  useLiveLogMonitorPanelController,
  type LiveLogMonitorPanelProps,
} from "./useLiveLogMonitorPanelController";

export function LiveLogMonitorPanel(props: LiveLogMonitorPanelProps) {
  const {
    liveEnabled,
    expanded,
    setExpanded,
    ctaMetaLabel,
    headerProps,
    setupProps,
    liveDeckProps,
  } = useLiveLogMonitorPanelController(props);

  if (!expanded && !liveEnabled) {
    return (
      <section className="panel live-monitor-cta">
        <div className="live-monitor-cta-content">
          <div>
            <h2>{headerProps.title}</h2>
            <p className="support-copy">{setupProps.t.inspect.liveMonitorDeckCta}</p>
            <small className="monitor-cta-meta">{ctaMetaLabel}</small>
          </div>
          <button type="button" className="action" onClick={() => setExpanded(true)}>
            {setupProps.t.inspect.liveMonitorDeckOpen}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel waveform-panel">
      <LiveLogMonitorHeader {...headerProps} />
      <LiveLogMonitorSetupSection {...setupProps} />
      <LiveLogMonitorLiveDeck {...liveDeckProps} />
    </section>
  );
}
