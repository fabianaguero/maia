import { useT } from "../i18n/I18nContext";
import { useUserMode } from "../features/simple/UserModeContext";
import type { AppSection } from "../features/simple/appSections";
import { Radio, Library, AudioWaveform, Cable, Users, Sliders, Dot } from "lucide-react";

interface AppShellProps {
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

  // Navigation structure differs by mode
  const navItems =
    userMode === "simple"
      ? [
          {
            id: "monitor",
            icon: Radio,
            label: t.simpleMode.nav.monitor,
            subtitle: t.simpleMode.setup.monitorSubtitle,
            lane: undefined,
          },
          {
            id: "connections",
            icon: Cable,
            label: t.simpleMode.nav.connections,
            subtitle: t.simpleMode.setup.connectionsSubtitle,
            lane: undefined,
          },
          {
            id: "setup",
            icon: Sliders,
            label: t.simpleMode.nav.setup,
            subtitle: t.simpleMode.setup.setupSubtitle,
            lane: undefined,
          },
          {
            id: "library",
            icon: Library,
            label: t.simpleMode.nav.files,
            subtitle: t.simpleMode.setup.filesSubtitle,
            lane: undefined,
          },
        ]
      : [
          {
            id: "monitor",
            icon: Radio,
            label: t.nav.session.label,
            subtitle: t.nav.session.description,
            lane: "A01",
          },
          {
            id: "connections",
            icon: Cable,
            label: t.simpleMode.nav.connections,
            subtitle: t.simpleMode.shell.connectionsExpertSubtitle,
            lane: "B02",
          },
          {
            id: "setup",
            icon: Sliders,
            label: t.simpleMode.nav.setup,
            subtitle: t.simpleMode.shell.setupExpertSubtitle,
            lane: "C03",
          },
          {
            id: "compose",
            icon: AudioWaveform,
            label: t.nav.compose.label,
            subtitle: t.nav.compose.description,
            lane: "D04",
          },
          {
            id: "library",
            icon: Library,
            label: t.nav.library.label,
            subtitle: t.nav.library.description,
            lane: "E05",
          },
        ];

  return (
    <div className={`app-shell-layout ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* Sidebar */}
      <aside className="app-sidebar">
        {/* Logo + Branding */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <img src="/assets/branding/maia-icon-site.png" alt="MAIA" className="logo-main" />
            {!isCollapsed && <span className="logo-text">MAIA</span>}
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
            const Icon = item.icon;
            const isActive = currentSection === item.id;

            return (
              <div key={item.id} className="nav-item-wrapper">
                <button
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={() => onSectionChange?.(item.id as any)}
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
                  <div className="monitor-status-badge">
                    <Dot size={8} className="pulsing-dot" />
                    <span className="status-label">
                      {userMode === "simple"
                        ? t.simpleMode.status.listening
                        : t.simpleMode.shell.engineLive}
                    </span>
                    {monitoringStatus.source && (
                      <>
                        <span className="status-source">{monitoringStatus.source}</span>
                        <div className="status-metrics">
                          <span className="metric-anomalies">
                            {monitoringStatus.anomalies || 0}{" "}
                            {t.simpleMode.monitor.anomalies.toLowerCase()}
                          </span>
                          <span className="metric-uptime">
                            {monitoringStatus.uptime || "00:00"}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn-inspect-small"
                          onClick={() => onInspect?.()}
                        >
                          {t.simpleMode.common.inspect}
                        </button>
                        <button
                          type="button"
                          className="btn-stop-small"
                          onClick={() => onStopMonitoring?.()}
                        >
                          {t.simpleMode.common.stop}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Stats Footer (only in Pro mode) */}
        {userMode === "expert" && (
          <div className="sidebar-stats">
            <div className="stat-item">
              <span className="stat-label">SND</span>
              <span className="stat-value">{trackCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">LOG</span>
              <span className="stat-value">{repositoryCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">PRF</span>
              <span className="stat-value">{baseAssetCount}</span>
            </div>
          </div>
        )}

        {/* Selected Item Footer */}
        <div className="sidebar-footer">
          <span className="footer-label">
            {userMode === "simple" ? t.simpleMode.shell.currentFocus : t.sidebar.selected}
          </span>
          <span className="footer-value">{selectedItem || "—"}</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main-content">{children}</main>
    </div>
  );
}
