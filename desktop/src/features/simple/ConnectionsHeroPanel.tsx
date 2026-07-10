import { RefreshCw } from "lucide-react";

import type { ConnectionsScreenViewModel } from "./connectionsScreenHookRuntime";

interface ConnectionsHeroPanelProps {
  viewModel: ConnectionsScreenViewModel;
  loading: boolean;
  saving: boolean;
  onRefreshConnections: () => void | Promise<void>;
}

export function ConnectionsHeroPanel({
  viewModel,
  loading,
  saving,
  onRefreshConnections,
}: ConnectionsHeroPanelProps) {
  return (
    <div className="connections-hero panel">
      <div className="connections-hero__copy">
        <span className="connections-hero__kicker">{viewModel.heroKicker}</span>
        <h2>{viewModel.heroTitle}</h2>
        <p>{viewModel.heroDescription}</p>
      </div>
      <div className="connections-hero__stats">
        {viewModel.heroStats.map((stat) => (
          <div key={stat.key} className="connections-stat">
            <span className="connections-stat__label">{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
        <button
          type="button"
          className="control-button"
          onClick={() => void onRefreshConnections()}
          disabled={loading || saving}
          title={viewModel.refreshTitle}
        >
          <RefreshCw size={16} className={loading || saving ? "spin-ring" : undefined} />
        </button>
      </div>
    </div>
  );
}
