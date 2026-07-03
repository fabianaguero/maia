import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { SessionBoothViewModel } from "./sessionBoothViewModel";
import { SessionBoothSignalCard } from "./SessionBoothSignalCard";
import { SessionBoothWatchCard } from "./SessionBoothWatchCard";

interface SessionBoothDetailGridProps {
  booth: SessionBoothViewModel;
  latestUpdate: LiveLogStreamUpdate | null;
  playbackActive: boolean;
  readyToRun: boolean;
  labels: {
    signalSnapshot: string;
    latestWindowLines: string;
    waitingStreamData: string;
    awaitingInput: string;
    noLevelBreakdown: string;
    topComponentsSoon: string;
    replayNotes: string;
    watchouts: string;
    latestWindowAnomalies: string;
    noCurrentBurst: string;
    runBoothHint: string;
    sourceActiveHint: string;
  };
}

export function SessionBoothDetailGrid({
  booth,
  latestUpdate,
  playbackActive,
  readyToRun,
  labels,
}: SessionBoothDetailGridProps) {
  return (
    <div className="session-booth-detail-grid">
      <SessionBoothSignalCard
        booth={booth}
        latestUpdate={latestUpdate}
        labels={{
          signalSnapshot: labels.signalSnapshot,
          latestWindowLines: labels.latestWindowLines,
          waitingStreamData: labels.waitingStreamData,
          awaitingInput: labels.awaitingInput,
          noLevelBreakdown: labels.noLevelBreakdown,
          topComponentsSoon: labels.topComponentsSoon,
        }}
      />

      <SessionBoothWatchCard
        booth={booth}
        latestUpdate={latestUpdate}
        playbackActive={playbackActive}
        readyToRun={readyToRun}
        labels={{
          replayNotes: labels.replayNotes,
          watchouts: labels.watchouts,
          latestWindowAnomalies: labels.latestWindowAnomalies,
          noCurrentBurst: labels.noCurrentBurst,
          awaitingInput: labels.awaitingInput,
          runBoothHint: labels.runBoothHint,
          sourceActiveHint: labels.sourceActiveHint,
        }}
      />
    </div>
  );
}
