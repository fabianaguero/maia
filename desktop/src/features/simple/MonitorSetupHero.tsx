import { Play, RefreshCw } from "lucide-react";
import { RuntimeStatusCard } from "../../components/RuntimeStatusCard";

interface MonitorSetupHeroProps {
  canLaunch: boolean;
  isLaunchingMonitor: boolean;
  startHint: string;
  launchLabel: string;
  loadingLabel: string;
  onStartMonitoringRequest: () => void | Promise<void>;
}

export function MonitorSetupHero({
  canLaunch,
  isLaunchingMonitor,
  startHint,
  launchLabel,
  loadingLabel,
  onStartMonitoringRequest,
}: MonitorSetupHeroProps) {
  return (
    <div className="setup-actions-fixed setup-actions-fixed--hero">
      <button
        className={`btn-start-listening-impactful ${canLaunch ? "ready" : ""}${isLaunchingMonitor ? " launching" : ""}`}
        onClick={() => {
          void onStartMonitoringRequest();
        }}
        disabled={!canLaunch || isLaunchingMonitor}
      >
        <div className="btn-impact-glitch" />
        {isLaunchingMonitor ? (
          <RefreshCw size={28} className="spin-ring" />
        ) : (
          <Play size={28} fill="currentColor" />
        )}
        <span className="btn-text">{isLaunchingMonitor ? loadingLabel : launchLabel}</span>
        <div className="btn-impact-scan" />
      </button>
      {isLaunchingMonitor ? (
        <RuntimeStatusCard
          title={loadingLabel}
          detail={startHint}
          badge={loadingLabel}
          tone="pending"
          activity="spinner"
          compact
          className="setup-runtime-status"
        />
      ) : (
        <p className="setup-hero-hint">{startHint}</p>
      )}
    </div>
  );
}
