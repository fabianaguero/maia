import { useT } from "../i18n/I18nContext";
import { useUserMode } from "../features/simple/UserModeContext";
import type { AppSection } from "../features/simple/appSections";
import { Radio, Library, AudioWaveform, Cable, Users, Sliders } from "lucide-react";
import { BrandIcon, BrandLockup } from "./Branding";
import { getMonitorAnomaliesInlineLabel, getMonitorLiveStatusLabel } from "../utils/monitorLabels";
import { buildShellNavItems } from "./appNavigationViewModel";
import { AppShellMonitorStatusBadge } from "./AppShellMonitorStatusBadge";
import { AppShellStatsFooter } from "./AppShellStatsFooter";

export interface AppShellProps {
  children: React.ReactNode;
  currentSection?: AppSection;
  isMonitoring?: boolean;
  monitoringStatus?: {
    source?: string;
    anomalies?: number;
    uptime?: string;
    confidence?: number;
  };
  selectedItem?: string;
  trackCount?: number;
  repositoryCount?: number;
  baseAssetCount?: number;
  onSectionChange?: (section: AppSection) => void;
  onInspect?: () => void;
  onStopMonitoring?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AppShell({
  children,
  currentSection = "library",
  isMonitoring = false,
  monitoringStatus = {},
  selectedItem = "",
  trackCount = 0,
  repositoryCount = 0,
  baseAssetCount = 0,
  onSectionChange,
  onInspect,
  onStopMonitoring,
  isCollapsed = false,
  onToggleCollapse,
}: AppShellProps) {
  const t = useT();
  const { userMode, setUserMode } = useUserMode();
  const isMonitorActive = isMonitoring;
  const liveStatusLabel = getMonitorLiveStatusLabel(t);
  const anomaliesInlineLabel = getMonitorAnomaliesInlineLabel(t);

  const navItems = buildShellNavItems({ t, userMode });
  const shellIcons = {
    monitor: Radio,
    connections: Cable,
    setup: Sliders,
    compose: AudioWaveform,
    library: Library,
    inspect: Library,
  } satisfies Record<AppSection, typeof Radio>;

  return (
    <div className={`app-shell-layout ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* Sidebar */}
      <aside className="app-sidebar">
        {/* Logo + Branding */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            {isCollapsed ? (
              <BrandIcon className="logo-main" />
            ) : (
              <BrandLockup className="sidebar-brand-lockup" wordmarkClassName="sidebar-wordmark" />
            )}
          </div>
          <button className="btn-collapse" onClick={onToggleCollapse}>
            {isCollapsed ? "→" : "←"}
          </button>
          {!isCollapsed && (
            <p className="sidebar-tagline">
              {userMode === "simple"
                ? t.simpleMode.shell.simpleTagline
                : t.simpleMode.shell.expertTagline}
            </p>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-toggle-btn ${userMode === "simple" ? "active" : ""}`}
            onClick={() => setUserMode("simple")}
            title={t.simpleMode.shell.basicMode}
          >
            <Users size={16} />
            {!isCollapsed && t.simpleMode.shell.basicShort}
          </button>
          <button
            className={`mode-toggle-btn ${userMode === "expert" ? "active" : ""}`}
            onClick={() => setUserMode("expert")}
            title={t.simpleMode.shell.proMode}
          >
            <Sliders size={16} />
            {!isCollapsed && t.simpleMode.shell.proShort}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = shellIcons[item.id];
            const isActive = currentSection === item.id;

            return (
              <div key={item.id} className="nav-item-wrapper">
                <button
                  type="button"
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={() => onSectionChange?.(item.id)}
                >
                  <Icon size={18} className="nav-icon" />
                  {!isCollapsed && (
                    <>
                      <div className="nav-label-group">
                        <span className="nav-label">{item.label}</span>
                        {item.lane && <span className="nav-lane">{item.lane}</span>}
                      </div>
                      <span className="nav-subtitle">{item.subtitle}</span>
                    </>
                  )}
                </button>

                {/* Monitor status badge (when monitoring) */}
                {item.id === "monitor" && isMonitorActive && (
                  <AppShellMonitorStatusBadge
                    liveStatusLabel={liveStatusLabel}
                    anomaliesInlineLabel={anomaliesInlineLabel}
                    anomalies={monitoringStatus.anomalies}
                    uptime={monitoringStatus.uptime}
                    source={monitoringStatus.source}
                    inspectLabel={t.simpleMode.common.inspect}
                    stopLabel={t.simpleMode.common.stop}
                    onInspect={onInspect}
                    onStopMonitoring={onStopMonitoring}
                  />
                )}
              </div>
            );
          })}
        </nav>

        {/* Stats Footer (only in Pro mode) */}
        {userMode === "expert" && (
          <AppShellStatsFooter
            tracksTitle={t.simpleMode.shell.tracksTitle}
            tracksShort={t.simpleMode.shell.tracksShort}
            trackCount={trackCount}
            logsTitle={t.simpleMode.shell.logsTitle}
            logsShort={t.simpleMode.shell.logsShort}
            repositoryCount={repositoryCount}
            profilesTitle={t.simpleMode.shell.profilesTitle}
            profilesShort={t.simpleMode.shell.profilesShort}
            baseAssetCount={baseAssetCount}
          />
        )}

        {/* Selected Item Footer */}
        <div className="sidebar-footer">
          <span className="footer-label">
            {userMode === "simple" ? t.simpleMode.shell.currentFocus : t.sidebar.selected}
          </span>
          <span className="footer-value" title={selectedItem || t.simpleMode.shell.none}>
            {selectedItem || t.simpleMode.shell.none}
          </span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main-content">{children}</main>
    </div>
  );
}
