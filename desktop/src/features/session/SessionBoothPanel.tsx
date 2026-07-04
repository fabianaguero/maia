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
import {
  buildSessionBoothDetailProps,
  buildSessionBoothHeaderProps,
  buildSessionBoothProgressProps,
  buildSessionBoothRouteProps,
} from "./sessionBoothPanelRuntime";

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
  const headerProps = buildSessionBoothHeaderProps({
    t,
    booth,
    playbackActive,
    liveMonitorActive,
    mutating,
    readyToRun,
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
  });
  const progressProps = buildSessionBoothProgressProps({
    booth,
    playbackActive,
    liveMonitorActive,
  });
  const routeProps = buildSessionBoothRouteProps({
    t,
    booth,
    monitorSessionId,
    mode,
  });
  const detailProps = buildSessionBoothDetailProps({
    t,
    booth,
    latestUpdate,
    playbackActive,
    readyToRun,
  });

  return (
    <section className="panel session-booth-panel">
      <SessionBoothHeader {...headerProps} />

      <SessionBoothProgress {...progressProps} />

      <div className="session-booth-grid">
        <SessionBoothRouteGrid {...routeProps} />

        <SessionBoothStatsGrid stats={booth.stats} />
      </div>

      <SessionBoothDetailGrid {...detailProps} />
    </section>
  );
}
