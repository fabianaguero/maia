import { useT } from "../../i18n/I18nContext";
import type { PersistedSession } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { QuickSessionMode } from "./sessionDisplay";
import type { SessionBoothViewModel } from "./sessionBoothViewModel";
import { SessionBoothDetailGrid } from "./SessionBoothDetailGrid";
import { SessionBoothHeader } from "./SessionBoothHeader";
import { SessionBoothProgress } from "./SessionBoothProgress";
import { SessionBoothRouteGrid } from "./SessionBoothRouteGrid";
import { SessionBoothStatsGrid } from "./SessionBoothStatsGrid";

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
      <SessionBoothHeader
        stateTone={booth.state.tone}
        stateLabel={booth.state.label}
        eyebrowLabel={t.session.liveBooth}
        headline={booth.headline}
        summary={booth.summary}
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

      <SessionBoothProgress
        visible={playbackActive || liveMonitorActive}
        progressAriaLabel={booth.progressAriaLabel}
        progressWidth={booth.progressWidth}
      />

      <div className="session-booth-grid">
        <SessionBoothRouteGrid
          booth={booth}
          monitorSessionId={monitorSessionId}
          mode={mode}
          labels={{
            sourceFeed: t.session.sourceFeed,
            baseBed: t.session.baseBed,
            adapter: t.session.adapter,
            notSelected: t.session.notSelected,
            pickSourceHint: t.session.pickSourceHint,
            notArmed: t.session.notArmed,
            baseBedHint: t.session.baseBedHint,
            sessionRef: t.session.sessionRef,
            readyToLaunchMode: t.session.readyToLaunchMode,
            logFile: t.session.logFile,
            repository: t.session.repository,
          }}
        />

        <SessionBoothStatsGrid stats={booth.stats} />
      </div>

      <SessionBoothDetailGrid
        booth={booth}
        latestUpdate={latestUpdate}
        playbackActive={playbackActive}
        readyToRun={readyToRun}
        labels={{
          signalSnapshot: t.session.signalSnapshot,
          latestWindowLines: t.session.latestWindowLines,
          waitingStreamData: t.session.waitingStreamData,
          awaitingInput: t.session.awaitingInput,
          noLevelBreakdown: t.session.noLevelBreakdown,
          topComponentsSoon: t.session.topComponentsSoon,
          replayNotes: t.session.replayNotes,
          watchouts: t.session.watchouts,
          latestWindowAnomalies: t.session.latestWindowAnomalies,
          noCurrentBurst: t.session.noCurrentBurst,
          runBoothHint: t.session.runBoothHint,
          sourceActiveHint: t.session.sourceActiveHint,
        }}
      />
    </section>
  );
}
