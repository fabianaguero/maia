import type { ComponentProps, ReactNode } from "react";
import { LiveLogMonitorOperationsPanel } from "./LiveLogMonitorOperationsPanel";
import { LiveLogMonitorPlaylistSummary } from "./LiveLogMonitorPlaylistSummary";
import { LiveLogMonitorReplaySection } from "./LiveLogMonitorReplaySection";
import { LiveLogMonitorSessionCard } from "./LiveLogMonitorSessionCard";

interface LiveLogMonitorLiveDeckProps {
  liveEnabled: boolean;
  hasBasePlaylist: boolean;
  playlistSummaryProps: ComponentProps<typeof LiveLogMonitorPlaylistSummary>;
  sessionCardProps: ComponentProps<typeof LiveLogMonitorSessionCard> | null;
  replaySectionProps: ComponentProps<typeof LiveLogMonitorReplaySection>;
  operationsPanelProps: ComponentProps<typeof LiveLogMonitorOperationsPanel>;
  activeDeckContent: ReactNode;
}

export function LiveLogMonitorLiveDeck({
  liveEnabled,
  hasBasePlaylist,
  playlistSummaryProps,
  sessionCardProps,
  replaySectionProps,
  operationsPanelProps,
  activeDeckContent,
}: LiveLogMonitorLiveDeckProps) {
  return (
    <>
      {liveEnabled && hasBasePlaylist ? (
        <LiveLogMonitorPlaylistSummary {...playlistSummaryProps} />
      ) : null}

      {liveEnabled && sessionCardProps ? <LiveLogMonitorSessionCard {...sessionCardProps} /> : null}

      <LiveLogMonitorReplaySection {...replaySectionProps} />

      <LiveLogMonitorOperationsPanel {...operationsPanelProps} />

      {activeDeckContent}
    </>
  );
}
