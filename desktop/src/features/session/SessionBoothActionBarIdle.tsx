import { Play, Radio } from "lucide-react";

import type { SessionBoothActionBarIdleProps } from "./sessionBoothActionBarTypes";

function SessionBoothDirectFeedLauncher({
  directPath,
  isDirectLoading,
  directLaunchDisabled,
  labels,
  onDirectPathChange,
  onDirectLaunch,
}: Pick<
  SessionBoothActionBarIdleProps,
  | "directPath"
  | "isDirectLoading"
  | "directLaunchDisabled"
  | "labels"
  | "onDirectPathChange"
  | "onDirectLaunch"
>) {
  return (
    <div className="direct-feed-input-group">
      <input
        type="text"
        className="direct-feed-input"
        placeholder={labels.pastePath}
        value={directPath}
        onChange={(event) => onDirectPathChange(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && onDirectLaunch()}
      />
      <button
        className="direct-launch-btn"
        onClick={onDirectLaunch}
        disabled={directLaunchDisabled}
      >
        {isDirectLoading ? labels.launching : labels.launch}
      </button>
    </div>
  );
}

export function SessionBoothActionBarIdle({
  mutating,
  directPath,
  isDirectLoading,
  showResumeSelected,
  showReplaySelected,
  directLaunchDisabled,
  startDisabled,
  labels,
  onDirectPathChange,
  onDirectLaunch,
  onResumeSelected,
  onReplaySelected,
  onCreateSession,
}: SessionBoothActionBarIdleProps) {
  return (
    <div className="session-booth-actions">
      <SessionBoothDirectFeedLauncher
        directPath={directPath}
        isDirectLoading={isDirectLoading}
        directLaunchDisabled={directLaunchDisabled}
        labels={labels}
        onDirectPathChange={onDirectPathChange}
        onDirectLaunch={onDirectLaunch}
      />
      {showResumeSelected ? (
        <button
          type="button"
          className="secondary-action"
          onClick={onResumeSelected}
          disabled={mutating}
        >
          <Play size={14} />
          {labels.resumeSelected}
        </button>
      ) : null}
      {showReplaySelected ? (
        <button
          type="button"
          className="secondary-action"
          onClick={onReplaySelected}
          disabled={mutating}
        >
          <Radio size={14} />
          {labels.replaySelected}
        </button>
      ) : null}
      <button type="button" className="action" onClick={onCreateSession} disabled={startDisabled}>
        <Play size={14} />
        {labels.startSession}
      </button>
    </div>
  );
}
