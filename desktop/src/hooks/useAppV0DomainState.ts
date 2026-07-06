import { useBaseAssets } from "./useBaseAssets";
import { useCompositionResults } from "./useCompositionResults";
import { useLibrary } from "./useLibrary";
import { useRepositories } from "./useRepositories";
import { useSessions } from "./useSessions";
import { useAppV0PreferencesState } from "./useAppV0PreferencesState";
import { useAppV0ShellState } from "./useAppV0ShellState";
import { buildAppV0DomainState } from "./appV0DomainStateRuntime";
import { useMonitor } from "../features/monitor/MonitorContext";
import { useUserMode } from "../features/simple/UserModeContext";

export function useAppV0DomainState() {
  const { userMode } = useUserMode();
  const preferences = useAppV0PreferencesState();
  const shellState = useAppV0ShellState();
  const library = useLibrary();
  const repositories = useRepositories();
  const baseAssets = useBaseAssets();
  useCompositionResults();
  const monitor = useMonitor();
  const pastSessions = useSessions();

  return buildAppV0DomainState({
    userMode,
    preferences,
    shellState,
    library,
    repositories,
    baseAssets,
    monitor,
    pastSessions,
  });
}
