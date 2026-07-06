import type { AppTranslations } from "../../../i18n/types";
import type { ActiveMonitorSession, MonitorMetrics } from "../../monitor/monitorContextTypes";
import {
  resolveBounceActionLabel,
  resolveCueEngineStateLabel,
  resolveSessionCardDisplay,
  type SessionCardDisplay,
} from "./liveLogMonitorDisplayRuntime";
import type { SampleEngineStatus } from "./liveLogMonitorViewModel";

export function buildLiveLogMonitorPanelStatusDisplayState(input: {
  t: AppTranslations;
  bounceWindowCount: number;
  bounceWindowSeconds: number;
  sampleStatus: SampleEngineStatus;
  sampleSourceCount: number;
  liveEnabled: boolean;
  session: ActiveMonitorSession | null;
  replayActive: boolean;
  playbackPercent: number | null;
  metrics: MonitorMetrics;
}): {
  bounceAction: { label: string; title: string } | null;
  cueEngineStateLabel: string;
  sessionCardDisplay: SessionCardDisplay | null;
} {
  const bounceAction = resolveBounceActionLabel(input.bounceWindowCount, input.bounceWindowSeconds);
  const cueEngineStateLabel = resolveCueEngineStateLabel({
    sampleStatus: input.sampleStatus,
    sampleSourceCount: input.sampleSourceCount,
    labels: {
      cueEngineBaseSamplePack: input.t.inspect.cueEngineBaseSamplePack,
      cueEngineBaseSample: input.t.inspect.cueEngineBaseSample,
      cueEngineLoadingSample: input.t.inspect.cueEngineLoadingSample,
      cueEngineInternalSynth: input.t.inspect.cueEngineInternalSynth,
    },
  });

  const sessionCardDisplay =
    input.liveEnabled && input.session
      ? resolveSessionCardDisplay({
          session: input.session,
          replayActive: input.replayActive,
          playbackPercent: input.playbackPercent,
          windowsHeard: input.metrics.windowCount,
          labels: {
            replaySessionTitle: input.t.inspect.replaySession,
            sessionTitle: input.t.inspect.sessionLabel,
            storedSourceReplay: input.t.inspect.storedSourceReplay,
            fallbackDirectFilePoll: input.t.inspect.fallbackDirectFilePoll,
            replayComplete: input.t.session.complete,
            windowsReplayed: input.t.inspect.windowsReplayed,
          },
        })
      : null;

  return {
    bounceAction,
    cueEngineStateLabel,
    sessionCardDisplay,
  };
}
