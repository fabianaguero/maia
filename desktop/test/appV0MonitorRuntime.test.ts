import { describe, expect, it } from "vitest";

import type { LibraryTrack, RepositoryAnalysis } from "../src/types/library";
import type { MonitorLaunchSource } from "../src/types/monitorLaunch";
import {
  buildAppV0ConnectionAttachInput,
  buildAppV0ConnectionLaunchPlan,
  buildAppV0LibraryMonitorLaunchPlan,
  buildAppV0MonitorLaunchPlan,
  buildAppV0RepositoryLaunchPlan,
  buildAppV0RepositoryStartInput,
  executeAppV0ConnectionLaunchPlan,
  executeAppV0MonitorLaunchPlan,
  executeAppV0RepositoryLaunchPlan,
  resolveAppV0PlaybackLabel,
  resolveAppV0TrackSelection,
} from "../src/appV0MonitorRuntime";

const track: LibraryTrack = {
  id: "track-1",
  title: "",
  sourcePath: "/music/around-the-world.mp3",
  storagePath: null,
  importedAt: "2026-01-01T00:00:00Z",
  bpm: 126,
  bpmConfidence: 0.9,
  durationSeconds: 320,
  waveformBins: [0.2, 0.4, 0.6],
  beatGrid: [],
  bpmCurve: [],
  analyzerStatus: "ready",
  repoSuggestedBpm: null,
  repoSuggestedStatus: "none",
  notes: [],
  fileExtension: "mp3",
  analysisMode: "full",
  musicStyleId: "house",
  musicStyleLabel: "House",
  keySignature: null,
  energyLevel: 0.6,
  danceability: 0.8,
  structuralPatterns: [],
  file: {
    sourcePath: "/music/around-the-world.mp3",
    storagePath: null,
    sourceKind: "file",
    fileExtension: "mp3",
    sizeBytes: null,
    modifiedAt: null,
    checksum: null,
    availabilityState: "available",
    playbackSource: "source_file",
  },
  tags: {
    title: "",
    artist: "Daft Punk",
    album: null,
    genre: "House",
    year: null,
    comment: null,
    artworkPath: null,
    musicStyleId: "house",
    musicStyleLabel: "House",
  },
  analysis: {
    importedAt: "2026-01-01T00:00:00Z",
    bpm: 126,
    bpmConfidence: 0.9,
    durationSeconds: 320,
    waveformBins: [0.2, 0.4, 0.6],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    analysisMode: "full",
    analyzerVersion: null,
    analyzedAt: null,
    repoSuggestedBpm: null,
    repoSuggestedStatus: "none",
    notes: [],
    keySignature: null,
    energyLevel: 0.6,
    danceability: 0.8,
    structuralPatterns: [],
  },
  performance: {
    color: null,
    rating: 0,
    playCount: 0,
    lastPlayedAt: null,
    bpmLock: false,
    gridLock: false,
    mainCueSecond: null,
    hotCues: [],
    memoryCues: [],
    savedLoops: [],
  },
};

const repo: RepositoryAnalysis = {
  id: "repo-1",
  title: "visits-service",
  sourcePath: "/tmp/visits-service.log",
  sourceKind: "file",
  importedAt: "2026-01-01T00:00:00Z",
  lastAnalyzedAt: null,
  analyzerStatus: "ready",
  techStackSummary: [],
  fileCount: 0,
  totalLines: 0,
  entryPoints: [],
  dominantLanguages: [],
  suggestedMusicStyleId: null,
  suggestedMusicStyleLabel: null,
  suggestedBpm: null,
  suggestedBpmReason: null,
  notes: [],
};

