import type { AppV0Language } from "../appV0Preferences";
import type { AppSection } from "../features/simple/appSections";
import type { AppSkin } from "../features/simple/appSkin";
import type { MonitorSetupPreferences } from "../features/simple/monitorSetupPreferences";
import type { UserMode } from "../features/simple/UserModeContext";
import type { RepositoryAnalysis } from "../types/library";
import type { LiveLogStreamUpdate, StartSessionInput, StreamSessionRecord } from "../types/monitor";
import type {
  AppV0BaseAssetBindings,
  AppV0LibraryBindings,
  AppV0MonitorBindings,
  AppV0PastSessionsBindings,
  AppV0RepositoryBindings,
} from "./appV0ScreenModelTypes";

export interface AppV0PreferencesBindings {
  lang: AppV0Language;
  setLang: (lang: AppV0Language) => void;
  skin: AppSkin;
  setSkin: (skin: AppSkin) => void;
  setupPreferences: MonitorSetupPreferences;
  updateSetupPreference: <K extends keyof MonitorSetupPreferences>(
    key: K,
    value: MonitorSetupPreferences[K],
  ) => void;
}

export interface AppV0ShellBindings {
  currentSection: AppSection;
  setCurrentSection: (section: AppSection) => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  isConsoleExpanded: boolean;
  toggleConsoleExpanded: () => void;
  openMonitorInspector: () => void;
}

export interface AppV0DomainState {
  userMode: UserMode;
  preferences: AppV0PreferencesBindings;
  shellState: AppV0ShellBindings;
  library: AppV0LibraryBindings;
  repositories: AppV0RepositoryBindings & {
    selectedRepository?: {
      title?: string | null;
    } | null;
  };
  baseAssets: AppV0BaseAssetBindings;
  monitor: AppV0MonitorBindings & {
    setGuideTrack: (path: string) => void;
    attachSession: (input: {
      session: StreamSessionRecord;
      repoId: string;
      repoTitle: string;
      trackId?: string;
      trackTitle?: string;
      initialStreamUpdate?: LiveLogStreamUpdate | null;
      sourceTemplateId?: string | null;
      persistedSessionId?: string | null;
    }) => Promise<boolean>;
    startSession: (repo: RepositoryAnalysis, input: StartSessionInput) => Promise<boolean>;
    playbackSession: (input: {
      sessionId: string;
      sourcePath: string;
      label: string;
      repoId?: string | null;
    }) => Promise<boolean> | Promise<void>;
  };
  pastSessions: AppV0PastSessionsBindings;
}

export function buildAppV0DomainState(input: AppV0DomainState): AppV0DomainState {
  return input;
}
