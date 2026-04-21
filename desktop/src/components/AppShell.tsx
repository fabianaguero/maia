import { useState } from "react";
import { useT } from "../i18n/I18nContext";
import { useUserMode } from "../features/simple/UserModeContext";
import {
  Radio,
  Library,
  AudioWaveform,
  Users,
  Sliders,
  Music,
  AlertCircle,
  Clock,
  Volume2,
  Dot,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  currentSection?: "monitor" | "library" | "inspect" | "compose";
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
  onSectionChange?: (section: "monitor" | "library" | "inspect" | "compose") => void;
  onInspect?: () => void;
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
  isCollapsed = false,
  onToggleCollapse,
}: AppShellProps) {
  const t = useT();
  const { userMode, setUserMode } = useUserMode();
  const [isMonitorActive, setIsMonitorActive] = useState(isMonitoring);

  // Navigation structure differs by mode
  const navItems =
    userMode === "simple"
      ? [
          {
            id: "monitor",
            icon: Radio,
            label: t.simpleMode.nav.monitor,
            subtitle: "Booth en vivo y reproducción reactiva",
            lane: undefined,
          },
          {
            id: "library",
            icon: Library,
            label: t.simpleMode.nav.files,
            subtitle: "Log sources & sounds",
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
            id: "compose",
            icon: AudioWaveform,
            label: t.nav.compose.label,
            subtitle: t.nav.compose.description,
            lane: "B02",
          },
          {
            id: "library",
            icon: Library,
            label: t.nav.library.label,
            subtitle: t.nav.library.description,
            lane: "C03",
          },
        ];

  return (
    <div className={`app-shell-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="app-sidebar">
        {/* Logo + Branding */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <img src="file:///home/faguero/.gemini/antigravity/brain/0811368a-61f2-4dcc-a96b-476a10a440a2/media__1776681366000.png" alt="MAIA" className="logo-main" />
            {!isCollapsed && <span className="logo-text">MAIA</span>}
          </div>
          <button className="btn-collapse" onClick={onToggleCollapse}>
            {isCollapsed ? "→" : "←"}
          </button>
          {!isCollapsed && (
            <p className="sidebar-tagline">
              {userMode === "simple"
                ? "Connect → Monitor → Detect"
                : "Library → Analyze → Perform"}
            </p>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-toggle-btn ${userMode === "simple" ? "active" : ""}`}
            onClick={() => setUserMode("simple")}
            title="Basic Mode"
          >
            <Users size={16} />
            {!isCollapsed && "Basic"}
          </button>
          <button
            className={`mode-toggle-btn ${userMode === "expert" ? "active" : ""}`}
            onClick={() => setUserMode("expert")}
            title="Pro Mode"
          >
            <Sliders size={16} />
            {!isCollapsed && "Pro"}
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
                  onClick={() => {
                    if (item.id === "monitor") {
                      setIsMonitorActive(true);
                    }
                    onSectionChange?.(item.id as any);
                  }}
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
                      {userMode === "simple" ? "Listening now" : "Engine Live"}
                    </span>
                    {monitoringStatus.source && (
                      <>
                        <span className="status-source">
                          {monitoringStatus.source}
                        </span>
                        <div className="status-metrics">
                          <span className="metric-anomalies">
                            {monitoringStatus.anomalies || 0} anomalies
                          </span>
                          <span className="metric-uptime">
                            {monitoringStatus.uptime || "00:00"}
                          </span>
                        </div>
                        <button className="btn-inspect-small">Inspect</button>
                        <button
                          className="btn-stop-small"
                          onClick={() => setIsMonitorActive(false)}
                        >
                          Stop
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
            {userMode === "simple" ? "Current focus" : "Selected"}
          </span>
          <span className="footer-value">{selectedItem || "—"}</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main-content">{children}</main>
    </div>
  );
}