describe("appV0MonitorRuntime", () => {
  it("resolves track selection with guide track info", () => {
    const selection = resolveAppV0TrackSelection({
      tracks: [track],
      trackId: "track-1",
    });

    expect(selection.track?.id).toBe("track-1");
    expect(selection.trackTitle).toBe("around-the-world.mp3");
    expect(selection.guideTrackPath).toBe("/music/around-the-world.mp3");
  });

  it("builds a connection launch plan", () => {
    const source: MonitorLaunchSource = {
      id: "connection:abc",
      title: "services",
      sourcePath: "gcp-cloud-run://project/service",
      sourceType: "cloud",
      sourceTypeLabel: "Cloud",
      startable: true,
      origin: "connection",
      connectionId: "abc",
    };
    const directPlan = buildAppV0ConnectionLaunchPlan({
      source,
      track,
      trackTitle: "around-the-world.mp3",
      guideTrackPath: "/music/around-the-world.mp3",
      sessionId: "session-1",
    });

    const plan = buildAppV0MonitorLaunchPlan({
      source,
      tracks: [track],
      repositories: [repo],
      trackId: "track-1",
      sessionId: "session-1",
    });

    expect(directPlan).toMatchObject({
      kind: "connection",
      connectionId: "abc",
      repoTitle: "services",
    });
    expect(plan).toMatchObject({
      kind: "connection",
      sessionId: "session-1",
      connectionId: "abc",
      repoId: "connection:abc",
      repoTitle: "services",
      trackTitle: "around-the-world.mp3",
    });
  });

  it("builds a repository launch plan and library fallback plan", () => {
    const source: MonitorLaunchSource = {
      id: "repo-1",
      title: "visits-service",
      sourcePath: "/tmp/visits-service.log",
      sourceType: "file",
      sourceTypeLabel: "Log file",
      startable: true,
      origin: "repository",
    };
    const startInput = buildAppV0RepositoryStartInput({
      sessionId: "session-2",
      repo,
      track,
      trackTitle: "around-the-world.mp3",
    });
    const directPlan = buildAppV0RepositoryLaunchPlan({
      repo,
      track,
      trackTitle: "around-the-world.mp3",
      guideTrackPath: "/music/around-the-world.mp3",
      sessionId: "session-2",
    });

    const plan = buildAppV0MonitorLaunchPlan({
      source,
      tracks: [track],
      repositories: [repo],
      trackId: "track-1",
      sessionId: "session-2",
    });
    const libraryPlan = buildAppV0LibraryMonitorLaunchPlan({
      repoId: "repo-1",
      repositories: [repo],
      tracks: [track],
      selectedTrack: null,
      sessionId: "session-3",
    });

    expect(startInput).toMatchObject({
      sessionId: "session-2",
      source: "/tmp/visits-service.log",
      trackId: "track-1",
    });
    expect(directPlan).toMatchObject({
      kind: "repository",
      sessionId: "session-2",
    });
    expect(plan).toMatchObject({
      kind: "repository",
      sessionId: "session-2",
    });
    if (plan.kind === "repository") {
      expect(plan.startInput).toMatchObject({
        sessionId: "session-2",
        source: "/tmp/visits-service.log",
        adapterKind: "file",
        trackId: "track-1",
      });
    }

    expect(libraryPlan).toMatchObject({
      kind: "repository",
      sessionId: "session-3",
    });
  });

  it("returns invalid plans and playback labels conservatively", () => {
    const invalidTrackPlan = buildAppV0LibraryMonitorLaunchPlan({
      repoId: "repo-1",
      repositories: [repo],
      tracks: [],
      selectedTrack: null,
      sessionId: "session-4",
    });
    const invalidRepoPlan = buildAppV0MonitorLaunchPlan({
      source: {
        id: "missing",
        title: "missing",
        sourcePath: "/tmp/missing.log",
        sourceType: "file",
        sourceTypeLabel: "Log file",
        startable: true,
        origin: "repository",
      },
      tracks: [track],
      repositories: [],
      trackId: "track-1",
      sessionId: "session-5",
    });

    expect(invalidTrackPlan).toEqual({ kind: "invalid", reason: "missing-track" });
    expect(invalidRepoPlan).toEqual({ kind: "invalid", reason: "missing-repository" });
    expect(resolveAppV0PlaybackLabel(null, "Unknown")).toBe("Unknown");
    expect(resolveAppV0PlaybackLabel({ repoTitle: "services" } as any, "Unknown")).toBe("services");
  });

  it("executes connection and repository launch plans through injected monitor deps", async () => {
    const source: MonitorLaunchSource = {
      id: "connection:abc",
      title: "services",
      sourcePath: "gcp-cloud-run://project/service",
      sourceType: "cloud",
      sourceTypeLabel: "Cloud",
      startable: true,
      origin: "connection",
      connectionId: "abc",
    };
    const connectionPlan = buildAppV0MonitorLaunchPlan({
      source,
      tracks: [track],
      repositories: [repo],
      trackId: "track-1",
      sessionId: "session-6",
    });
    const repoPlan = buildAppV0LibraryMonitorLaunchPlan({
      repoId: "repo-1",
      repositories: [repo],
      tracks: [track],
      selectedTrack: track,
      sessionId: "session-7",
    });

    const calls: string[] = [];
    const onLaunchSuccess = () => calls.push("success");
    const deps = {
      setGuideTrack: (path: string) => calls.push(`guide:${path}`),
      resumeAudio: async () => {
        calls.push("resume");
      },
      startConnection: async () => {
        calls.push("connection");
        return {
          sessionId: "session-6",
          adapterKind: "process" as const,
          source: "gcp-cloud-run://project/service",
          label: "services",
          createdAt: "2026-01-01T00:00:00Z",
          lastPolledAt: null,
          totalPolls: 0,
          fileCursor: null,
        };
      },
      attachSession: async () => {
        calls.push("attach");
        return true;
      },
      startSession: async () => {
        calls.push("start");
        return true;
      },
      onLaunchSuccess,
    };
    const attachInput = buildAppV0ConnectionAttachInput({
      session: {
        sessionId: "session-6",
        adapterKind: "process",
        source: "gcp-cloud-run://project/service",
        label: "services",
        createdAt: "2026-01-01T00:00:00Z",
        lastPolledAt: null,
        totalPolls: 0,
        fileCursor: null,
      },
      repoId: "connection:abc",
      repoTitle: "services",
      track,
      trackTitle: "around-the-world.mp3",
    });

    expect(attachInput).toMatchObject({
      repoId: "connection:abc",
      repoTitle: "services",
      trackId: "track-1",
    });

    expect(await executeAppV0MonitorLaunchPlan(connectionPlan, deps)).toEqual({ ok: true });
    expect(await executeAppV0MonitorLaunchPlan(repoPlan, deps)).toEqual({ ok: true });
    expect(calls).toEqual([
      "guide:/music/around-the-world.mp3",
      "resume",
      "connection",
      "attach",
      "success",
      "guide:/music/around-the-world.mp3",
      "resume",
      "start",
      "success",
    ]);
  });

  it("returns execution failures for invalid, attach-failed and start-failed states", async () => {
    const repositoryPlan = buildAppV0LibraryMonitorLaunchPlan({
      repoId: "repo-1",
      repositories: [repo],
      tracks: [track],
      selectedTrack: track,
      sessionId: "session-8",
    });
    const connectionPlan = buildAppV0MonitorLaunchPlan({
      source: {
        id: "connection:abc",
        title: "services",
        sourcePath: "gcp-cloud-run://project/service",
        sourceType: "cloud",
        sourceTypeLabel: "Cloud",
        startable: true,
        origin: "connection",
        connectionId: "abc",
      },
      tracks: [track],
      repositories: [repo],
      trackId: "track-1",
      sessionId: "session-9",
    });

    const deps = {
      setGuideTrack: (_path: string) => undefined,
      resumeAudio: async () => undefined,
      startConnection: async () =>
        ({
          sessionId: "session-9",
          adapterKind: "process" as const,
          source: "gcp-cloud-run://project/service",
          label: "services",
          createdAt: "2026-01-01T00:00:00Z",
          lastPolledAt: null,
          totalPolls: 0,
          fileCursor: null,
        }) as const,
      attachSession: async () => false,
      startSession: async () => false,
    };

    expect(
      await executeAppV0MonitorLaunchPlan({ kind: "invalid", reason: "missing-track" }, deps),
    ).toEqual({
      ok: false,
      reason: "missing-track",
    });
    expect(await executeAppV0MonitorLaunchPlan(connectionPlan, deps)).toEqual({
      ok: false,
      reason: "attach-failed",
    });
    expect(await executeAppV0MonitorLaunchPlan(repositoryPlan, deps)).toEqual({
      ok: false,
      reason: "start-failed",
    });
  });

  it("executes connection and repository helpers directly", async () => {
    const connectionPlan = buildAppV0ConnectionLaunchPlan({
      source: {
        id: "connection:abc",
        title: "services",
        sourcePath: "gcp-cloud-run://project/service",
        sourceType: "cloud",
        sourceTypeLabel: "Cloud",
        startable: true,
        origin: "connection",
        connectionId: "abc",
      },
      track,
      trackTitle: "around-the-world.mp3",
      guideTrackPath: null,
      sessionId: "session-10",
    });
    const repositoryPlan = buildAppV0RepositoryLaunchPlan({
      repo,
      track,
      trackTitle: "around-the-world.mp3",
      guideTrackPath: null,
      sessionId: "session-11",
    });
    const calls: string[] = [];
    const deps = {
      setGuideTrack: (_path: string) => undefined,
      resumeAudio: async () => undefined,
      startConnection: async () => {
        calls.push("connection");
        return {
          sessionId: "session-10",
          adapterKind: "process" as const,
          source: "gcp-cloud-run://project/service",
          label: "services",
          createdAt: "2026-01-01T00:00:00Z",
          lastPolledAt: null,
          totalPolls: 0,
          fileCursor: null,
        };
      },
      attachSession: async () => {
        calls.push("attach");
        return true;
      },
      startSession: async () => {
        calls.push("start");
        return true;
      },
      onLaunchSuccess: () => calls.push("success"),
    };

    expect(await executeAppV0ConnectionLaunchPlan(connectionPlan, deps)).toEqual({ ok: true });
    expect(await executeAppV0RepositoryLaunchPlan(repositoryPlan, deps)).toEqual({ ok: true });
    expect(calls).toEqual(["connection", "attach", "success", "start", "success"]);
  });
});
