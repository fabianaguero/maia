import { Activity, AudioWaveform, Cable, Library } from "lucide-react";
import type React from "react";
import type { ActiveMonitorSession, MonitorMetrics } from "../features/monitor/MonitorContext";
import { useT } from "../i18n/I18nContext";
import { useUserMode } from "../features/simple/UserModeContext";
import type { AppPillar } from "../types/library";
import { getStreamAdapterLabel } from "../utils/streamAdapter";
import { ModeToggle } from "./ModeToggle";

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

  const navigationItems =
    userMode === "simple"
      ? [
          {
            id: "perform" as AppPillar,
            label: t.simpleMode.nav.monitor,
            description: t.simpleMode.shell.realTimeLogMonitoring,
            lane: null,
            detail: monitorSession ? t.simpleMode.status.listening : t.simpleMode.status.standby,
          },
          {
            id: "curate" as AppPillar,
            label: t.simpleMode.nav.files,
            description: t.simpleMode.shell.manageFilesAndLogs,
            lane: null,
            detail: t.simpleMode.shell.items.replace(
              "{count}",
              String(trackCount + repositoryCount),
            ),
          },
        ]
      : [
          {
            id: "perform" as AppPillar,
            label: t.nav.pillars.perform.label,
            description: t.nav.pillars.perform.description,
            lane: t.nav.pillars.perform.lane,
            detail: monitorSession ? t.simpleMode.shell.engineLive : t.simpleMode.status.standby,
          },
          {
            id: "design" as AppPillar,
            label: t.nav.pillars.design.label,
            description: t.nav.pillars.design.description,
            lane: t.nav.pillars.design.lane,
            detail: t.simpleMode.shell.arrangementsCued.replace(
              "{count}",
              String(compositionCount),
            ),
          },
          {
            id: "curate" as AppPillar,
            label: t.nav.pillars.curate.label,
            description: t.nav.pillars.curate.description,
            lane: t.nav.pillars.curate.lane,
            detail: t.simpleMode.shell.assetsInVault.replace(
              "{count}",
              String(trackCount + repositoryCount),
            ),
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
        <div className="sidebar-logo-lockup">
          <img src="/assets/branding/maia-icon-site.png" alt="MAIA" className="sidebar-logo-icon" />
          <img
            src="/assets/branding/maia-wordmark-site.png"
            alt="MAIA"
            className="sidebar-wordmark"
          />
        </div>
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
              {userMode === "simple"
                ? t.simpleMode.status.listening
                : t.simpleMode.shell.engineLive}
            </span>
            <span className="monitor-mode-badge">{monitorAdapterLabel}</span>
          </div>
          <p className="monitor-repo-title" title={monitorSession.repoTitle}>
            {monitorSession.repoTitle}
          </p>
          <div className="monitor-metrics">
            <span>
              {monitorMetrics.totalAnomalies} {t.simpleMode.monitor.anomalies.toLowerCase()}
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
            <small className="sidebar-stat-code">SND</small>
            <strong>{trackCount}</strong>
          </div>
          <div className="sidebar-stat">
            <small className="sidebar-stat-code">LOG</small>
            <strong>{repositoryCount}</strong>
          </div>
          <div className="sidebar-stat">
            <small className="sidebar-stat-code">PRF</small>
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
