import React from "react";
import { RefreshCw } from "lucide-react";
import { useT } from "../../i18n/I18nContext";
import type { MonitorHeaderMetricViewModel } from "./activeMonitorDeckViewModel";
import { BrandIcon } from "../../components/Branding";

export interface MonitorActiveHeaderProps {
  monitorSourceTitle: string;
  monitorSourcePath: string;
  statusLabel: string;
  statusTone: "pending" | "live";
  isAnomalyFilterActive: boolean;
  metrics: MonitorHeaderMetricViewModel[];
  onToggleAnomalyFilter: () => void;
  onStop: () => void;
}

export function MonitorActiveHeader({
  monitorSourceTitle,
  monitorSourcePath,
  statusLabel,
  statusTone,
  isAnomalyFilterActive,
  metrics,
  onToggleAnomalyFilter,
  onStop,
}: MonitorActiveHeaderProps) {
  const t = useT();

  return (
    <div className="now-listening-header">
      <div className="brand-header-mini">
        <span className="brand-header-glyph" aria-label="MAIA">
          <BrandIcon className="brand-header-glyph__icon" />
        </span>
        <div className="status-indicator">
          <div className="status-indicator__signal">
            <div className={`pulsing-dot ${statusTone === "pending" ? "amber" : "teal"}`} />
            <span className={`status-text${statusTone === "pending" ? " pending" : ""}`}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
      <div className="source-info">
        <span className="source-name-hd">{monitorSourceTitle}</span>
        <span className="source-path-mini">{monitorSourcePath}</span>
        {statusTone === "pending" ? (
          <span className="monitor-connecting-inline">
            <RefreshCw size={12} className="spin-ring" />
            {t.simpleMode.monitor.waitingHandshake}
          </span>
        ) : null}
      </div>
      <div className="monitor-header-actions">
        <div className="metrics-row-hd">
          {metrics.map((metric) => (
            metric.key === "anomalies" ? (
              <button
                key={metric.key}
                type="button"
                className={`metric-pill clickable ${isAnomalyFilterActive ? "active" : ""}`}
                onClick={onToggleAnomalyFilter}
                aria-pressed={isAnomalyFilterActive}
                title={
                  isAnomalyFilterActive
                    ? t.simpleMode.monitor.showFullStream
                    : t.simpleMode.monitor.filterAnomalies
                }
              >
                <span className="pill-label">{metric.label}</span>
                <span className={`pill-value${metric.tone === "alert" ? " alert" : ""}`}>
                  {metric.value}
                </span>
              </button>
            ) : (
              <div key={metric.key} className="metric-pill">
                <span className="pill-label">{metric.label}</span>
                <span className={`pill-value${metric.tone === "alert" ? " alert" : ""}`}>
                  {metric.value}
                </span>
              </div>
            )
          ))}
        </div>
        <button className="btn-stop-hd" onClick={onStop}>
          {t.simpleMode.common.stop}
        </button>
      </div>
    </div>
  );
}
