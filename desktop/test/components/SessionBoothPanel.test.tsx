import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PersistedSession } from "../../src/api/sessions";
import { SessionBoothPanel } from "../../src/features/session/SessionBoothPanel";
import type { SessionBoothViewModel } from "../../src/features/session/sessionBoothViewModel";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import type { LiveLogStreamUpdate } from "../../src/types/monitor";

afterEach(() => {
  cleanup();
});

function createBooth(overrides: Partial<SessionBoothViewModel> = {}): SessionBoothViewModel {
  return {
    sourceLabel: "customers-service",
    sourcePath: "/logs/customers-service.log",
    baseLabel: "Base Pulse",
    baseDetail: "126 BPM",
    adapterLabel: "File tail",
    signalBpm: 126,
    state: {
      tone: "armed",
      label: en.session.boothArmed,
    },
    headline: "Night watch",
    summary: en.session.baseAndSourceArmed,
    levelCountEntries: [["warn", 2]],
    topComponents: [{ component: "payments", count: 3 }],
    warningItems: ["Latency spike detected"],
    anomalyMarkers: [
      {
        eventIndex: 4,
        level: "error",
        component: "payments",
        excerpt: "500 on POST /checkout",
      },
    ],
    stats: [
      { label: en.session.signalBpm, value: "126", helper: "bpm" },
      { label: en.session.windows, value: "8", helper: en.session.processed },
    ],
    progressAriaLabel: en.session.liveMonitoringActivity,
    progressWidth: "42%",
    ...overrides,
  };
}

function createSelectedSession(
  overrides: Partial<PersistedSession> = {},
): PersistedSession {
  return {
    id: "session-1",
    label: "Night watch",
    sourceId: "repo-1",
    sourceTitle: "customers-service",
    sourcePath: "/logs/customers-service.log",
    sourceKind: "file",
    trackId: "track-1",
    trackTitle: "Base Pulse",
    playlistId: null,
    playlistName: null,
    adapterKind: "file",
    mode: "live",
    status: "paused",
    fileCursor: 42,
    totalPolls: 6,
    totalLines: 128,
    totalAnomalies: 3,
    lastBpm: 126,
    createdAt: "2026-06-28T10:00:00.000Z",
    updatedAt: "2026-06-28T10:05:00.000Z",
    sourceTemplateId: "deep-house",
    ...overrides,
  };
}

function createLatestUpdate(
  overrides: Partial<LiveLogStreamUpdate> = {},
): LiveLogStreamUpdate {
  return {
    sourcePath: "/logs/customers-service.log",
    fromOffset: 0,
    toOffset: 64,
    hasData: true,
    summary: "Warnings clustered around checkout flow.",
    suggestedBpm: 126,
    confidence: 0.81,
    dominantLevel: "warn",
    lineCount: 12,
    anomalyCount: 2,
    levelCounts: { warn: 2, info: 10 },
    anomalyMarkers: [
      {
        eventIndex: 9,
        level: "warn",
        component: "checkout",
        excerpt: "Retry loop opened",
      },
    ],
    topComponents: [{ component: "checkout", count: 4 }],
    sonificationCues: [],
    parsedLines: [],
    warnings: ["Checkout retry loop"],
    ...overrides,
  };
}

function renderBooth(overrides: Partial<React.ComponentProps<typeof SessionBoothPanel>> = {}) {
  const props: React.ComponentProps<typeof SessionBoothPanel> = {
    booth: createBooth(),
    playbackActive: false,
    liveMonitorActive: false,
    mutating: false,
    readyToRun: false,
    mode: "log",
    latestUpdate: null,
    monitorSessionId: null,
    isPlaybackPaused: false,
    directPath: "",
    isDirectLoading: false,
    selectedSession: null,
    creating: false,
    onDirectPathChange: vi.fn(),
    onDirectLaunch: vi.fn(),
    onResumeSelected: vi.fn(),
    onReplaySelected: vi.fn(),
    onCreateSession: vi.fn(),
    onStepPlaybackWindow: vi.fn(),
    onToggleReplayPlayback: vi.fn(),
    onStopSession: vi.fn(),
    ...overrides,
  };

  render(
    <I18nContext.Provider value={en}>
      <SessionBoothPanel {...props} />
    </I18nContext.Provider>,
  );

  return props;
}

