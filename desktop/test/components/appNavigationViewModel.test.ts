import { describe, expect, it } from "vitest";

import {
  buildShellNavItems,
  buildSidebarNavItems,
} from "../../src/components/appNavigationViewModel";
import { en } from "../../src/i18n/en";

describe("appNavigationViewModel", () => {
  it("builds simple shell navigation in monitoring-first order", () => {
    expect(
      buildShellNavItems({
        t: en,
        userMode: "simple",
      }),
    ).toEqual([
      {
        id: "monitor",
        label: en.simpleMode.nav.monitor,
        subtitle: en.simpleMode.setup.monitorSubtitle,
      },
      {
        id: "connections",
        label: en.simpleMode.nav.connections,
        subtitle: en.simpleMode.setup.connectionsSubtitle,
      },
      {
        id: "codeProjects",
        label: en.simpleMode.nav.codeProjects,
        subtitle: en.simpleMode.setup.codeProjectsSubtitle,
      },
      {
        id: "setup",
        label: en.simpleMode.nav.setup,
        subtitle: en.simpleMode.setup.setupSubtitle,
      },
      {
        id: "library",
        label: en.simpleMode.nav.files,
        subtitle: en.simpleMode.setup.filesSubtitle,
      },
    ]);
  });

  it("builds expert shell navigation with deck lanes", () => {
    expect(
      buildShellNavItems({
        t: en,
        userMode: "expert",
      }).map(({ id, lane }) => ({ id, lane })),
    ).toEqual([
      { id: "monitor", lane: "A01" },
      { id: "connections", lane: "B02" },
      { id: "codeProjects", lane: "C03" },
      { id: "setup", lane: "D04" },
      { id: "compose", lane: "E05" },
      { id: "library", lane: "F06" },
    ]);
  });

  it("builds simple sidebar details from live status and combined asset count", () => {
    expect(
      buildSidebarNavItems({
        t: en,
        userMode: "simple",
        liveStatusLabel: "System active",
        monitorActive: true,
        trackCount: 4,
        repositoryCount: 3,
        compositionCount: 2,
      }),
    ).toEqual([
      {
        id: "perform",
        label: en.simpleMode.nav.monitor,
        description: en.simpleMode.shell.realTimeLogMonitoring,
        lane: null,
        detail: "System active",
      },
      {
        id: "curate",
        label: en.simpleMode.nav.files,
        description: en.simpleMode.shell.manageFilesAndLogs,
        lane: null,
        detail: en.simpleMode.shell.items.replace("{count}", "7"),
      },
    ]);
  });

  it("builds expert sidebar details for arrangements and vault assets", () => {
    expect(
      buildSidebarNavItems({
        t: en,
        userMode: "expert",
        liveStatusLabel: "System active",
        monitorActive: false,
        trackCount: 5,
        repositoryCount: 1,
        compositionCount: 8,
      }),
    ).toEqual([
      {
        id: "perform",
        label: en.nav.pillars.perform.label,
        description: en.nav.pillars.perform.description,
        lane: en.nav.pillars.perform.lane,
        detail: en.simpleMode.status.standby,
      },
      {
        id: "design",
        label: en.nav.pillars.design.label,
        description: en.nav.pillars.design.description,
        lane: en.nav.pillars.design.lane,
        detail: en.simpleMode.shell.arrangementsCued.replace("{count}", "8"),
      },
      {
        id: "curate",
        label: en.nav.pillars.curate.label,
        description: en.nav.pillars.curate.description,
        lane: en.nav.pillars.curate.lane,
        detail: en.simpleMode.shell.assetsInVault.replace("{count}", "6"),
      },
    ]);
  });
});
