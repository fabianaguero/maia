import type { useMonitor } from "../features/monitor/MonitorContext";
import { en } from "../i18n/en";
import { es } from "../i18n/es";
import type { useBaseAssets } from "./useBaseAssets";
import type { useAppContentBootstrap } from "./useAppContentBootstrap";
import type { useAppContentShellState } from "./useAppContentShellState";
import type { useCompositionResults } from "./useCompositionResults";
import type { useLibrary } from "./useLibrary";
import type { useRepositories } from "./useRepositories";
import type { useSessions } from "./useSessions";

export interface AppContentDomainStateValue {
  userMode: "simple" | "expert";
  isTransitioning: boolean;
  manifest: ReturnType<typeof useAppContentBootstrap>["manifest"];
  health: ReturnType<typeof useAppContentBootstrap>["health"];
  booting: ReturnType<typeof useAppContentBootstrap>["booting"];
  shellState: ReturnType<typeof useAppContentShellState>;
  t: typeof en | typeof es;
  library: ReturnType<typeof useLibrary>;
  repositories: ReturnType<typeof useRepositories>;
  baseAssets: ReturnType<typeof useBaseAssets>;
  compositions: ReturnType<typeof useCompositionResults>;
  monitor: ReturnType<typeof useMonitor>;
  sessions: ReturnType<typeof useSessions>;
}

export function resolveAppContentTranslations(lang: "en" | "es") {
  return lang === "es" ? es : en;
}

export function buildAppContentDomainStateValue(
  input: Omit<AppContentDomainStateValue, "t">,
): AppContentDomainStateValue {
  return {
    userMode: input.userMode,
    isTransitioning: input.isTransitioning,
    manifest: input.manifest,
    health: input.health,
    booting: input.booting,
    shellState: input.shellState,
    t: resolveAppContentTranslations(input.shellState.lang),
    library: input.library,
    repositories: input.repositories,
    baseAssets: input.baseAssets,
    compositions: input.compositions,
    monitor: input.monitor,
    sessions: input.sessions,
  };
}
