import { Pause } from "lucide-react";

import type { SessionBoothActionBarLiveProps } from "./sessionBoothActionBarTypes";

export function SessionBoothActionBarLive({
  mutating,
  labels,
  onStopSession,
}: SessionBoothActionBarLiveProps) {
  return (
    <div className="session-booth-actions">
      <button type="button" className="action" onClick={onStopSession} disabled={mutating}>
        <Pause size={14} />
        {labels.stopSession}
      </button>
    </div>
  );
}
