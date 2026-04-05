import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  ingestStreamChunk,
  pollLogStream,
  pollStreamSession,
  startStreamSession,
  stopStreamSession,
} from "../../api/repositories";
import type {
  LiveLogStreamUpdate,
  RepositoryAnalysis,
  StartSessionInput,
  StreamAdapterKind,
  StreamSessionPollResult,
} from "../../types/library";

const POLL_INTERVAL_MS = 1100;

// ---------------------------------------------------------------------------
// Types exposed to consumers
// ---------------------------------------------------------------------------

export interface ActiveMonitorSession {
  sessionId: string;
  repoId: string;
  repoTitle: string;
  sourcePath: string;
  adapterKind: StreamAdapterKind;
  /** How the poll loop fetches data for this session. */
  pollMode: "session" | "direct" | "websocket" | "http-poll";
  startedAt: number;
}

export interface MonitorMetrics {
  windowCount: number;
  processedLines: number;
  totalAnomalies: number;
}

type StreamListener = (update: LiveLogStreamUpdate) => void;

interface MonitorContextValue {
  /** Currently active session or null when monitoring is stopped. */
  session: ActiveMonitorSession | null;
  /** Accumulated metrics for the active session (reset on each new startSession). */
  metrics: MonitorMetrics;
  /**
   * Start a monitoring session.  Delegates to the Tauri stream-session registry
   * when available and falls back to direct-file polling in browser mode.
   * Returns false if both paths fail.
   */
  startSession: (
    repo: RepositoryAnalysis,
    input: StartSessionInput,
  ) => Promise<boolean>;
  /** Stop the active session and clear all state. */
  stopSession: () => Promise<void>;
  /**
   * Register a listener that receives every LiveLogStreamUpdate emitted by the
   * background poll loop.  Returns an unsubscribe function.
   * The listener is called from within a React state-transition context.
   */
  subscribe: (listener: StreamListener) => () => void;
}

// ---------------------------------------------------------------------------
// Context plumbing
// ---------------------------------------------------------------------------

