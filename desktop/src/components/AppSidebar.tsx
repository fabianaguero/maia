import { Activity, AudioWaveform, Library, LayoutGrid } from "lucide-react";
import type React from "react";
import type { ActiveMonitorSession, MonitorMetrics } from "../features/monitor/MonitorContext";
import { useT } from "../i18n/I18nContext";
import type { AppPillar } from "../types/library";
import { getStreamAdapterLabel } from "../utils/streamAdapter";

const PILLAR_ICONS: Record<AppPillar, React.ReactNode> = {
  perform: <Activity size={18} />,
  design: <AudioWaveform size={18} />,
  curate: <Library size={18} />,
};

interface AppSidebarProps {
  currentPillar: AppPillar;
  onPillarChange: (pillar: AppPillar) => void;
  trackCount: number;
  repositoryCount: number;
  baseAssetCount: number;
  compositionCount: number;
  selectedItemTitle: string | null;
  monitorSession: ActiveMonitorSession | null;
  monitorMetrics: MonitorMetrics;
  onStopMonitor: () => void;
  onOpenMonitoredRepo: () => void;
  onHideToBackground: () => void;
}

export function AppSidebar({
  currentPillar,
  onPillarChange,
  trackCount,
  repositoryCount,
  baseAssetCount,
  compositionCount,
  selectedItemTitle,
  monitorSession,
  monitorMetrics,
  onStopMonitor,
  onOpenMonitoredRepo,
  onHideToBackground,
}: AppSidebarProps) {
  const t = useT();
  
  const navigationItems = [
    {
      id: "perform" as AppPillar,
      label: t.nav.pillars.perform.label,
      description: t.nav.pillars.perform.description,
      lane: t.nav.pillars.perform.lane,
      detail: monitorSession ? "Engine Active" : "Standby",
    },
    {
      id: "design" as AppPillar,
      label: t.nav.pillars.design.label,
      description: t.nav.pillars.design.description,
      lane: t.nav.pillars.design.lane,
      detail: `${compositionCount} arrangements cued`,
    },
    {
      id: "curate" as AppPillar,
      label: t.nav.pillars.curate.label,
      description: t.nav.pillars.curate.description,
      lane: t.nav.pillars.curate.lane,
      detail: `${trackCount + repositoryCount} assets in vault`,
    },
  ];

  const uptimeSeconds = monitorSession
    ? Math.floor((Date.now() - monitorSession.startedAt) / 1000)
    : 0;
  const uptimeLabel =
    uptimeSeconds < 60
      ? `${uptimeSeconds}s`
      : `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`;
  const monitorAdapterLabel = monitorSession
    ? getStreamAdapterLabel(monitorSession.adapterKind)
    : null;

  return (
    <aside className="sidebar panel role-based-sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-kicker">MAIA Hybrid System</span>
        <img
          src="/assets/branding/maia-wordmark-site.png"
          alt="MAIA"
          className="sidebar-wordmark"
        />
        <p className="sidebar-tagline">{t.tagline}</p>
      </div>

      <nav className="nav-stack role-stack" aria-label="Professional Roles">
        {navigationItems.map((item) => {
          const active = item.id === currentPillar;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-button nav-pillar-button ${active ? "active" : ""}`}
              onClick={() => onPillarChange(item.id)}
            >
              <span className="nav-lane">{item.lane}</span>
              <span className="nav-icon-shell">{PILLAR_ICONS[item.id]}</span>
              <span className="nav-copy">
                <span className="nav-title">{item.label}</span>
                <small>{item.description}</small>
              </span>
              <strong className="nav-detail">{item.detail}</strong>
            </button>
          );
        })}
      </nav>

      {monitorSession ? (
        <div className="monitor-status-card">
          <div className="monitor-status-header">
            <span className="monitor-pulse" aria-hidden="true" />
            <span className="monitor-status-label">Engine Live</span>
            <span className="monitor-mode-badge">
              {monitorAdapterLabel}
            </span>
          </div>
          <p className="monitor-repo-title" title={monitorSession.repoTitle}>
            {monitorSession.repoTitle}
          </p>
          <div className="monitor-metrics">
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
              Inspect
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
          <small className="sidebar-stat-code">TRK</small>
          <strong>{trackCount}</strong>
        </div>
        <div className="sidebar-stat">
          <small className="sidebar-stat-code">SRC</small>
          <strong>{repositoryCount}</strong>
        </div>
        <div className="sidebar-stat">
          <small className="sidebar-stat-code">BAS</small>
          <strong>{baseAssetCount}</strong>
        </div>
      </div>

      <div className="sidebar-footer">
        <span className="sidebar-footer-kicker">Selected Focus</span>
        <strong className="sidebar-footer-title">{selectedItemTitle ?? "None"}</strong>
      </div>
    </aside>
  );
}
