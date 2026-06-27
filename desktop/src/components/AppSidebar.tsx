import { Activity, AudioWaveform, Cable, Library } from "lucide-react";
import type React from "react";
import type {
  ActiveMonitorSession,
  MonitorMetrics,
} from "../features/monitor/monitorContextTypes";
import { useT } from "../i18n/I18nContext";
import { useUserMode } from "../features/simple/UserModeContext";
import type { AppPillar } from "../types/library";
import { getStreamAdapterLabel } from "../utils/streamAdapter";
import {
  formatMonitorShortUptime,
  getMonitorAnomaliesInlineLabel,
  getMonitorLiveStatusLabel,
} from "../utils/monitorLabels";
import { ModeToggle } from "./ModeToggle";
import { BrandLockup } from "./Branding";
import { buildSidebarNavItems } from "./appNavigationViewModel";

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
  onOpenConnections: () => void;
  connectionsActive: boolean;
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
  onOpenConnections,
  connectionsActive,
}: AppSidebarProps) {
  const t = useT();
  const { userMode } = useUserMode();
  const liveStatusLabel = getMonitorLiveStatusLabel(t);
  const anomaliesInlineLabel = getMonitorAnomaliesInlineLabel(t);
  const navigationItems = buildSidebarNavItems({
    t,
    userMode,
    liveStatusLabel,
    monitorActive: Boolean(monitorSession),
    trackCount,
    repositoryCount,
    compositionCount,
  });

  const uptimeLabel = formatMonitorShortUptime(monitorSession?.startedAt);
  const monitorAdapterLabel = monitorSession
    ? getStreamAdapterLabel(monitorSession.adapterKind)
    : null;

  return (
    <aside className="sidebar panel role-based-sidebar">
      <div className="sidebar-brand">
        <BrandLockup
          className="sidebar-brand-lockup sidebar-brand-lockup--pro"
          wordmarkClassName="sidebar-wordmark sidebar-wordmark--pro"
        />
        <p className="sidebar-tagline">{t.tagline}</p>
        <ModeToggle />
      </div>

      <nav className="nav-stack role-stack" aria-label={t.simpleMode.shell.professionalRoles}>
        {navigationItems.map((item) => {
          const active = item.id === currentPillar;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-button nav-pillar-button ${active ? "active" : ""}`}
              onClick={() => onPillarChange(item.id)}
            >
              {item.lane && <span className="nav-lane">{item.lane}</span>}
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

      <button
        type="button"
        className={`nav-button nav-pillar-button ${connectionsActive ? "active" : ""}`}
        onClick={onOpenConnections}
      >
        <span className="nav-lane">{t.sidebar.connectionsLane}</span>
        <span className="nav-icon-shell">
          <Cable size={18} />
        </span>
        <span className="nav-copy">
          <span className="nav-title">{t.simpleMode.nav.connections}</span>
          <small>{t.simpleMode.shell.fileLogsAndCloudRun}</small>
        </span>
        <strong className="nav-detail">{t.simpleMode.shell.persistent}</strong>
      </button>

      {monitorSession ? (
        <div className="monitor-status-card">
          <div className="monitor-status-header">
            <span className="monitor-pulse" aria-hidden="true" />
            <span className="monitor-status-label">
              {liveStatusLabel}
            </span>
            <span className="monitor-mode-badge">{monitorAdapterLabel}</span>
          </div>
          <p className="monitor-repo-title" title={monitorSession.repoTitle}>
            {monitorSession.repoTitle}
          </p>
          <div className="monitor-metrics">
            <span>
              {monitorMetrics.totalAnomalies} {anomaliesInlineLabel}
            </span>
            <span>·</span>
            <span>{uptimeLabel}</span>
          </div>
          <div className="monitor-actions">
            <button type="button" className="compact-action" onClick={onOpenMonitoredRepo}>
              {t.simpleMode.common.inspect}
            </button>
            <button type="button" className="compact-action danger" onClick={onStopMonitor}>
              {t.simpleMode.common.stop}
            </button>
          </div>
        </div>
      ) : null}

      {userMode === "expert" && (
        <div className="sidebar-meta">
          <div className="sidebar-stat">
            <small className="sidebar-stat-code" title={t.simpleMode.shell.tracksTitle}>
              {t.simpleMode.shell.tracksShort}
            </small>
            <strong>{trackCount}</strong>
          </div>
          <div className="sidebar-stat">
            <small className="sidebar-stat-code" title={t.simpleMode.shell.logsTitle}>
              {t.simpleMode.shell.logsShort}
            </small>
            <strong>{repositoryCount}</strong>
          </div>
          <div className="sidebar-stat">
            <small className="sidebar-stat-code" title={t.simpleMode.shell.profilesTitle}>
              {t.simpleMode.shell.profilesShort}
            </small>
            <strong>{baseAssetCount}</strong>
          </div>
        </div>
      )}

      <div className="sidebar-footer">
        <span className="sidebar-footer-kicker">{t.simpleMode.shell.selectedFocus}</span>
        <strong className="sidebar-footer-title">
          {selectedItemTitle ?? t.simpleMode.shell.none}
        </strong>
      </div>
    </aside>
  );
}
