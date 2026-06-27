import type { AppTranslations } from "../i18n/en";
import type { UserMode } from "../features/simple/UserModeContext";
import type { AppSection } from "../features/simple/appSections";
import type { AppPillar } from "../types/library";

export interface ShellNavItemViewModel {
  id: AppSection;
  label: string;
  subtitle: string;
  lane?: string;
}

export interface SidebarNavItemViewModel {
  id: AppPillar;
  label: string;
  description: string;
  lane: string | null;
  detail: string;
}

export function buildShellNavItems(input: {
  t: AppTranslations;
  userMode: UserMode;
}): ShellNavItemViewModel[] {
  const { t, userMode } = input;

  return userMode === "simple"
    ? [
        {
          id: "monitor",
          label: t.simpleMode.nav.monitor,
          subtitle: t.simpleMode.setup.monitorSubtitle,
        },
        {
          id: "connections",
          label: t.simpleMode.nav.connections,
          subtitle: t.simpleMode.setup.connectionsSubtitle,
        },
        {
          id: "setup",
          label: t.simpleMode.nav.setup,
          subtitle: t.simpleMode.setup.setupSubtitle,
        },
        {
          id: "library",
          label: t.simpleMode.nav.files,
          subtitle: t.simpleMode.setup.filesSubtitle,
        },
      ]
    : [
        {
          id: "monitor",
          label: t.nav.session.label,
          subtitle: t.nav.session.description,
          lane: "A01",
        },
        {
          id: "connections",
          label: t.simpleMode.nav.connections,
          subtitle: t.simpleMode.shell.connectionsExpertSubtitle,
          lane: "B02",
        },
        {
          id: "setup",
          label: t.simpleMode.nav.setup,
          subtitle: t.simpleMode.shell.setupExpertSubtitle,
          lane: "C03",
        },
        {
          id: "compose",
          label: t.nav.compose.label,
          subtitle: t.nav.compose.description,
          lane: "D04",
        },
        {
          id: "library",
          label: t.nav.library.label,
          subtitle: t.nav.library.description,
          lane: "E05",
        },
      ];
}

export function buildSidebarNavItems(input: {
  t: AppTranslations;
  userMode: UserMode;
  liveStatusLabel: string;
  monitorActive: boolean;
  trackCount: number;
  repositoryCount: number;
  compositionCount: number;
}): SidebarNavItemViewModel[] {
  const { t, userMode, liveStatusLabel, monitorActive, trackCount, repositoryCount, compositionCount } =
    input;
  const itemCount = trackCount + repositoryCount;

  return userMode === "simple"
    ? [
        {
          id: "perform",
          label: t.simpleMode.nav.monitor,
          description: t.simpleMode.shell.realTimeLogMonitoring,
          lane: null,
          detail: monitorActive ? liveStatusLabel : t.simpleMode.status.standby,
        },
        {
          id: "curate",
          label: t.simpleMode.nav.files,
          description: t.simpleMode.shell.manageFilesAndLogs,
          lane: null,
          detail: t.simpleMode.shell.items.replace("{count}", String(itemCount)),
        },
      ]
    : [
        {
          id: "perform",
          label: t.nav.pillars.perform.label,
          description: t.nav.pillars.perform.description,
          lane: t.nav.pillars.perform.lane,
          detail: monitorActive ? liveStatusLabel : t.simpleMode.status.standby,
        },
        {
          id: "design",
          label: t.nav.pillars.design.label,
          description: t.nav.pillars.design.description,
          lane: t.nav.pillars.design.lane,
          detail: t.simpleMode.shell.arrangementsCued.replace("{count}", String(compositionCount)),
        },
        {
          id: "curate",
          label: t.nav.pillars.curate.label,
          description: t.nav.pillars.curate.description,
          lane: t.nav.pillars.curate.lane,
          detail: t.simpleMode.shell.assetsInVault.replace("{count}", String(itemCount)),
        },
      ];
}
