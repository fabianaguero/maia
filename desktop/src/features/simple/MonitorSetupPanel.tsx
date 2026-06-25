import React from "react";
import { Pause, Play, RefreshCw } from "lucide-react";

import type { LibraryTrack } from "../../types/library";
import { TrackWaveformMini } from "../../components/TrackWaveformMini";
import { useT } from "../../i18n/I18nContext";
import type { MonitorLaunchSource, MonitorSourceFilter } from "./monitorSourceOptions";

function MiniWave({ color = "var(--color-accent)", count = 20, active = true, seed = "maia" }) {
  const getHeights = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = s.charCodeAt(i) + ((hash << 5) - hash);
    }

    let t = Math.abs(hash);
    return Array.from({ length: count }).map(() => {
      t = (t * 1664525 + 1013904223) >>> 0;
      return (t % 70) + 15;
    });
  };

  const heights = getHeights(seed);

  return (
    <div className={`visual-wave-static ${active ? "active" : ""}`}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="wave-bar-static"
          style={{
            backgroundColor: active ? color : "var(--text-muted)",
            height: `${h}%`,
            opacity: active ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

interface ModernSelectorProps<T> {
  label: string;
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  renderTitle: (item: T) => string;
  renderSub: (item: T) => string;
  color: string;
  seedPrefix?: string;
  renderAction?: (item: T, isSelected: boolean) => React.ReactNode;
  renderWave?: (item: T, isSelected: boolean) => React.ReactNode;
  renderBadge?: (item: T, isSelected: boolean) => React.ReactNode;
  emptyMessage: string;
}

function ModernSelector<T extends { id: string }>({
  label,
  items,
  selectedId,
  onSelect,
  renderTitle,
  renderSub,
  color,
  seedPrefix = "item",
  renderAction,
  renderWave,
  renderBadge,
  emptyMessage,
}: ModernSelectorProps<T>) {
  return (
    <div className="modern-selector">
      <label className="setup-label">{label}</label>
      <div className="selector-grid">
        {items.length === 0 ? (
          <div className="selector-empty">
            <span>{emptyMessage}</span>
          </div>
        ) : (
          items.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                className={`selector-card ${isSelected ? "selected" : ""}`}
                onClick={() => onSelect(item.id)}
              >
                <div className="card-content">
                  <div className="card-head">
                    <span className="card-title">{renderTitle(item)}</span>
                    {renderBadge ? renderBadge(item, isSelected) : null}
                  </div>
                  <span className="card-sub">{renderSub(item)}</span>
                </div>
                {renderAction ? (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    {renderAction(item, isSelected)}
                  </div>
                ) : renderWave ? (
                  renderWave(item, isSelected)
                ) : (
                  <MiniWave
                    color={color}
                    count={isSelected ? 14 : 6}
                    active={isSelected}
                    seed={`${seedPrefix}-${item.id}`}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

interface MonitorSetupPanelProps {
  sourceFilter: MonitorSourceFilter;
  onSourceFilterChange: (filter: MonitorSourceFilter) => void;
  filteredMonitorSourceOptions: MonitorLaunchSource[];
  selectedSourceId: string;
  onSelectSourceId: (id: string) => void;
  sourceEmptyMessage: string;
  tracks: LibraryTrack[];
  selectedSoundId: string;
  onSelectSoundId: (id: string) => void;
  getTrackTitle: (track: LibraryTrack) => string;
  previewTrackId: string | null;
  onToggleTrackPreview: (track: LibraryTrack) => void | Promise<void>;
  canStartSelectedSource: boolean;
  startHint: string;
  isLaunchingMonitor: boolean;
  onStartMonitoringRequest: () => void | Promise<void>;
}

export function MonitorSetupPanel({
  sourceFilter,
  onSourceFilterChange,
  filteredMonitorSourceOptions,
  selectedSourceId,
  onSelectSourceId,
  sourceEmptyMessage,
  tracks,
  selectedSoundId,
  onSelectSoundId,
  getTrackTitle,
  previewTrackId,
  onToggleTrackPreview,
  canStartSelectedSource,
  startHint,
  isLaunchingMonitor,
  onStartMonitoringRequest,
}: MonitorSetupPanelProps) {
  const t = useT();
  const sourceFilterOptions: Array<{ id: MonitorSourceFilter; label: string }> = [
    { id: "all", label: t.simpleMode.setup.all },
    { id: "file", label: t.simpleMode.setup.logFile },
    { id: "folder", label: t.simpleMode.setup.folder },
    { id: "cloud", label: t.simpleMode.setup.cloud },
  ];

  return (
    <>
      <div className="setup-actions-fixed setup-actions-fixed--hero">
        <button
          className={`btn-start-listening-impactful ${selectedSourceId && selectedSoundId && canStartSelectedSource ? "ready" : ""}${isLaunchingMonitor ? " launching" : ""}`}
          onClick={() => {
            void onStartMonitoringRequest();
          }}
          disabled={
            !selectedSourceId || !selectedSoundId || !canStartSelectedSource || isLaunchingMonitor
          }
        >
          <div className="btn-impact-glitch" />
          {isLaunchingMonitor ? (
            <RefreshCw size={28} className="spin-ring" />
          ) : (
            <Play size={28} fill="currentColor" />
          )}
          <span className="btn-text">
            {isLaunchingMonitor
              ? t.simpleMode.setup.connectingToStream
              : t.simpleMode.setup.initializeMonitoring}
          </span>
          <div className="btn-impact-scan" />
        </button>
        <p className="setup-hero-hint">{startHint}</p>
      </div>

      <div className="setup-container-modern">
        <div
          className="source-filter-bar"
          role="tablist"
          aria-label={t.simpleMode.setup.filterAria}
        >
          {sourceFilterOptions.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`source-filter-chip ${sourceFilter === filter.id ? "active" : ""}`}
              onClick={() => onSourceFilterChange(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <ModernSelector
          label={t.simpleMode.setup.logSource}
          items={filteredMonitorSourceOptions}
          selectedId={selectedSourceId}
          onSelect={onSelectSourceId}
          renderTitle={(source) => source.title}
          renderSub={(source) => source.sourcePath}
          renderBadge={(source) => (
            <span className={`selector-type-badge selector-type-badge--${source.sourceType}`}>
              {source.sourceTypeLabel}
            </span>
          )}
          emptyMessage={sourceEmptyMessage}
          color="var(--color-calm)"
          seedPrefix="repo"
        />

        <ModernSelector
          label={t.simpleMode.setup.soundProfile}
          items={tracks}
          selectedId={selectedSoundId}
          onSelect={onSelectSoundId}
          renderTitle={(track) => getTrackTitle(track)}
          renderSub={(track) => track.tags.musicStyleLabel || t.simpleMode.setup.ambientFallback}
          color="var(--color-accent)"
          seedPrefix="track"
          renderAction={(track) => (
            <button
              type="button"
              className="track-preview-button"
              title={
                previewTrackId === track.id
                  ? t.simpleMode.setup.pausePreview
                  : t.simpleMode.setup.previewTrack
              }
              onClick={() => {
                void onToggleTrackPreview(track);
              }}
            >
              {previewTrackId === track.id ? <Pause size={14} /> : <Play size={14} />}
            </button>
          )}
          renderWave={(track, isSelected) => (
            <TrackWaveformMini bins={track.analysis?.waveformBins ?? null} active={isSelected} />
          )}
          emptyMessage={t.simpleMode.setup.noItemsAvailable}
        />
      </div>
    </>
  );
}
