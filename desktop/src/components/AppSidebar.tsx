import type { BootstrapManifest } from "../contracts";
import type { ActiveMonitorSession, MonitorMetrics } from "../features/monitor/MonitorContext";
import type { AppScreen } from "../types/library";

interface AppSidebarProps {
  currentScreen: AppScreen;
  onScreenChange: (screen: AppScreen) => void;
  trackCount: number;
  repositoryCount: number;
  baseAssetCount: number;
  compositionCount: number;
  selectedItemTitle: string | null;
  manifest: BootstrapManifest | null;
  analyzerLabel: string;
  monitorSession: ActiveMonitorSession | null;
  monitorMetrics: MonitorMetrics;
  onStopMonitor: () => void;
  onOpenMonitoredRepo: () => void;
}

const navigationItems: Array<{
  id: AppScreen;
  label: string;
  description: string;
}> = [
  {
    id: "library",
    label: "Library",
    description: "Tracks, code/log sources, bases, and compositions",
  },
  {
    id: "analyzer",
    label: "Analyzer",
    description: "Signal, waveform, and BPM review",
  },
];

export function AppSidebar({
  currentScreen,
  onScreenChange,
  trackCount,
  repositoryCount,
  baseAssetCount,
  compositionCount,
  selectedItemTitle,
  manifest,
  analyzerLabel,
  monitorSession,
  monitorMetrics,
  onStopMonitor,
  onOpenMonitoredRepo,
}: AppSidebarProps) {
  const uptimeSeconds = monitorSession
    ? Math.floor((Date.now() - monitorSession.startedAt) / 1000)
    : 0;
  const uptimeLabel =
    uptimeSeconds < 60
      ? `${uptimeSeconds}s`
      : `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`;

  return (
    <aside className="sidebar panel">
      <div className="sidebar-brand">
        <p className="eyebrow">Maia</p>
        <h1>Software sonification shell</h1>
        <p>
          Local-first desktop workflow for code/log intake, reusable sonic assets, BPM review,
          derived composition plans, and audible operational tooling.
        </p>
      </div>

      <nav className="nav-stack" aria-label="Main screens">
        {navigationItems.map((item) => {
          const active = item.id === currentScreen;

          return (
            <button
              key={item.id}
              type="button"
              className={`nav-button${active ? " active" : ""}`}
              onClick={() => onScreenChange(item.id)}
            >
              <span>{item.label}</span>
              <small>{item.description}</small>
            </button>
          );
        })}
      </nav>

      {monitorSession ? (
        <div className="monitor-status-card">
          <div className="monitor-status-header">
            <span className="monitor-pulse" aria-hidden="true" />
            <span className="monitor-status-label">Live monitor</span>
            <span className="monitor-mode-badge">
              {monitorSession.adapterKind === "process" ? "process" : "file tail"}
            </span>
          </div>
          <p className="monitor-repo-title" title={monitorSession.repoTitle}>
            {monitorSession.repoTitle}
          </p>
          <div className="monitor-metrics">
            <span>{monitorMetrics.windowCount} windows</span>
            <span>·</span>
            <span>{monitorMetrics.totalAnomalies} anomalies</span>
            <span>·</span>
            <span>{uptimeLabel}</span>
          </div>
          <div className="monitor-actions">
            <button
              type="button"
              className="compact-action"
              onClick={onOpenMonitoredRepo}
            >
              Open
            </button>
            <button
              type="button"
              className="compact-action danger"
              onClick={onStopMonitor}
            >
              Stop
            </button>
          </div>
        </div>
      ) : null}

      <div className="sidebar-meta">
        <div className="sidebar-stat">
          <span>Assets</span>
          <strong>{trackCount + repositoryCount + baseAssetCount + compositionCount}</strong>
        </div>
        <div className="sidebar-stat">
          <span>Tracks / Code-logs / Bases / Comps</span>
          <strong>{trackCount} / {repositoryCount} / {baseAssetCount} / {compositionCount}</strong>
        </div>
        <div className="sidebar-stat">
          <span>Persistence</span>
          <strong>{manifest?.persistenceMode ?? "fallback"}</strong>
        </div>
        <div className="sidebar-stat">
          <span>Analyzer</span>
          <strong>{analyzerLabel}</strong>
        </div>
      </div>

      <div className="sidebar-footer">
        <span>Selected</span>
        <strong>{selectedItemTitle ?? "No asset selected"}</strong>
      </div>
    </aside>
  );
}
