import type { ComponentProps } from "react";

import type { SessionBoothPanel } from "./SessionBoothPanel";

export type SessionScreenBoothVisualState = Pick<
  ComponentProps<typeof SessionBoothPanel>,
  | "booth"
  | "playbackActive"
  | "liveMonitorActive"
  | "mutating"
  | "readyToRun"
  | "mode"
  | "latestUpdate"
  | "isPlaybackPaused"
  | "directPath"
  | "isDirectLoading"
  | "selectedSession"
  | "creating"
>;
