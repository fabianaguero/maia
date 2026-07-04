import type { SessionMonitorDraft } from "../appMonitorActionsRuntime";
import type { UseAppMonitorActionsInput } from "./appMonitorActionsTypes";

type SessionActionsInput = Pick<
  UseAppMonitorActionsInput,
  | "t"
  | "repositories"
  | "sessions"
  | "monitor"
  | "notify"
  | "setAnalysisMode"
  | "setScreen"
  | "setPillar"
>;

export interface MonitorGuideActions {
  armSessionMusicalBase: (draft?: SessionMonitorDraft) => void;
  primeMonitorGuideTrack: (draft?: SessionMonitorDraft) => void;
}

export type UseAppMonitorSessionActionsInput = SessionActionsInput & MonitorGuideActions;

export interface AppMonitorReplayActionInput {
  t: SessionActionsInput["t"];
  repositories: SessionActionsInput["repositories"];
  sessions: SessionActionsInput["sessions"];
  monitor: SessionActionsInput["monitor"];
  notify: SessionActionsInput["notify"];
  setAnalysisMode: SessionActionsInput["setAnalysisMode"];
  setScreen: SessionActionsInput["setScreen"];
  armSessionMusicalBase: MonitorGuideActions["armSessionMusicalBase"];
  primeMonitorGuideTrack: MonitorGuideActions["primeMonitorGuideTrack"];
}

export interface AppMonitorLiveActionInput {
  t: SessionActionsInput["t"];
  repositories: SessionActionsInput["repositories"];
  sessions: SessionActionsInput["sessions"];
  monitor: SessionActionsInput["monitor"];
  armSessionMusicalBase: MonitorGuideActions["armSessionMusicalBase"];
  primeMonitorGuideTrack: MonitorGuideActions["primeMonitorGuideTrack"];
}

export interface AppMonitorOpenRepoActionInput {
  repositories: SessionActionsInput["repositories"];
  monitor: SessionActionsInput["monitor"];
  setAnalysisMode: SessionActionsInput["setAnalysisMode"];
  setScreen: SessionActionsInput["setScreen"];
  setPillar: SessionActionsInput["setPillar"];
}

export function buildAppMonitorReplayActionInput(
  input: UseAppMonitorSessionActionsInput,
): AppMonitorReplayActionInput {
  return {
    t: input.t,
    repositories: input.repositories,
    sessions: input.sessions,
    monitor: input.monitor,
    notify: input.notify,
    setAnalysisMode: input.setAnalysisMode,
    setScreen: input.setScreen,
    armSessionMusicalBase: input.armSessionMusicalBase,
    primeMonitorGuideTrack: input.primeMonitorGuideTrack,
  };
}

export function buildAppMonitorLiveActionInput(
  input: UseAppMonitorSessionActionsInput,
): AppMonitorLiveActionInput {
  return {
    t: input.t,
    repositories: input.repositories,
    sessions: input.sessions,
    monitor: input.monitor,
    armSessionMusicalBase: input.armSessionMusicalBase,
    primeMonitorGuideTrack: input.primeMonitorGuideTrack,
  };
}

export function buildAppMonitorOpenRepoActionInput(
  input: UseAppMonitorSessionActionsInput,
): AppMonitorOpenRepoActionInput {
  return {
    repositories: input.repositories,
    monitor: input.monitor,
    setAnalysisMode: input.setAnalysisMode,
    setScreen: input.setScreen,
    setPillar: input.setPillar,
  };
}
