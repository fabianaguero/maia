import { SessionBoothActionBar } from "./SessionBoothActionBar";
import type { PersistedSession } from "../../api/sessions";

interface SessionBoothHeaderProps {
  stateTone: string;
  stateLabel: string;
  eyebrowLabel: string;
  headline: string;
  summary: string;
  playbackActive: boolean;
  liveMonitorActive: boolean;
  mutating: boolean;
  readyToRun: boolean;
  isPlaybackPaused: boolean;
  directPath: string;
  isDirectLoading: boolean;
  selectedSession: PersistedSession | null;
  creating: boolean;
  labels: {
    prevWindow: string;
    nextWindow: string;
    resumeReplay: string;
    pauseReplay: string;
    exitReplay: string;
    stopSession: string;
    pastePath: string;
    launching: string;
    launch: string;
    resumeSelected: string;
    replaySelected: string;
    startSession: string;
  };
  onDirectPathChange: (value: string) => void;
  onDirectLaunch: () => void | Promise<void>;
  onResumeSelected: () => void;
  onReplaySelected: () => void | Promise<void>;
  onCreateSession: () => void | Promise<void>;
  onStepPlaybackWindow: (direction: 1 | -1) => void;
  onToggleReplayPlayback: () => void;
  onStopSession: () => void | Promise<void>;
}

export function SessionBoothHeader({
  stateTone,
  stateLabel,
  eyebrowLabel,
  headline,
  summary,
  playbackActive,
  liveMonitorActive,
  mutating,
  readyToRun,
  isPlaybackPaused,
  directPath,
  isDirectLoading,
  selectedSession,
  creating,
  labels,
  onDirectPathChange,
  onDirectLaunch,
  onResumeSelected,
  onReplaySelected,
  onCreateSession,
  onStepPlaybackWindow,
  onToggleReplayPlayback,
  onStopSession,
}: SessionBoothHeaderProps) {
  return (
    <div className="session-booth-head">
      <div className="session-booth-head-copy">
        <span className={`session-booth-status-badge ${stateTone}`}>{stateLabel}</span>
        <p className="eyebrow">{eyebrowLabel}</p>
        <h3>{headline}</h3>
        <p className="support-copy">{summary}</p>
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
        labels={labels}
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
  );
}