const MonitorCtx = createContext<MonitorContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function MonitorProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ActiveMonitorSession | null>(null);
  const [metrics, setMetrics] = useState<MonitorMetrics>({
    windowCount: 0,
    processedLines: 0,
    totalAnomalies: 0,
  });

  // Refs that survive across re-renders without causing them
  const pollTimerRef = useRef<number | null>(null);
  const sessionRef = useRef<ActiveMonitorSession | null>(null);
  const listenersRef = useRef<Set<StreamListener>>(new Set());
  const activeRef = useRef(false);
  /** Direct-mode cursor (browser fallback path only). */
  const directCursorRef = useRef<number | undefined>(undefined);
  /** WebSocket instance for the "websocket" poll mode. */
  const wsRef = useRef<WebSocket | null>(null);
  /** Lines received from the WS not yet ingested into the ring buffer. */
  const wsLineBufferRef = useRef<string[]>([]);
  /** URL for the "http-poll" poll mode. */
  const httpUrlRef = useRef<string>("");

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  const stopPolling = useCallback(() => {
    activeRef.current = false;
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    // Close any open WebSocket
    if (wsRef.current) {
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      try { wsRef.current.close(); } catch { /* ignore */ }
      wsRef.current = null;
    }
    wsLineBufferRef.current = [];
    httpUrlRef.current = "";
  }, []);

  const schedulePoll = useCallback(
    (doPoll: () => Promise<void>) => {
      if (!activeRef.current) return;
      pollTimerRef.current = window.setTimeout(() => {
        void doPoll();
      }, POLL_INTERVAL_MS);
    },
    [],
  );

  const emitUpdate = useCallback((update: LiveLogStreamUpdate) => {
    if (update.hasData) {
      setMetrics((prev) => ({
        windowCount: prev.windowCount + 1,
        processedLines: prev.processedLines + update.lineCount,
        totalAnomalies: prev.totalAnomalies + update.anomalyCount,
      }));
    }
    for (const listener of listenersRef.current) {
      listener(update);
    }
  }, []);

  // Map a StreamSessionPollResult to the LiveLogStreamUpdate shape expected by listeners
  const mapPollResult = useCallback(
    (result: StreamSessionPollResult, sourcePath: string): LiveLogStreamUpdate => ({
      sourcePath,
      fromOffset: result.session.fileCursor ?? 0,
      toOffset: result.session.fileCursor ?? 0,
      hasData: result.hasData,
      summary: result.summary,
      suggestedBpm: result.suggestedBpm,
      confidence: result.confidence,
      dominantLevel: result.dominantLevel,
      lineCount: result.lineCount,
      anomalyCount: result.anomalyCount,
      levelCounts: result.levelCounts,
      anomalyMarkers: result.anomalyMarkers,
      topComponents: result.topComponents,
      sonificationCues: result.sonificationCues,
      warnings: result.warnings,
    }),
    [],
  );

  // -------------------------------------------------------------------------
  // Poll loop — defined with useCallback so it's stable but always reads live
  // refs.  Self-scheduling via schedulePoll keeps the loop alive indefinitely
  // until stopPolling() is called.
  // -------------------------------------------------------------------------

  const doPoll = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || !activeRef.current) return;

    try {
      let update: LiveLogStreamUpdate;

      if (current.pollMode === "session") {
        const result = await pollStreamSession(current.sessionId);
        if (!activeRef.current) return;
        update = mapPollResult(result, current.sourcePath);

      } else if (current.pollMode === "direct") {
        // Browser fallback: direct file poll
        update = await pollLogStream(current.sourcePath, directCursorRef.current);
        if (!activeRef.current) return;
        directCursorRef.current = update.toOffset;

      } else if (current.pollMode === "websocket") {
        // Drain lines that arrived via WebSocket since last poll
        const lines = wsLineBufferRef.current.splice(0);
        const chunk = lines.join("\n");
        const result = await ingestStreamChunk(current.sessionId, chunk);
        if (!activeRef.current) return;
        update = mapPollResult(result, current.sourcePath);

      } else {
        // "http-poll": fetch the configured URL, treat response body as log text
        const url = httpUrlRef.current;
        const resp = await fetch(url);
        const text = await resp.text();
        if (!activeRef.current) return;
        const result = await ingestStreamChunk(current.sessionId, text);
        if (!activeRef.current) return;
        update = mapPollResult(result, current.sourcePath);
      }

      emitUpdate(update);
    } catch {
      // Non-fatal — session may be starting up; keep polling
    } finally {
      schedulePoll(doPoll);
    }
  }, [emitUpdate, mapPollResult, schedulePoll]);

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  const startSession = useCallback(
    async (repo: RepositoryAnalysis, input: StartSessionInput): Promise<boolean> => {
      // Stop any existing session first
      if (sessionRef.current) {
        const prevId = sessionRef.current.sessionId;
        stopPolling();
        sessionRef.current = null;
        setSession(null);
        try {
          await stopStreamSession(prevId);
        } catch {
          // best-effort
        }
      }

      let pollMode: "session" | "direct" | "websocket" | "http-poll" = "session";

      if (input.adapterKind === "websocket") {
        pollMode = "websocket";
        // Register the session in Tauri/Python (supplies the ring buffer)
        try {
          await startStreamSession(input);
        } catch {
          // WS adapter requires Tauri; abort if unavailable
          return false;
        }

        // Open the WebSocket connection — source is the ws:// URL
        const wsUrl = input.wsUrl ?? input.source;
        wsLineBufferRef.current = [];
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          const text = typeof event.data === "string" ? event.data : "";
          if (text) {
            wsLineBufferRef.current.push(...text.split("\n").filter(Boolean));
          }
        };
        ws.onerror = () => {
          wsLineBufferRef.current.push("[maia] WebSocket connection error.");
        };
        ws.onclose = () => {
          wsLineBufferRef.current.push("[maia] WebSocket connection closed.");
        };

      } else if (input.adapterKind === "http-poll") {
        pollMode = "http-poll";
        try {
          await startStreamSession(input);
        } catch {
          return false;
        }
        httpUrlRef.current = input.httpUrl ?? input.source;

      } else {
        try {
          await startStreamSession(input);
        } catch {
          // Fall back to direct file polling (browser / no Tauri bridge)
          pollMode = "direct";
        }
      }

      directCursorRef.current = undefined;

      const newSession: ActiveMonitorSession = {
        sessionId: input.sessionId,
        repoId: repo.id,
        repoTitle: repo.title,
        sourcePath: repo.sourcePath,
        adapterKind: input.adapterKind,
        pollMode,
        startedAt: Date.now(),
      };

      sessionRef.current = newSession;
      setSession(newSession);
      setMetrics({ windowCount: 0, processedLines: 0, totalAnomalies: 0 });
      activeRef.current = true;
      void doPoll();

      return true;
    },
    [stopPolling, doPoll],
  );

  const stopSession = useCallback(async (): Promise<void> => {
    const current = sessionRef.current;
    stopPolling();
    sessionRef.current = null;
    directCursorRef.current = undefined;
    setSession(null);
    setMetrics({ windowCount: 0, processedLines: 0, totalAnomalies: 0 });

    if (current?.pollMode === "session") {
      try {
        await stopStreamSession(current.sessionId);
      } catch {
        // best-effort
      }
    }
  }, [stopPolling]);

  const subscribe = useCallback((listener: StreamListener): (() => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  return (
    <MonitorCtx.Provider value={{ session, metrics, startSession, stopSession, subscribe }}>
      {children}
    </MonitorCtx.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

export function useMonitor(): MonitorContextValue {
  const ctx = useContext(MonitorCtx);
  if (!ctx) {
    throw new Error("useMonitor must be called inside <MonitorProvider>");
  }
  return ctx;
}
