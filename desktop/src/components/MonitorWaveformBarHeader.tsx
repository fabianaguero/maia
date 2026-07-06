import type { ChangeEvent } from "react";

import type { SourceTemplate } from "../config/sourceTemplates";
import type { ActiveMonitorSession } from "../features/monitor/monitorContextTypes";
import { useT } from "../i18n/I18nContext";
import type { LibraryTrack } from "../types/library";
import { getTrackTitle, resolvePlayableTrackPath } from "../utils/track";

import { MonitorWaveformTemplateChip } from "./MonitorWaveformTemplateChip";

export function MonitorWaveformBarHeader({
  session,
  isPlayback,
  tracks,
  guideTrackPath,
  activeTemplate,
  latestBpm,
  isAudioSuspended,
  onGuideTrackChange,
  onResumeAudio,
}: {
  session: ActiveMonitorSession;
  isPlayback: boolean;
  tracks: LibraryTrack[];
  guideTrackPath: string | null;
  activeTemplate: SourceTemplate | null;
  latestBpm: number | null;
  isAudioSuspended: boolean;
  onGuideTrackChange: (path: string | null) => void;
  onResumeAudio: () => void;
}) {
  const t = useT();

  const handleTrackChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onGuideTrackChange(event.target.value || null);
  };

  return (
    <div className="monitor-waveform-label monitor-pro-header">
      <div className="header-status-group">
        <span className="monitor-waveform-dot heartbeat" />
        <span className="monitor-waveform-label-text">
          {isPlayback ? t.simpleMode.monitor.sessionReplay : t.simpleMode.monitor.liveSignalEngine}
        </span>
        <span className="monitor-waveform-label-session" title={session.sourcePath}>
          {session.repoTitle}
        </span>
      </div>

      <div className="monitor-header-controls">
        <MonitorWaveformTemplateChip template={activeTemplate} liveBpm={latestBpm} />
        <label className="header-controls-label">{t.simpleMode.monitor.listeningBed}</label>
        <select
          className="monitor-track-select monitor-track-select--header"
          value={guideTrackPath ?? ""}
          onChange={handleTrackChange}
        >
          <option value="">{t.simpleMode.monitor.noListeningBed}</option>
          {tracks
            .filter((track) => !!resolvePlayableTrackPath(track))
            .map((track) => (
              <option key={track.id} value={resolvePlayableTrackPath(track) ?? ""}>
                {getTrackTitle(track)}
              </option>
            ))}
        </select>
        {isAudioSuspended && (
          <button
            type="button"
            className="resume-audio-btn"
            onClick={onResumeAudio}
            title={t.simpleMode.monitor.resumeAudioTitle}
          >
            ⏵ {t.simpleMode.monitor.enableAudio}
          </button>
        )}
      </div>
    </div>
  );
}
