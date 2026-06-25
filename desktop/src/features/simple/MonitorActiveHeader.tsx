import React from "react";
import { RefreshCw } from "lucide-react";
import { useT } from "../../i18n/I18nContext";

interface MonitorActiveHeaderProps {
  isConnectingMonitor: boolean;
  monitorSourceTitle: string;
  monitorSourcePath: string;
  isAnomalyFilterActive: boolean;
  totalAnomalies: number;
  uptimeLabel: string;
  onToggleAnomalyFilter: () => void;
  onStop: () => void;
}

export function MonitorActiveHeader({
  isConnectingMonitor,
  monitorSourceTitle,
  monitorSourcePath,
  isAnomalyFilterActive,
  totalAnomalies,
  uptimeLabel,
  onToggleAnomalyFilter,
  onStop,
}: MonitorActiveHeaderProps) {
  const t = useT();

  return (
    <div className="now-listening-header">
      <div className="brand-header-mini">
        <img src="/assets/branding/maia-icon-site.png" alt="MAIA" className="logo-mini" />
        <div className="status-indicator">
          <div className={`pulsing-dot ${isConnectingMonitor ? "amber" : "teal"}`} />
          <span className={`status-text${isConnectingMonitor ? " pending" : ""}`}>
            {isConnectingMonitor
              ? t.simpleMode.monitor.connectingStream
              : t.simpleMode.monitor.systemActive}
          </span>
        </div>
      </div>
      <div className="source-info">
        <span className="source-name-hd">{monitorSourceTitle}</span>
        <span className="source-path-mini">{monitorSourcePath}</span>
        {isConnectingMonitor ? (
          <span className="monitor-connecting-inline">
            <RefreshCw size={12} className="spin-ring" />
            {t.simpleMode.monitor.waitingHandshake}
          </span>
        ) : null}
      </div>
      <div className="metrics-row-hd">
        <div
          className={`metric-pill clickable ${isAnomalyFilterActive ? "active" : ""}`}
          onClick={onToggleAnomalyFilter}
        >
          <span className="pill-label">{t.simpleMode.monitor.anomalies}</span>
          <span className="pill-value alert">{totalAnomalies}</span>
        </div>
        <div className="metric-pill">
          <span className="pill-label">{t.simpleMode.monitor.uptime}</span>
          <span className="pill-value">{uptimeLabel}</span>
        </div>
      </div>
      <button className="btn-stop-hd" onClick={onStop}>
        {t.simpleMode.common.stop}
      </button>
    </div>
  );
}
