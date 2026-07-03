import { useMonitor } from "../features/monitor/MonitorContext";
import type { LibraryTrack } from "../types/library";
import { useT } from "../i18n/I18nContext";
import { MonitorWaveformBarHeader } from "./MonitorWaveformBarHeader";
import { MonitorWaveformBarTailHud } from "./MonitorWaveformBarTailHud";
import { useMonitorWaveformBarController } from "./useMonitorWaveformBarController";

// ---------------------------------------------------------------------------
// Monitor Pro v5: Real-Time Kinetic Engine
// Fixed "fake tail" repetition using offset tracking and burst processing.
// ---------------------------------------------------------------------------

export function MonitorWaveformBar({ tracks = [] }: { tracks?: LibraryTrack[] }) {
  const t = useT();
  const monitor = useMonitor();
  const { canvasRef, hasSession, hudLines, latestBpm, isAudioSuspended } =
    useMonitorWaveformBarController({
      monitor,
      tracks,
    });

  return (
    <div className={`monitor-waveform-bar${hasSession ? " monitor-waveform-bar--active" : ""}`}>
      {hasSession && (
        <MonitorWaveformBarHeader
          session={monitor.session!}
          isPlayback={monitor.isPlayback}
          tracks={tracks}
          guideTrackPath={monitor.guideTrackPath}
          activeTemplate={monitor.activeTemplate ?? null}
          latestBpm={latestBpm}
          isAudioSuspended={isAudioSuspended}
          onGuideTrackChange={monitor.setGuideTrack}
          onResumeAudio={() => void monitor.resumeAudio()}
        />
      )}
      <div className="monitor-waveform-wave-area compact-mode">
        <canvas ref={canvasRef} className="monitor-waveform-canvas" />
        <div className="wave-track-labels">
          <div className="track-label-lcd">
            <span className="lcd-tag" title={t.simpleMode.monitor.channelATitle}>
              {t.simpleMode.monitor.channelATag}
            </span>
            <span className="lcd-title">{t.simpleMode.monitor.rawTelemetry}</span>
          </div>
          <div className="track-label-lcd">
            <span className="lcd-tag" title={t.simpleMode.monitor.channelBTitle}>
              {t.simpleMode.monitor.channelBTag}
            </span>
            <span className="lcd-title">{t.simpleMode.monitor.sonifiedMapping}</span>
          </div>
        </div>
      </div>

      {hasSession && <MonitorWaveformBarTailHud hudLines={hudLines} />}
    </div>
  );
}