describe("SessionBoothPanel", () => {
  it("renders replay controls and routes playback actions", () => {
    const onStepPlaybackWindow = vi.fn();
    const onToggleReplayPlayback = vi.fn();
    const onStopSession = vi.fn();

    renderBooth({
      booth: createBooth({
        state: { tone: "replay", label: en.session.replayActive },
        progressAriaLabel: en.session.replayProgress,
      }),
      playbackActive: true,
      liveMonitorActive: false,
      latestUpdate: createLatestUpdate(),
      onStepPlaybackWindow,
      onToggleReplayPlayback,
      onStopSession,
    });

    fireEvent.click(screen.getByRole("button", { name: en.session.prevWindow }));
    fireEvent.click(screen.getByRole("button", { name: en.session.pauseReplay }));
    fireEvent.click(screen.getByRole("button", { name: en.session.nextWindow }));
    fireEvent.click(screen.getByRole("button", { name: en.session.exitReplay }));

    expect(onStepPlaybackWindow).toHaveBeenNthCalledWith(1, -1);
    expect(onStepPlaybackWindow).toHaveBeenNthCalledWith(2, 1);
    expect(onToggleReplayPlayback).toHaveBeenCalledTimes(1);
    expect(onStopSession).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(en.session.replayProgress)).toBeInTheDocument();
    expect(screen.getByText(en.session.replayNotes)).toBeInTheDocument();
    expect(
      screen.getAllByText(
        (_, node) => node?.textContent?.includes("500 on POST /checkout") ?? false,
      ).length,
    ).toBeGreaterThan(0);
  });

  it("shows launch, resume and replay actions when the booth is armed but idle", () => {
    const onDirectPathChange = vi.fn();
    const onDirectLaunch = vi.fn();
    const onResumeSelected = vi.fn();
    const onReplaySelected = vi.fn();
    const onCreateSession = vi.fn();

    renderBooth({
      readyToRun: true,
      directPath: "/var/log/syslog",
      selectedSession: createSelectedSession(),
      onDirectPathChange,
      onDirectLaunch,
      onResumeSelected,
      onReplaySelected,
      onCreateSession,
    });

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "/tmp/runtime.log" },
    });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: en.session.resumeSelected }));
    fireEvent.click(screen.getByRole("button", { name: en.session.replaySelected }));
    fireEvent.click(screen.getByRole("button", { name: en.session.startSession }));

    expect(onDirectPathChange).toHaveBeenCalledWith("/tmp/runtime.log");
    expect(onDirectLaunch).toHaveBeenCalledTimes(1);
    expect(onResumeSelected).toHaveBeenCalledTimes(1);
    expect(onReplaySelected).toHaveBeenCalledTimes(1);
    expect(onCreateSession).toHaveBeenCalledTimes(1);
    expect(screen.getByDisplayValue("/var/log/syslog")).toBeInTheDocument();
    expect(screen.getByText("Latency spike detected")).toBeInTheDocument();
  });

  it("shows live stop state and idle anomaly hint when the stream has no burst yet", () => {
    const onStopSession = vi.fn();

    renderBooth({
      booth: createBooth({
        warningItems: [],
        anomalyMarkers: [],
        levelCountEntries: [],
        topComponents: [],
        state: { tone: "live", label: en.session.liveHot },
      }),
      liveMonitorActive: true,
      latestUpdate: createLatestUpdate({
        hasData: false,
        lineCount: 0,
        anomalyCount: 0,
        levelCounts: {},
        warnings: [],
        topComponents: [],
        anomalyMarkers: [],
      }),
      onStopSession,
    });

    fireEvent.click(screen.getByRole("button", { name: en.session.stopSession }));

    expect(onStopSession).toHaveBeenCalledTimes(1);
    expect(screen.getByText(en.session.noLevelBreakdown)).toBeInTheDocument();
    expect(screen.getByText(en.session.topComponentsSoon)).toBeInTheDocument();
    expect(screen.getByText(en.session.noCurrentBurst)).toBeInTheDocument();
    expect(screen.getByText(en.session.sourceActiveHint)).toBeInTheDocument();
    expect(screen.getByLabelText(en.session.liveMonitoringActivity)).toBeInTheDocument();
  });
});
