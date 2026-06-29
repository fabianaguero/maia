import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
  isTauri: vi.fn(() => false),
}));

import {
  deleteLogSourceConnection,
  discoverRepositoryLogs,
  exportCompositionFile,
  exportCompositionStems,
  ingestStreamChunk,
  listLogSourceConnections,
  listStreamSessions,
  pollStreamSession,
  readAudioBytes,
  startLogSourceConnection,
  startStreamSession,
  stopStreamSession,
  upsertLogSourceConnection,
  type ExportStemsResponse,
} from "../../src/api/repositories";
import type {
  LogSourceConnection,
  StartLogSourceConnectionInput,
  StartSessionInput,
  StreamSessionPollResult,
  StreamSessionRecord,
  UpsertLogSourceConnectionInput,
} from "../../src/types/monitor";

function enableNativeBridge(): void {
  (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
}

function disableNativeBridge(): void {
  delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
}

function createStreamSessionRecord(id = "session-1"): StreamSessionRecord {
  return {
    id,
    adapterKind: "file",
    source: "/logs/app.log",
    status: "active",
    startedAt: "2026-06-29T00:00:00.000Z",
    updatedAt: "2026-06-29T00:00:00.000Z",
    cursor: 128,
    label: "API logs",
    repositoryId: null,
    trackId: null,
  };
}

function createPollResult(): StreamSessionPollResult {
  return {
    hasData: true,
    lineCount: 2,
    fromOffset: 0,
    toOffset: 32,
    dominantLevel: "warn",
    levelCounts: { info: 1, warn: 1 },
    topComponents: ["api"],
    warnings: [],
    parsedLines: [],
    anomalyMarkers: [],
    sonificationCues: [],
    suggestedBpm: 126,
    confidence: 0.82,
    summary: "warn burst",
  };
}

describe("repositories api", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    enableNativeBridge();
  });

  afterEach(() => {
    disableNativeBridge();
    vi.restoreAllMocks();
  });

  it("passes stream-session and connection commands through to the native bridge", async () => {
    const connection: LogSourceConnection = {
      id: "conn-1",
      name: "Cloud Run",
      adapterKind: "gcloud-run",
      source: "gcp-cloud-run://project/service",
      optionsJson: "{}",
      enabled: true,
      createdAt: "2026-06-29T00:00:00.000Z",
      updatedAt: "2026-06-29T00:00:00.000Z",
    };
    const upsertInput: UpsertLogSourceConnectionInput = {
      id: connection.id,
      name: connection.name,
      adapterKind: connection.adapterKind,
      source: connection.source,
      optionsJson: connection.optionsJson,
      enabled: true,
    };
    const startConnectionInput: StartLogSourceConnectionInput = {
      connectionId: connection.id,
      sessionId: "stream-1",
      trackId: "track-1",
      label: "Live tail",
    };
    const startSessionInput: StartSessionInput = {
      sessionId: "stream-1",
      adapterKind: "file",
      source: "/logs/app.log",
      label: "Live tail",
      trackId: "track-1",
      repositoryId: "repo-1",
    };
    const streamRecord = createStreamSessionRecord("stream-1");
    const pollResult = createPollResult();
    const exportStemsResponse: ExportStemsResponse = {
      status: "ok",
      stems: [
        {
          stemId: "stem-1",
          label: "Drums",
          role: "drums",
          gainDb: 0,
          pan: 0,
          path: "/exports/drums.wav",
          format: "wav",
          sampleRateHz: 44100,
          channels: 2,
          durationSeconds: 32,
        },
      ],
    };

    invokeMock
      .mockResolvedValueOnce(["/logs/api.log", "/logs/app.log"])
      .mockResolvedValueOnce([connection])
      .mockResolvedValueOnce(connection)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(streamRecord)
      .mockResolvedValueOnce("/exports/plan.wav")
      .mockResolvedValueOnce(exportStemsResponse)
      .mockResolvedValueOnce(streamRecord)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce([streamRecord])
      .mockResolvedValueOnce(pollResult)
      .mockResolvedValueOnce(pollResult)
      .mockResolvedValueOnce("base64-audio");

    await expect(discoverRepositoryLogs("/srv/repo")).resolves.toEqual([
      "/logs/api.log",
      "/logs/app.log",
    ]);
    await expect(listLogSourceConnections()).resolves.toEqual([connection]);
    await expect(upsertLogSourceConnection(upsertInput)).resolves.toEqual(connection);
    await expect(deleteLogSourceConnection(connection.id)).resolves.toBe(true);
    await expect(startLogSourceConnection(startConnectionInput)).resolves.toEqual(streamRecord);
    await expect(exportCompositionFile("/tmp/plan.wav", "/exports/plan.wav")).resolves.toBe(
      "/exports/plan.wav",
    );
    await expect(exportCompositionStems("composition-1", "/exports")).resolves.toEqual(
      exportStemsResponse,
    );
    await expect(startStreamSession(startSessionInput)).resolves.toEqual(streamRecord);
    await expect(stopStreamSession("stream-1")).resolves.toBe(true);
    await expect(listStreamSessions()).resolves.toEqual([streamRecord]);
    await expect(pollStreamSession("stream-1")).resolves.toEqual(pollResult);
    await expect(ingestStreamChunk("stream-1", "INFO hello")).resolves.toEqual(pollResult);
    await expect(readAudioBytes("/tmp/pulse.wav")).resolves.toBe("base64-audio");

    expect(invokeMock).toHaveBeenNthCalledWith(1, "discover_repository_logs", { path: "/srv/repo" });
    expect(invokeMock).toHaveBeenNthCalledWith(2, "list_log_source_connections", undefined);
    expect(invokeMock).toHaveBeenNthCalledWith(3, "upsert_log_source_connection", {
      input: upsertInput,
    });
    expect(invokeMock).toHaveBeenNthCalledWith(4, "delete_log_source_connection", {
      id: connection.id,
    });
    expect(invokeMock).toHaveBeenNthCalledWith(5, "start_log_source_connection", {
      input: startConnectionInput,
    });
    expect(invokeMock).toHaveBeenNthCalledWith(6, "export_composition_file", {
      sourcePath: "/tmp/plan.wav",
      destPath: "/exports/plan.wav",
    });
    expect(invokeMock).toHaveBeenNthCalledWith(7, "export_composition_stems", {
      compositionId: "composition-1",
      destDir: "/exports",
    });
    expect(invokeMock).toHaveBeenNthCalledWith(8, "start_stream_session", {
      input: startSessionInput,
    });
    expect(invokeMock).toHaveBeenNthCalledWith(9, "stop_stream_session", {
      sessionId: "stream-1",
    });
    expect(invokeMock).toHaveBeenNthCalledWith(10, "list_stream_sessions", undefined);
    expect(invokeMock).toHaveBeenNthCalledWith(11, "poll_stream_session", { sessionId: "stream-1" });
    expect(invokeMock).toHaveBeenNthCalledWith(12, "ingest_stream_chunk", {
      sessionId: "stream-1",
      chunk: "INFO hello",
    });
    expect(invokeMock).toHaveBeenNthCalledWith(13, "read_audio_bytes", {
      path: "/tmp/pulse.wav",
    });
  });

  it("returns safe fallbacks or explicit native-shell errors when no bridge exists", async () => {
    disableNativeBridge();

    await expect(discoverRepositoryLogs("/srv/repo")).resolves.toEqual([]);
    await expect(listLogSourceConnections()).resolves.toEqual([]);
    await expect(deleteLogSourceConnection("conn-1")).resolves.toBe(false);
    await expect(stopStreamSession("stream-1")).resolves.toBe(false);
    await expect(listStreamSessions()).resolves.toEqual([]);

    await expect(
      upsertLogSourceConnection({
        name: "Cloud Run",
        adapterKind: "gcloud-run",
        source: "gcp://service",
        optionsJson: "{}",
        enabled: true,
      }),
    ).rejects.toThrow("Persistent log connections require the native desktop shell.");
    await expect(
      startLogSourceConnection({
        connectionId: "conn-1",
        sessionId: "stream-1",
      }),
    ).rejects.toThrow("Persistent log connections require the native desktop shell.");
    await expect(startStreamSession({
      sessionId: "stream-1",
      adapterKind: "file",
      source: "/logs/app.log",
    })).rejects.toThrow("Stream sessions require the native desktop shell.");
    await expect(pollStreamSession("stream-1")).rejects.toThrow(
      "Stream sessions require the native desktop shell.",
    );
    await expect(ingestStreamChunk("stream-1", "INFO")).rejects.toThrow(
      "Stream sessions require the native desktop shell.",
    );
    await expect(readAudioBytes("/tmp/pulse.wav")).rejects.toThrow(
      "Audio byte reads require the native desktop shell.",
    );
    await expect(exportCompositionFile("/tmp/a.wav", "/tmp/b.wav")).rejects.toThrow(
      "Composition export requires the native desktop shell.",
    );
    await expect(exportCompositionStems("composition-1", "/tmp")).rejects.toThrow(
      "Stem export requires the native desktop shell.",
    );
  });
});
