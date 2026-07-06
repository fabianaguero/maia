import { resolveModeLabel, type QuickSessionMode } from "./sessionDisplay";
import type { SessionBoothViewModel } from "./sessionBoothViewModel";

interface SessionBoothRouteGridProps {
  booth: SessionBoothViewModel;
  monitorSessionId: string | null;
  mode: QuickSessionMode;
  labels: {
    sourceFeed: string;
    baseBed: string;
    adapter: string;
    notSelected: string;
    pickSourceHint: string;
    notArmed: string;
    baseBedHint: string;
    sessionRef: string;
    readyToLaunchMode: string;
    logFile: string;
    repository: string;
  };
}

export function SessionBoothRouteGrid({
  booth,
  monitorSessionId,
  mode,
  labels,
}: SessionBoothRouteGridProps) {
  return (
    <div className="session-booth-route">
      <div className="session-booth-route-item">
        <span>{labels.sourceFeed}</span>
        <strong>{booth.sourceLabel ?? labels.notSelected}</strong>
        <small>{booth.sourcePath ?? labels.pickSourceHint}</small>
      </div>
      <div className="session-booth-route-item">
        <span>{labels.baseBed}</span>
        <strong>{booth.baseLabel ?? labels.notArmed}</strong>
        <small>{booth.baseDetail ?? labels.baseBedHint}</small>
      </div>
      <div className="session-booth-route-item">
        <span>{labels.adapter}</span>
        <strong>{booth.adapterLabel}</strong>
        <small>
          {monitorSessionId
            ? labels.sessionRef.replace("{id}", monitorSessionId)
            : labels.readyToLaunchMode.replace(
                "{mode}",
                resolveModeLabel(mode, labels.logFile, labels.repository).toLowerCase(),
              )}
        </small>
      </div>
    </div>
  );
}
