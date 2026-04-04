import type { BootstrapManifest } from "../contracts";
import type { AppScreen } from "../types/library";

interface AppSidebarProps {
  currentScreen: AppScreen;
  onScreenChange: (screen: AppScreen) => void;
  trackCount: number;
  repositoryCount: number;
  baseAssetCount: number;
  selectedItemTitle: string | null;
  manifest: BootstrapManifest | null;
  analyzerLabel: string;
}

const navigationItems: Array<{
  id: AppScreen;
  label: string;
  description: string;
}> = [
  {
    id: "library",
    label: "Library",
    description: "Tracks, repos, and reusable bases",
  },
  {
    id: "analyzer",
    label: "Analyzer",
    description: "Waveform and BPM review",
  },
];

export function AppSidebar({
  currentScreen,
  onScreenChange,
  trackCount,
  repositoryCount,
  baseAssetCount,
  selectedItemTitle,
  manifest,
  analyzerLabel,
}: AppSidebarProps) {
  return (
    <aside className="sidebar panel">
      <div className="sidebar-brand">
        <p className="eyebrow">Maia</p>
        <h1>DJ analyzer shell</h1>
        <p>
          Local-first desktop workflow for track intake, reusable base assets,
          BPM review, and repository-aware rhythm tooling.
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

      <div className="sidebar-meta">
        <div className="sidebar-stat">
          <span>Assets</span>
          <strong>{trackCount + repositoryCount + baseAssetCount}</strong>
        </div>
        <div className="sidebar-stat">
          <span>Tracks / Repos / Bases</span>
          <strong>{trackCount} / {repositoryCount} / {baseAssetCount}</strong>
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
