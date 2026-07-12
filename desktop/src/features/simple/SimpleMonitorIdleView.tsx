import type { LibraryTrack } from "../../types/library";
import type { PersistedSession } from "../../api/sessions";
import type { MonitorLaunchSource } from "../../types/monitorLaunch";
import type { MonitorSourceFilter } from "./monitorSourceOptions";
import { MonitorSetupPanel } from "./MonitorSetupPanel";
import { PastSessionsPanel } from "./PastSessionsPanel";
import { useT } from "../../i18n/I18nContext";

export interface SimpleMonitorIdleViewProps {
  sourceFilter: MonitorSourceFilter;
  onSourceFilterChange: (value: MonitorSourceFilter) => void;
  filteredMonitorSourceOptions: MonitorLaunchSource[];
  selectedSourceId: string;
  onSelectSourceId: (value: string) => void;
  sourceEmptyMessage: string;
  codeProjectSourceOptions: MonitorLaunchSource[];
  selectedCodeProjectId: string;
  onSelectCodeProjectId: (value: string) => void;
  tracks: LibraryTrack[];
  selectedSoundId: string;
  onSelectSoundId: (value: string) => void;
  getTrackTitle: (track: LibraryTrack) => string;
  previewTrackId: string | null;
  onToggleTrackPreview: (track: LibraryTrack) => void | Promise<void>;
  canStartSelectedSource: boolean;
  startHint: string;
  isLaunchingMonitor: boolean;
  onStartMonitoringRequest: () => void | Promise<void>;
  sessions: PersistedSession[];
  onReplaySession: (
    sessionId: string,
    sourcePath: string,
    repoTitle: string,
    trackId?: string | null,
  ) => void;
  onDeletePastSession: (sessionId: string) => Promise<void>;
  onDeleteLibraryTrack: (trackId: string) => Promise<boolean>;
}

export function SimpleMonitorIdleView({
  sourceFilter,
  onSourceFilterChange,
  filteredMonitorSourceOptions,
  selectedSourceId,
  onSelectSourceId,
  sourceEmptyMessage,
  codeProjectSourceOptions,
  selectedCodeProjectId,
  onSelectCodeProjectId,
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
  sessions,
  onReplaySession,
  onDeletePastSession,
  onDeleteLibraryTrack,
}: SimpleMonitorIdleViewProps) {
  const t = useT();

  return (
    <div className="monitor-idle">
      <div className="idle-container">
        <h2 className="idle-title">{t.simpleMode.setup.startMonitoring}</h2>

        <div className="idle-main-grid">
          <MonitorSetupPanel
            sourceFilter={sourceFilter}
            onSourceFilterChange={onSourceFilterChange}
            filteredMonitorSourceOptions={filteredMonitorSourceOptions}
            selectedSourceId={selectedSourceId}
            onSelectSourceId={onSelectSourceId}
            sourceEmptyMessage={sourceEmptyMessage}
            codeProjectSourceOptions={codeProjectSourceOptions}
            selectedCodeProjectId={selectedCodeProjectId}
            onSelectCodeProjectId={onSelectCodeProjectId}
            tracks={tracks}
            selectedSoundId={selectedSoundId}
            onSelectSoundId={onSelectSoundId}
            getTrackTitle={getTrackTitle}
            previewTrackId={previewTrackId}
            onToggleTrackPreview={onToggleTrackPreview}
            canStartSelectedSource={canStartSelectedSource}
            startHint={startHint}
            isLaunchingMonitor={isLaunchingMonitor}
            onStartMonitoringRequest={onStartMonitoringRequest}
          />
        </div>

        <PastSessionsPanel
          sessions={sessions}
          tracks={tracks}
          onReplaySession={onReplaySession}
          onDeletePastSession={onDeletePastSession}
          onDeleteLibraryTrack={onDeleteLibraryTrack}
        />
      </div>
    </div>
  );
}
