import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSessionBoothDetailLabels,
  buildSessionBoothDetailProps,
  buildSessionBoothHeaderLabels,
  buildSessionBoothHeaderProps,
  buildSessionBoothPanelDerivedState,
  buildSessionBoothPanelSections,
  buildSessionBoothProgressProps,
  buildSessionBoothRouteLabels,
  buildSessionBoothRouteProps,
} from "../../../src/features/session/sessionBoothPanelRuntime";

const booth = {
  state: {
    tone: "live",
    label: "Live",
  },
  headline: "Session live",
  summary: "Signal flowing",
  progressAriaLabel: "Live activity",
  progressWidth: "48%",
  stats: [],
} as never;

describe("sessionBoothPanelRuntime", () => {
  it("builds localized label groups for header, route and detail sections", () => {
    const headerLabels = buildSessionBoothHeaderLabels(en);
    const routeLabels = buildSessionBoothRouteLabels(en);
    const detailLabels = buildSessionBoothDetailLabels(en);

    expect(headerLabels.startSession).toBe(en.session.startSession);
    expect(routeLabels.sourceFeed).toBe(en.session.sourceFeed);
    expect(detailLabels.signalSnapshot).toBe(en.session.signalSnapshot);
  });

  it("composes subcomponent props from booth and playback state", () => {
    const onDirectPathChange = vi.fn();
    const headerProps = buildSessionBoothHeaderProps({
      t: en,
      booth,
      playbackActive: true,
      liveMonitorActive: false,
      mutating: false,
      readyToRun: true,
      isPlaybackPaused: false,
      directPath: "/logs/service.log",
      isDirectLoading: false,
      selectedSession: { id: "session-1" } as never,
      creating: false,
      onDirectPathChange,
      onDirectLaunch: vi.fn(),
      onResumeSelected: vi.fn(),
      onReplaySelected: vi.fn(),
      onCreateSession: vi.fn(),
      onStepPlaybackWindow: vi.fn(),
      onToggleReplayPlayback: vi.fn(),
      onStopSession: vi.fn(),
    });
    const progressProps = buildSessionBoothProgressProps({
      booth,
      playbackActive: false,
      liveMonitorActive: true,
    });
    const routeProps = buildSessionBoothRouteProps({
      t: en,
      booth,
      monitorSessionId: "monitor-1",
      mode: "log",
    });
    const detailProps = buildSessionBoothDetailProps({
      t: en,
      booth,
      latestUpdate: null,
      playbackActive: false,
      readyToRun: true,
    });

    expect(headerProps.headline).toBe("Session live");
    expect(headerProps.directPath).toBe("/logs/service.log");
    expect(progressProps.visible).toBe(true);
    expect(progressProps.progressWidth).toBe("48%");
    expect(routeProps.monitorSessionId).toBe("monitor-1");
    expect(routeProps.labels.adapter).toBe(en.session.adapter);
    expect(detailProps.readyToRun).toBe(true);
    expect(detailProps.labels.watchouts).toBe(en.session.watchouts);
  });

  it("builds all booth sections from one panel contract", () => {
    const panelInput = {
      t: en,
      booth,
      playbackActive: false,
      liveMonitorActive: true,
      mutating: false,
      readyToRun: true,
      mode: "log",
      latestUpdate: null,
      monitorSessionId: "monitor-1",
      isPlaybackPaused: false,
      directPath: "/logs/service.log",
      isDirectLoading: false,
      selectedSession: { id: "session-1" } as never,
      creating: false,
      onDirectPathChange: vi.fn(),
      onDirectLaunch: vi.fn(),
      onResumeSelected: vi.fn(),
      onReplaySelected: vi.fn(),
      onCreateSession: vi.fn(),
      onStepPlaybackWindow: vi.fn(),
      onToggleReplayPlayback: vi.fn(),
      onStopSession: vi.fn(),
    } as const;
    const derivedState = buildSessionBoothPanelDerivedState(panelInput);
    const sections = buildSessionBoothPanelSections(panelInput);

    expect(derivedState.labels.header.startSession).toBe(en.session.startSession);
    expect(derivedState.progressVisible).toBe(true);
    expect(sections.headerProps.headline).toBe("Session live");
    expect(sections.progressProps.visible).toBe(true);
    expect(sections.routeProps.monitorSessionId).toBe("monitor-1");
    expect(sections.detailProps.readyToRun).toBe(true);
    expect(sections.stats).toBe(booth.stats);
  });
});
