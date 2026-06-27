import { describe, expect, it } from "vitest";

import { buildAppSectionContentState } from "../src/appSectionContentRuntime";

describe("buildAppSectionContentState", () => {
  it("shows the simple wizard when there are no repositories and no active session", () => {
    expect(
      buildAppSectionContentState({
        userMode: "simple",
        effectivePillar: "curate",
        effectiveScreen: "library",
        hasMonitorSession: false,
        repositoryCount: 0,
      }),
    ).toMatchObject({
      showSimpleWizard: true,
      showSimpleLibrary: false,
      showExpertLibrary: false,
      showInspect: false,
      showCompose: false,
      showSession: false,
    });
  });

  it("routes expert inspect and design states explicitly", () => {
    expect(
      buildAppSectionContentState({
        userMode: "expert",
        effectivePillar: "curate",
        effectiveScreen: "inspect",
        hasMonitorSession: false,
        repositoryCount: 2,
      }),
    ).toMatchObject({
      showInspect: true,
      showExpertLibrary: false,
    });

    expect(
      buildAppSectionContentState({
        userMode: "expert",
        effectivePillar: "design",
        effectiveScreen: "compose",
        hasMonitorSession: false,
        repositoryCount: 2,
      }),
    ).toMatchObject({
      showCompose: true,
      showInspect: false,
    });
  });

  it("keeps perform sessions independent from library state", () => {
    expect(
      buildAppSectionContentState({
        userMode: "simple",
        effectivePillar: "perform",
        effectiveScreen: "session",
        hasMonitorSession: true,
        repositoryCount: 0,
      }),
    ).toMatchObject({
      showSession: true,
      showSimpleWizard: false,
      showSimpleLibrary: false,
    });
  });
});
