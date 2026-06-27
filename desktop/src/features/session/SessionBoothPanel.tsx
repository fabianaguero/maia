import {
  Activity,
  AlertCircle,
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
  TrendingUp,
} from "lucide-react";
import { useT } from "../../i18n/I18nContext";
import type { PersistedSession } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import { formatMonitorLevel, resolveModeLabel, type QuickSessionMode } from "./sessionDisplay";
import type { SessionBoothViewModel } from "./sessionBoothViewModel";

interface SessionBoothPanelProps {
  booth: SessionBoothViewModel;
  playbackActive: boolean;
  liveMonitorActive: boolean;
  mutating: boolean;
  readyToRun: boolean;
  mode: QuickSessionMode;
  latestUpdate: LiveLogStreamUpdate | null;
  monitorSessionId: string | null;
  isPlaybackPaused: boolean;
  directPath: string;
  isDirectLoading: boolean;
  selectedSession: PersistedSession | null;
  creating: boolean;
  onDirectPathChange: (value: string) => void;
  onDirectLaunch: () => void | Promise<void>;
  onResumeSelected: () => void;
  onReplaySelected: () => void | Promise<void>;
  onCreateSession: () => void | Promise<void>;
  onStepPlaybackWindow: (direction: 1 | -1) => void;
  onToggleReplayPlayback: () => void;
  onStopSession: () => void | Promise<void>;
}

