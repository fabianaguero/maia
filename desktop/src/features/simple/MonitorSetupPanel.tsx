import React from "react";

import type { LibraryTrack } from "../../types/library";
import { BrandIcon } from "../../components/Branding";
import { TrackWaveformMini } from "../../components/TrackWaveformMini";
import { useT } from "../../i18n/I18nContext";
import { MonitorSetupHero } from "./MonitorSetupHero";
import { MonitorSetupModernSelector } from "./MonitorSetupModernSelector";
import { MonitorSetupSourceFilterBar } from "./MonitorSetupSourceFilterBar";
import { MonitorSetupTrackPreviewAction } from "./MonitorSetupTrackPreviewAction";
import { buildMonitorSetupSourceFilterOptions } from "./monitorSetupPanelRuntime";
import type { MonitorLaunchSource } from "../../types/monitorLaunch";
import type { MonitorSourceFilter } from "./monitorSourceOptions";

export interface MonitorSetupPanelProps {
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
  const canLaunch = Boolean(selectedSourceId && selectedSoundId && canStartSelectedSource);

  return (
    <>
      <MonitorSetupHero
        canLaunch={canLaunch}
        isLaunchingMonitor={isLaunchingMonitor}
        startHint={startHint}
        launchLabel={t.simpleMode.setup.initializeMonitoring}
        loadingLabel={t.simpleMode.setup.connectingToStream}
        onStartMonitoringRequest={onStartMonitoringRequest}
      />

      <div className="setup-container-modern">
        <MonitorSetupModernSelector
          label={t.simpleMode.setup.logSource}
          items={filteredMonitorSourceOptions}
          selectedId={selectedSourceId}
          onSelect={onSelectSourceId}
          headerAside={
            <MonitorSetupSourceFilterBar
              sourceFilter={sourceFilter}
              sourceFilterOptions={sourceFilterOptions}
              filterAriaLabel={t.simpleMode.setup.filterAria}
              onSourceFilterChange={onSourceFilterChange}
            />
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
            <MonitorSetupTrackPreviewAction
              track={track}
              previewTrackId={previewTrackId}
              previewLabel={t.simpleMode.setup.previewTrack}
              pauseLabel={t.simpleMode.setup.pausePreview}
              onToggleTrackPreview={onToggleTrackPreview}
            />
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
