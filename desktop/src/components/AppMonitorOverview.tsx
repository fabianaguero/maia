import { MonitorWaveformBar } from "./MonitorWaveformBar";
import { buildAppMonitorOverviewState, type AppShellUserMode } from "../appShellRuntime";
import type { MonitorMetrics } from "../features/monitor/monitorContextTypes";
import type { LibraryTrack } from "../types/library";

interface AppMonitorOverviewProps {
  userMode: AppShellUserMode;
  selectedItemTitle: string | null;
  screenLabel: string;
  detailDeckLabel: string;
  liveLabel: string;
  hasMonitorSession: boolean;
  monitorMetrics: MonitorMetrics;
  anomalyLabel: string;
  tracks: LibraryTrack[];
}

export function AppMonitorOverview({
  userMode,
  selectedItemTitle,
  screenLabel,
  detailDeckLabel,
  liveLabel,
  hasMonitorSession,
  monitorMetrics,
  anomalyLabel,
  tracks,
}: AppMonitorOverviewProps) {
  const state = buildAppMonitorOverviewState({
    userMode,
    selectedItemTitle,
    hasMonitorSession,
    totalAnomalies: monitorMetrics.totalAnomalies,
    anomalyLabel,
  });

  if (!state.show || !state.selectedItemTitle) {
    return null;
  }

  return (
    <section className="waveform-section">
      <div className="waveform-header">
        <div>
          <p className="waveform-label">{screenLabel}</p>
          <h3 className="waveform-track-title">{state.selectedItemTitle}</h3>
        </div>
        <div className="status-pills">
          <div className="status-pill">
            <span>{screenLabel}</span>
            <strong>{detailDeckLabel}</strong>
          </div>
          {state.showLiveStatus && state.anomalyCountLabel ? (
            <div className="status-pill status-pill--live">
              <span>{liveLabel}</span>
              <strong>{state.anomalyCountLabel}</strong>
            </div>
          ) : null}
        </div>
      </div>
      <MonitorWaveformBar tracks={tracks} />
    </section>
  );
}