export function SessionBoothPanel({
  booth,
  playbackActive,
  liveMonitorActive,
  mutating,
  readyToRun,
  mode,
  latestUpdate,
  monitorSessionId,
  isPlaybackPaused,
  directPath,
  isDirectLoading,
  selectedSession,
  creating,
  onDirectPathChange,
  onDirectLaunch,
  onResumeSelected,
  onReplaySelected,
  onCreateSession,
  onStepPlaybackWindow,
  onToggleReplayPlayback,
  onStopSession,
}: SessionBoothPanelProps) {
  const t = useT();

  return (
    <section className="panel session-booth-panel">
      <div className="session-booth-head">
        <div className="session-booth-head-copy">
          <span className={`session-booth-status-badge ${booth.state.tone}`}>
            {booth.state.label}
          </span>
          <p className="eyebrow">{t.session.liveBooth}</p>
          <h3>{booth.headline}</h3>
          <p className="support-copy">{booth.summary}</p>
        </div>

        <div className="session-booth-actions">
          {playbackActive ? (
            <>
              <button
                type="button"
                className="secondary-action"
                onClick={() => onStepPlaybackWindow(-1)}
                disabled={mutating}
              >
                <SkipBack size={14} />
                {t.session.prevWindow}
              </button>
              <button
                type="button"
                className="secondary-action"
                onClick={onToggleReplayPlayback}
                disabled={mutating}
              >
                {isPlaybackPaused ? <Play size={14} /> : <Pause size={14} />}
                {isPlaybackPaused ? t.session.resumeReplay : t.session.pauseReplay}
              </button>
              <button
                type="button"
                className="secondary-action"
                onClick={() => onStepPlaybackWindow(1)}
                disabled={mutating}
              >
                <SkipForward size={14} />
                {t.session.nextWindow}
              </button>
              <button type="button" className="action" onClick={onStopSession} disabled={mutating}>
                <Pause size={14} />
                {t.session.exitReplay}
              </button>
            </>
          ) : liveMonitorActive ? (
            <button type="button" className="action" onClick={onStopSession} disabled={mutating}>
              <Pause size={14} />
              {t.session.stopSession}
            </button>
          ) : (
            <>
              <div className="direct-feed-input-group">
                <input
                  type="text"
                  className="direct-feed-input"
                  placeholder={t.session.pastePath}
                  value={directPath}
                  onChange={(event) => onDirectPathChange(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && onDirectLaunch()}
                />
                <button
                  className="direct-launch-btn"
                  onClick={onDirectLaunch}
                  disabled={isDirectLoading || !directPath.trim()}
                >
                  {isDirectLoading ? t.session.launching : t.session.launch}
                </button>
              </div>
              {selectedSession && selectedSession.status === "paused" && (
                <button
                  type="button"
                  className="secondary-action"
                  onClick={onResumeSelected}
                  disabled={mutating}
                >
                  <Play size={14} />
                  {t.session.resumeSelected}
                </button>
              )}
              {selectedSession && selectedSession.totalPolls > 0 && (
                <button
                  type="button"
                  className="secondary-action"
                  onClick={onReplaySelected}
                  disabled={mutating}
                >
                  <Radio size={14} />
                  {t.session.replaySelected}
                </button>
              )}
              <button
                type="button"
                className="action"
                onClick={onCreateSession}
                disabled={creating || mutating || !readyToRun}
              >
                <Play size={14} />
                {t.session.startSession}
              </button>
            </>
          )}
        </div>
      </div>

      {(playbackActive || liveMonitorActive) && (
        <div className="session-booth-progress" aria-label={booth.progressAriaLabel}>
          <span
            style={{
              width: booth.progressWidth,
            }}
          />
        </div>
      )}

      <div className="session-booth-grid">
        <div className="session-booth-route">
          <div className="session-booth-route-item">
            <span>{t.session.sourceFeed}</span>
            <strong>{booth.sourceLabel ?? t.session.notSelected}</strong>
            <small>{booth.sourcePath ?? t.session.pickSourceHint}</small>
          </div>
          <div className="session-booth-route-item">
            <span>{t.session.baseBed}</span>
            <strong>{booth.baseLabel ?? t.session.notArmed}</strong>
            <small>{booth.baseDetail ?? t.session.baseBedHint}</small>
          </div>
          <div className="session-booth-route-item">
            <span>{t.session.adapter}</span>
            <strong>{booth.adapterLabel}</strong>
            <small>
              {monitorSessionId
                ? t.session.sessionRef.replace("{id}", monitorSessionId)
                : t.session.readyToLaunchMode.replace(
                    "{mode}",
                    resolveModeLabel(mode, t.session.logFile, t.session.repository).toLowerCase(),
                  )}
            </small>
          </div>
        </div>

        <div className="session-booth-stat-grid">
          {booth.stats.map((item) => (
            <article key={item.label} className="session-booth-stat">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.helper}</small>
            </article>
          ))}
        </div>
      </div>

      <div className="session-booth-detail-grid">
        <section className="session-booth-card">
          <div className="session-booth-card-header">
            <strong>{t.session.signalSnapshot}</strong>
            <span>
              {latestUpdate?.hasData
                ? t.session.latestWindowLines.replace("{count}", String(latestUpdate.lineCount))
                : t.session.waitingStreamData}
            </span>
          </div>
          <div className="session-signal-chip-row">
            {booth.levelCountEntries.length > 0 ? (
              booth.levelCountEntries.map(([level, count]) => (
                <span key={level} className="session-signal-chip">
                  {formatMonitorLevel(level, t.session.awaitingInput)} · {count}
                </span>
              ))
            ) : (
              <span className="session-signal-chip muted">{t.session.noLevelBreakdown}</span>
            )}
          </div>
          <div className="session-signal-chip-row">
            {booth.topComponents.length > 0 ? (
              booth.topComponents.map((component) => (
                <span key={component.component} className="session-signal-chip">
                  {component.component} · {component.count}
                </span>
              ))
            ) : (
              <span className="session-signal-chip muted">{t.session.topComponentsSoon}</span>
            )}
          </div>
        </section>

        <section className="session-booth-card">
          <div className="session-booth-card-header">
            <strong>{playbackActive ? t.session.replayNotes : t.session.watchouts}</strong>
            <span>
              {latestUpdate?.anomalyCount
                ? t.session.latestWindowAnomalies.replace(
                    "{count}",
                    String(latestUpdate.anomalyCount),
                  )
                : t.session.noCurrentBurst}
            </span>
          </div>
          {booth.warningItems.length > 0 || booth.anomalyMarkers.length > 0 ? (
            <div className="session-booth-list">
              {booth.warningItems.map((warning) => (
                <div key={warning} className="session-booth-list-item">
                  <AlertCircle size={14} />
                  <span>{warning}</span>
                </div>
              ))}
              {booth.anomalyMarkers.map((marker) => (
                <div
                  key={`${marker.eventIndex}-${marker.component}-${marker.excerpt}`}
                  className="session-booth-list-item"
                >
                  <TrendingUp size={14} />
                  <span>
                    {formatMonitorLevel(marker.level, t.session.awaitingInput)} · {marker.component}{" "}
                    · {marker.excerpt}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="session-booth-list-item muted">
              <Activity size={14} />
              <span>{readyToRun ? t.session.runBoothHint : t.session.sourceActiveHint}</span>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
