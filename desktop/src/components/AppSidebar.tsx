import { Activity, AudioWaveform, Radio, Library } from "lucide-react";
import type React from "react";
import type { ActiveMonitorSession, MonitorMetrics } from "../features/monitor/MonitorContext";
import { useT } from "../i18n/I18nContext";
import type { AppScreen } from "../types/library";

const SCREEN_ICONS: Record<AppScreen, React.ReactNode> = {
  library: <Library size={15} />,
  session: <Radio size={15} />,
  inspect: <Activity size={15} />,
  compose: <AudioWaveform size={15} />,
};

interface AppSidebarProps {
  currentScreen: AppScreen;
  onScreenChange: (screen: AppScreen) => void;
  trackCount: number;
  repositoryCount: number;
  baseAssetCount: number;
  compositionCount: number;
  selectedItemTitle: string | null;
  monitorSession: ActiveMonitorSession | null;
  monitorMetrics: MonitorMetrics;
  onStopMonitor: () => void;
  onOpenMonitoredRepo: () => void;
}

export function AppSidebar({
  currentScreen,
  onScreenChange,
  trackCount,
  repositoryCount,
  baseAssetCount,
  compositionCount,
  selectedItemTitle,
  monitorSession,
  monitorMetrics,
  onStopMonitor,
  onOpenMonitoredRepo,
}: AppSidebarProps) {
  const t = useT();
  const navigationItems = [
    { id: "library" as AppScreen, label: t.nav.library.label, description: t.nav.library.description },
    { id: "session" as AppScreen, label: t.nav.session.label, description: t.nav.session.description },
    { id: "inspect" as AppScreen, label: t.nav.inspect.label, description: t.nav.inspect.description },
    { id: "compose" as AppScreen, label: t.nav.compose.label, description: t.nav.compose.description },
  ];
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
        <img
          src="/assets/branding/maia-wordmark-site.png"
          alt="MAIA"
          className="sidebar-wordmark"
        />
        <p>{t.tagline}</p>
      </div>

      <nav className="nav-stack" aria-label="Main screens">
        {navigationItems.map((item, index) => {
          const active = item.id === currentScreen;
          const isMonitor = item.id === "session";

          return (
            <div key={item.id}>
              {isMonitor && index > 0 && <div className="nav-separator" />}
              <button
                type="button"
                className={`nav-button${active ? " active" : ""}${isMonitor ? " nav-button--monitor" : ""}`}
                onClick={() => onScreenChange(item.id)}
              >
                {SCREEN_ICONS[item.id]}
                <span>{item.label}</span>
                <small>{item.description}</small>
              </button>
            </div>
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
          <span>{t.sidebar.tracks}</span>
          <strong>{trackCount}</strong>
        </div>
        <div className="sidebar-stat">
          <span>{t.sidebar.codeLogs}</span>
          <strong>{repositoryCount}</strong>
        </div>
        <div className="sidebar-stat">
          <span>{t.sidebar.bases}</span>
          <strong>{baseAssetCount}</strong>
        </div>
        <div className="sidebar-stat">
          <span>{t.sidebar.comps}</span>
          <strong>{compositionCount}</strong>
        </div>
      </div>

      <div className="sidebar-footer">
        <span>{t.sidebar.selected}</span>
        <strong>{selectedItemTitle ?? t.sidebar.noAsset}</strong>
      </div>
    </aside>
  );
}
