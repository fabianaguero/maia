import { resolveLiveMonitorCtaMeta } from "./liveLogMonitorSessionRuntime";

export function buildLiveLogMonitorCtaMetaLabel(input: {
  hasBaseListeningBed: boolean;
  baseTrackCount: number;
  soundsLabel: string;
  armedLabel: string;
  notArmedLabel: string;
  basePlaylistLabel: string;
  styleLabel: string;
  mutationLabel: string;
}): string {
  return resolveLiveMonitorCtaMeta(input);
}
