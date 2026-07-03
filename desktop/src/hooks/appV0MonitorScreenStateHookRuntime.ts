import type { AppV0MonitorLaunchExecutionResult } from "../appV0MonitorRuntime";
import type {
  BuildAppV0MonitorOrchestratorInput,
  buildAppV0MonitorOrchestrator,
  buildAppV0MonitorStateModel,
} from "./appV0MonitorScreenStateRuntime";
import type { UseAppV0MonitorScreenStateInput } from "./useAppV0MonitorScreenState";

type ReportAppV0MonitorLaunchFailure = (
  scope: "library" | "source",
  result: AppV0MonitorLaunchExecutionResult,
  reporter?: (message?: unknown, ...optionalParams: unknown[]) => void,
) => void;

export interface AppV0MonitorScreenStateHookResult {
  t: ReturnType<typeof buildAppV0MonitorStateModel>["t"];
  isMonitoring: ReturnType<typeof buildAppV0MonitorStateModel>["isMonitoring"];
  uptimeLabel: ReturnType<typeof buildAppV0MonitorStateModel>["uptimeLabel"];
  fallbackViewModel: ReturnType<typeof buildAppV0MonitorStateModel>["fallbackViewModel"];
  monitorOrchestrator: ReturnType<typeof buildAppV0MonitorOrchestrator>;
  shellViewModel: ReturnType<typeof buildAppV0MonitorStateModel>["shellViewModel"];
  waveformBins: ReturnType<typeof buildAppV0MonitorStateModel>["waveformBins"];
  reportMonitorLaunchFailure: ReportAppV0MonitorLaunchFailure;
}

export function buildAppV0MonitorStateModelInput(
  input: UseAppV0MonitorScreenStateInput,
) {
  return {
    lang: input.lang,
    currentSection: input.currentSection,
    selectedRepositoryTitle: input.selectedRepositoryTitle ?? null,
    selectedTrack: input.selectedTrack,
    tracks: input.tracks,
    session: input.session,
    metrics: input.metrics,
  };
}

export function buildAppV0MonitorOrchestratorInput(
  input: UseAppV0MonitorScreenStateInput,
): BuildAppV0MonitorOrchestratorInput {
  return {
    repositories: input.repositories,
    tracks: input.tracks,
    selectedTrack: input.selectedTrack,
    setGuideTrack: input.setGuideTrack,
    resumeAudio: input.resumeAudio,
    attachSession: input.attachSession,
    startSession: input.startSession,
    playbackSession: input.playbackSession,
    onLaunchSuccess: () => input.setCurrentSection("monitor"),
  };
}

export function buildAppV0MonitorScreenStateHookResult(input: {
  stateModel: ReturnType<typeof buildAppV0MonitorStateModel>;
  monitorOrchestrator: ReturnType<typeof buildAppV0MonitorOrchestrator>;
  reportMonitorLaunchFailure: ReportAppV0MonitorLaunchFailure;
}): AppV0MonitorScreenStateHookResult {
  return {
    t: input.stateModel.t,
    isMonitoring: input.stateModel.isMonitoring,
    uptimeLabel: input.stateModel.uptimeLabel,
    fallbackViewModel: input.stateModel.fallbackViewModel,
    monitorOrchestrator: input.monitorOrchestrator,
    shellViewModel: input.stateModel.shellViewModel,
    waveformBins: input.stateModel.waveformBins,
    reportMonitorLaunchFailure: input.reportMonitorLaunchFailure,
  };
}
