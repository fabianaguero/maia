import React from "react";
import { Pause, Play, RefreshCw } from "lucide-react";

import type { LibraryTrack } from "../../types/library";
import { BrandIcon } from "../../components/Branding";
import { TrackWaveformMini } from "../../components/TrackWaveformMini";
import { useT } from "../../i18n/I18nContext";
import { MonitorSetupModernSelector } from "./MonitorSetupModernSelector";
import { buildMonitorSetupSourceFilterOptions } from "./monitorSetupPanelRuntime";
import type { MonitorLaunchSource, MonitorSourceFilter } from "./monitorSourceOptions";

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
  const sourceFilterOptions = buildMonitorSetupSourceFilterOptions(t);

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
        <MonitorSetupModernSelector
          label={t.simpleMode.setup.logSource}
          items={filteredMonitorSourceOptions}
          selectedId={selectedSourceId}
          onSelect={onSelectSourceId}
          headerAside={
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
          }
          renderLeading={(source, isSelected) => (
            <span
              className={`selector-brand-shell selector-brand-shell--${source.sourceType}${isSelected ? " active" : ""}`}
            >
              <BrandIcon className="selector-brand-icon" />
            </span>
          )}
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

        <MonitorSetupModernSelector
          label={t.simpleMode.setup.soundProfile}
          items={tracks}
          selectedId={selectedSoundId}
          onSelect={onSelectSoundId}
          renderLeading={(_, isSelected) => (
            <span
              className={`selector-brand-shell selector-brand-shell--track${isSelected ? " active" : ""}`}
            >
              <BrandIcon className="selector-brand-icon" />
            </span>
          )}
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
