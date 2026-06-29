import { useT } from "../../i18n/I18nContext";
import type { PersistedSession } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import { resolveModeLabel, type QuickSessionMode } from "./sessionDisplay";
import type { SessionBoothViewModel } from "./sessionBoothViewModel";
import { SessionBoothActionBar } from "./SessionBoothActionBar";
import { SessionBoothSignalCard } from "./SessionBoothSignalCard";
import { SessionBoothWatchCard } from "./SessionBoothWatchCard";

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

        <SessionBoothActionBar
          playbackActive={playbackActive}
          liveMonitorActive={liveMonitorActive}
          mutating={mutating}
          readyToRun={readyToRun}
          isPlaybackPaused={isPlaybackPaused}
          directPath={directPath}
          isDirectLoading={isDirectLoading}
          selectedSession={selectedSession}
          creating={creating}
          labels={{
            prevWindow: t.session.prevWindow,
            nextWindow: t.session.nextWindow,
            resumeReplay: t.session.resumeReplay,
            pauseReplay: t.session.pauseReplay,
            exitReplay: t.session.exitReplay,
            stopSession: t.session.stopSession,
            pastePath: t.session.pastePath,
            launching: t.session.launching,
            launch: t.session.launch,
            resumeSelected: t.session.resumeSelected,
            replaySelected: t.session.replaySelected,
            startSession: t.session.startSession,
          }}
          onDirectPathChange={onDirectPathChange}
          onDirectLaunch={onDirectLaunch}
          onResumeSelected={onResumeSelected}
          onReplaySelected={onReplaySelected}
          onCreateSession={onCreateSession}
          onStepPlaybackWindow={onStepPlaybackWindow}
          onToggleReplayPlayback={onToggleReplayPlayback}
          onStopSession={onStopSession}
        />
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
        <SessionBoothSignalCard
          booth={booth}
          latestUpdate={latestUpdate}
          labels={{
            signalSnapshot: t.session.signalSnapshot,
            latestWindowLines: t.session.latestWindowLines,
            waitingStreamData: t.session.waitingStreamData,
            awaitingInput: t.session.awaitingInput,
            noLevelBreakdown: t.session.noLevelBreakdown,
            topComponentsSoon: t.session.topComponentsSoon,
          }}
        />

        <SessionBoothWatchCard
          booth={booth}
          latestUpdate={latestUpdate}
          playbackActive={playbackActive}
          readyToRun={readyToRun}
          labels={{
            replayNotes: t.session.replayNotes,
            watchouts: t.session.watchouts,
            latestWindowAnomalies: t.session.latestWindowAnomalies,
            noCurrentBurst: t.session.noCurrentBurst,
            awaitingInput: t.session.awaitingInput,
            runBoothHint: t.session.runBoothHint,
            sourceActiveHint: t.session.sourceActiveHint,
          }}
        />
      </div>
    </section>
  );
}
