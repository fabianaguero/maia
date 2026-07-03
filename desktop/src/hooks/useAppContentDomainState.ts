import { useBaseAssets } from "../hooks/useBaseAssets";
import { useAppContentBootstrap } from "../hooks/useAppContentBootstrap";
import { useAppContentShellState } from "../hooks/useAppContentShellState";
import { useCompositionResults } from "../hooks/useCompositionResults";
import { useLibrary } from "../hooks/useLibrary";
import { useRepositories } from "../hooks/useRepositories";
import { useSessions } from "../hooks/useSessions";
import { en } from "../i18n/en";
import { es } from "../i18n/es";
import { useMonitor } from "../features/monitor/MonitorContext";
import { useModeTransition } from "../features/simple/ModeTransition";
import { useUserMode } from "../features/simple/UserModeContext";

export function useAppContentDomainState() {
  const { userMode } = useUserMode();
  const { isTransitioning } = useModeTransition();
  const { manifest, health, booting } = useAppContentBootstrap();
  const shellState = useAppContentShellState();
  const t = shellState.lang === "es" ? es : en;
  const library = useLibrary();
  const repositories = useRepositories();
  const baseAssets = useBaseAssets();
  const compositions = useCompositionResults();
  const monitor = useMonitor();
  const sessions = useSessions();

  return {
    userMode,
    isTransitioning,
    manifest,
    health,
    booting,
    shellState,
    t,
    library,
    repositories,
    baseAssets,
    compositions,
    monitor,
    sessions,
  };
}
