import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { convertFileSrc, isTauri } from "@tauri-apps/api/core";

import {
  pollLogStream,
  startStreamSession,
  stopStreamSession,
  pollStreamSession,
} from "../../../api/repositories";
import type {
  BaseAssetRecord,
  CompositionResultRecord,
  LiveLogCue,
  LiveLogMarker,
  LiveLogStreamUpdate,
  RepositoryAnalysis,
  StreamAdapterKind,
} from "../../../types/library";
import { musicStyleCatalog } from "../../../config/musicStyles";
import { LiveSonificationScenePanel } from "./LiveSonificationScenePanel";
import {
  resolveLiveSonificationScene,
  routeCueThroughScene,
  type RoutedLiveCue,
} from "./liveSonificationScene";

const POLL_INTERVAL_MS = 1100;
const MAX_RECENT_CUES = 8;
const MAX_RECENT_MARKERS = 6;
const MAX_RECENT_WARNINGS = 4;

type AudioEngineStatus = "idle" | "ready" | "unsupported" | "error";
type SampleEngineStatus = "unavailable" | "loading" | "ready" | "error";

interface LiveLogMonitorPanelProps {
  repository: RepositoryAnalysis;
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  preferredBaseAssetId?: string | null;
  preferredCompositionId?: string | null;
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected live log monitor failure.";
}

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const audioConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  return audioConstructor ? new audioConstructor() : null;
}

function resolveManagedAudioSource(audioPath: string | null): string | null {
  if (!audioPath || audioPath.startsWith("browser-fallback://") || !isTauri()) {
    return null;
  }

  try {
    return convertFileSrc(audioPath);
  } catch {
    return null;
  }
}

function preferredBaseAssetId(
  availableBaseAssets: BaseAssetRecord[],
  preferredId?: string | null,
): string {
  if (preferredId && availableBaseAssets.some((entry) => entry.id === preferredId)) {
    return preferredId;
  }

  return availableBaseAssets.find((entry) => entry.reusable)?.id ?? availableBaseAssets[0]?.id ?? "";
}

function preferredCompositionId(
  availableCompositions: CompositionResultRecord[],
  preferredId?: string | null,
): string {
  if (preferredId && availableCompositions.some((entry) => entry.id === preferredId)) {
    return preferredId;
  }

  return "";
}

function scheduleCue(context: AudioContext, cue: RoutedLiveCue, startAt: number): void {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const stereoPanner =
    typeof context.createStereoPanner === "function"
      ? context.createStereoPanner()
      : null;

  oscillator.type = cue.waveform;
  oscillator.frequency.setValueAtTime(cue.noteHz, startAt);
  if (cue.accent === "anomaly") {
    oscillator.detune.setValueAtTime(90, startAt);
  }

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, cue.gain), startAt + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    startAt + Math.max(0.08, cue.durationMs / 1000),
  );

  oscillator.connect(gainNode);
  if (stereoPanner) {
    stereoPanner.pan.setValueAtTime(cue.pan, startAt);
    gainNode.connect(stereoPanner);
    stereoPanner.connect(context.destination);
  } else {
    gainNode.connect(context.destination);
  }

  oscillator.start(startAt);
  oscillator.stop(startAt + Math.max(0.1, cue.durationMs / 1000) + 0.04);
}

function scheduleSampleCue(
  context: AudioContext,
  cue: RoutedLiveCue,
  sampleBuffer: AudioBuffer,
  startAt: number,
): void {
  const source = context.createBufferSource();
  const gainNode = context.createGain();
  const stereoPanner =
    typeof context.createStereoPanner === "function"
      ? context.createStereoPanner()
      : null;
  const routeOffsetRatio =
    cue.routeKey === "info"
      ? 0.08
      : cue.routeKey === "warn"
        ? 0.22
        : cue.routeKey === "error"
          ? 0.42
          : 0.64;
  const cueOffsetRatio = ((cue.eventIndex % 5) * 0.07) % 0.28;
  const offsetSeconds = Math.min(
    Math.max(0, sampleBuffer.duration - 0.04),
    sampleBuffer.duration * Math.min(0.88, routeOffsetRatio + cueOffsetRatio),
  );
  const durationSeconds = Math.min(
    Math.max(0.09, cue.durationMs / 1000),
    Math.max(0.09, sampleBuffer.duration - offsetSeconds),
  );
  const playbackRate = Math.max(0.55, Math.min(1.85, cue.noteHz / 261.63));

  source.buffer = sampleBuffer;
  source.playbackRate.setValueAtTime(playbackRate, startAt);
  if (cue.accent === "anomaly") {
    source.detune.setValueAtTime(120, startAt);
  }

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, cue.gain), startAt + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSeconds);

  source.connect(gainNode);
  if (stereoPanner) {
    stereoPanner.pan.setValueAtTime(cue.pan, startAt);
    gainNode.connect(stereoPanner);
    stereoPanner.connect(context.destination);
  } else {
    gainNode.connect(context.destination);
  }

  source.start(startAt, offsetSeconds, durationSeconds);
  source.stop(startAt + durationSeconds + 0.03);
}

function formatCursor(offset: number | undefined): string {
  if (typeof offset !== "number" || Number.isNaN(offset)) {
    return "Tail seed";
  }

  return `${offset.toLocaleString()} B`;
}

function formatConfidence(confidence: number): string {
  if (!Number.isFinite(confidence) || confidence <= 0) {
    return "--";
  }

  return `${Math.round(confidence * 100)}%`;
}

function formatFrequency(noteHz: number): string {
  return `${Math.round(noteHz)} Hz`;
}

function levelCount(levelCounts: Record<string, number>, level: string): number {
  return levelCounts[level] ?? 0;
}

function statusLabel(liveEnabled: boolean, polling: boolean): string {
  if (!liveEnabled) {
    return "Stopped";
  }

  return polling ? "Polling" : "Live";
}

function audioLabel(status: AudioEngineStatus, liveEnabled: boolean): string {
  if (status === "unsupported") {
    return "Unavailable";
  }
  if (status === "error") {
    return "Error";
  }
  if (liveEnabled && status === "ready") {
    return "Active";
  }
  if (status === "ready") {
    return "Armed";
  }
  return "Idle";
}

export function LiveLogMonitorPanel({
  repository,
  availableBaseAssets,
  availableCompositions,
  preferredBaseAssetId: preferredBaseAssetIdProp,
  preferredCompositionId: preferredCompositionIdProp,
}: LiveLogMonitorPanelProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sampleBuffersRef = useRef(new Map<string, AudioBuffer>());
  const pollTimerRef = useRef<number | null>(null);
  const liveEnabledRef = useRef(false);
  const cursorRef = useRef<number | undefined>(undefined);
  const sessionIdRef = useRef<string | null>(null);
  const [adapterKind, setAdapterKind] = useState<StreamAdapterKind>("file");
  const [processCommand, setProcessCommand] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedGenreId, setSelectedGenreId] = useState(
    () => musicStyleCatalog.defaultTrackMusicStyleId,
  );
  const [sceneBaseAssetId, setSceneBaseAssetId] = useState(() =>
    preferredBaseAssetId(availableBaseAssets, preferredBaseAssetIdProp),
  );
  const [sceneCompositionId, setSceneCompositionId] = useState(() =>
    preferredCompositionId(availableCompositions, preferredCompositionIdProp),
  );
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [polling, setPolling] = useState(false);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [audioStatus, setAudioStatus] = useState<AudioEngineStatus>("idle");
  const [sampleStatus, setSampleStatus] = useState<SampleEngineStatus>("unavailable");
  const [lastUpdate, setLastUpdate] = useState<LiveLogStreamUpdate | null>(null);
  const [windowCount, setWindowCount] = useState(0);
  const [processedLines, setProcessedLines] = useState(0);
  const [totalAnomalies, setTotalAnomalies] = useState(0);
  const [emittedCueCount, setEmittedCueCount] = useState(0);
  const [recentCues, setRecentCues] = useState<RoutedLiveCue[]>([]);
  const [recentMarkers, setRecentMarkers] = useState<LiveLogMarker[]>([]);
  const [recentWarnings, setRecentWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const selectedSceneBaseAsset =
    availableBaseAssets.find((entry) => entry.id === sceneBaseAssetId) ?? null;
  const selectedSceneComposition =
    availableCompositions.find((entry) => entry.id === sceneCompositionId) ?? null;
  const scene = resolveLiveSonificationScene(
    selectedSceneBaseAsset,
    selectedSceneComposition,
    selectedGenreId,
  );

  useEffect(() => {
    if (
      sceneBaseAssetId &&
      availableBaseAssets.some((entry) => entry.id === sceneBaseAssetId)
    ) {
      return;
    }

    setSceneBaseAssetId(preferredBaseAssetId(availableBaseAssets, preferredBaseAssetIdProp));
  }, [availableBaseAssets, preferredBaseAssetIdProp, sceneBaseAssetId]);

  useEffect(() => {
    if (
      sceneCompositionId &&
      availableCompositions.some((entry) => entry.id === sceneCompositionId)
    ) {
      return;
    }

    setSceneCompositionId(
      preferredCompositionId(availableCompositions, preferredCompositionIdProp),
    );
  }, [availableCompositions, preferredCompositionIdProp, sceneCompositionId]);

  useEffect(() => {
    liveEnabledRef.current = liveEnabled;
  }, [liveEnabled]);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const sampleSources = scene.sampleSources;
    const resolvableSampleSources = sampleSources
      .map((source) => ({
        ...source,
        url: resolveManagedAudioSource(source.path),
      }))
      .filter(
        (
          source,
        ): source is { path: string; label: string; url: string } => Boolean(source.url),
      );

    sampleBuffersRef.current = new Map();

    if (resolvableSampleSources.length === 0) {
      setSampleStatus("unavailable");
      return;
    }

    let cancelled = false;

    async function loadSampleBuffer() {
      setSampleStatus("loading");

      try {
        if (!audioContextRef.current) {
          audioContextRef.current = createAudioContext();
        }

        if (!audioContextRef.current) {
          setSampleStatus("unavailable");
          return;
        }

        const decodedEntries = await Promise.all(
          resolvableSampleSources.map(async (source) => {
            const response = await fetch(source.url);
            if (!response.ok) {
              throw new Error(
                `Failed to fetch managed sample ${source.label} (${response.status}).`,
              );
            }

            const encodedAudio = await response.arrayBuffer();
            const decoded = await audioContextRef.current!.decodeAudioData(
              encodedAudio.slice(0),
            );

            return [source.path, decoded] as const;
          }),
        );
        if (cancelled) {
          return;
        }

        sampleBuffersRef.current = new Map(decodedEntries);
        setSampleStatus("ready");
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        sampleBuffersRef.current = new Map();
        setSampleStatus("error");
        setRecentWarnings((current) => [
          `Base sample routing failed: ${toMessage(nextError)}`,
          ...current,
        ].slice(0, MAX_RECENT_WARNINGS));
      }
    }

    void loadSampleBuffer();

    return () => {
      cancelled = true;
    };
  }, [scene.sampleSources]);

  useEffect(() => {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    liveEnabledRef.current = false;
    cursorRef.current = undefined;
    setLiveEnabled(false);
    setPolling(false);
    setCursor(undefined);
    setLastUpdate(null);
    setWindowCount(0);
    setProcessedLines(0);
    setTotalAnomalies(0);
    setEmittedCueCount(0);
    setRecentCues([]);
    setRecentMarkers([]);
    setRecentWarnings([]);
    setError(null);
    setSceneBaseAssetId(preferredBaseAssetId(availableBaseAssets, preferredBaseAssetIdProp));
    setSceneCompositionId(
      preferredCompositionId(availableCompositions, preferredCompositionIdProp),
    );
  }, [repository.id]);

  useEffect(() => {
    sessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  const ensureAudioReady = useEffectEvent(async (): Promise<AudioContext | null> => {
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }

    if (!audioContextRef.current) {
      setAudioStatus("unsupported");
      return null;
    }

    try {
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
      setAudioStatus("ready");
      return audioContextRef.current;
    } catch {
      setAudioStatus("error");
      return null;
    }
  });

  const playWithCurrentEngine = useEffectEvent(async (cues: RoutedLiveCue[]) => {
    if (cues.length === 0) {
      return;
    }

    const context = await ensureAudioReady();
    if (!context) {
      return;
    }

    const startAt = context.currentTime + 0.04;

    for (const [index, cue] of cues.slice(0, 12).entries()) {
      const cueStartAt = startAt + index * 0.08;
      const sampleBuffer =
        sampleStatus === "ready" && cue.samplePath
          ? sampleBuffersRef.current.get(cue.samplePath) ?? null
          : null;
      if (sampleBuffer) {
        scheduleSampleCue(context, cue, sampleBuffer, cueStartAt);
      } else {
        scheduleCue(context, cue, cueStartAt);
      }
    }
  });

  const pollWindow = useEffectEvent(async () => {
    setPolling(true);

    try {
      let update: LiveLogStreamUpdate;
      const currentSessionId = sessionIdRef.current;

      if (currentSessionId) {
        // Session mode: use the stream session registry (both file and process adapters)
        const result = await pollStreamSession(currentSessionId);
        if (!liveEnabledRef.current) {
          return;
        }
        update = {
          sourcePath: repository.sourcePath,
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
        };
      } else {
        // Direct file tail mode
        update = await pollLogStream(repository.sourcePath, cursorRef.current);
        if (!liveEnabledRef.current) {
          return;
        }
        cursorRef.current = update.toOffset;
        setCursor(update.toOffset);
      }

      const routedCues = update.sonificationCues.map((cue, index) =>
        routeCueThroughScene(cue, scene, index),
      );

      startTransition(() => {
        setLastUpdate(update);
        setRecentWarnings(update.warnings.slice(0, MAX_RECENT_WARNINGS));
        setError(null);

        if (!update.hasData) {
          return;
        }

        setWindowCount((current) => current + 1);
        setProcessedLines((current) => current + update.lineCount);
        setTotalAnomalies((current) => current + update.anomalyCount);
        setEmittedCueCount((current) => current + routedCues.length);
        setRecentCues((current) => [
          ...routedCues.slice().reverse(),
          ...current,
        ].slice(0, MAX_RECENT_CUES));
        setRecentMarkers((current) => [
          ...update.anomalyMarkers.slice().reverse(),
          ...current,
        ].slice(0, MAX_RECENT_MARKERS));
      });

      if (update.hasData) {
        await playWithCurrentEngine(routedCues);
      }
    } catch (nextError) {
      if (liveEnabledRef.current) {
        startTransition(() => {
          setError(toMessage(nextError));
        });
      }
    } finally {
      if (liveEnabledRef.current) {
        pollTimerRef.current = window.setTimeout(() => {
          void pollWindow();
        }, POLL_INTERVAL_MS);
      }
      setPolling(false);
    }
  });

  useEffect(() => {
    if (!liveEnabled) {
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    void pollWindow();

    return () => {
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [liveEnabled, repository.sourcePath]);

  async function handleStart() {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    cursorRef.current = undefined;
    setCursor(undefined);
    setLastUpdate(null);
    setWindowCount(0);
    setProcessedLines(0);
    setTotalAnomalies(0);
    setEmittedCueCount(0);
    setRecentCues([]);
    setRecentMarkers([]);
    setRecentWarnings([]);
    setError(null);

    // Start a stream session (file or process adapter)
    try {
      const sessionId = `sess-${repository.id}-${Date.now()}`;
      const input =
        adapterKind === "process"
          ? {
              sessionId,
              adapterKind: "process" as const,
              source: repository.sourcePath,
              label: repository.title,
              command: processCommand
                .split(/\s+/)
                .map((s) => s.trim())
                .filter(Boolean),
            }
          : {
              sessionId,
              adapterKind: "file" as const,
              source: repository.sourcePath,
              label: repository.title,
            };

      await startStreamSession(input);
      sessionIdRef.current = sessionId;
      setActiveSessionId(sessionId);
    } catch {
      // Fall back to direct file tailing if session creation fails (e.g. in browser)
      sessionIdRef.current = null;
      setActiveSessionId(null);
    }

    await ensureAudioReady();
    liveEnabledRef.current = true;
    setLiveEnabled(true);
  }

  function handleStop() {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    const sid = sessionIdRef.current;
    if (sid) {
      void stopStreamSession(sid).catch(() => {
        // best-effort cleanup
      });
      sessionIdRef.current = null;
      setActiveSessionId(null);
    }

    liveEnabledRef.current = false;
    setLiveEnabled(false);
    setPolling(false);
  }

  const currentLevelCounts = lastUpdate?.levelCounts ?? {};

  return (
    <section className="panel waveform-panel">
      <div className="panel-header">
        <div>
          <h2>Live log monitor</h2>
          <p className="support-copy">
            Internal `tail -f` loop inside Maia. The app polls the original log file, maps each
            new window into musical cues, and plays them with Web Audio using either a managed base
            sample or internal synthesis without shelling out to an external log or audio tool.
          </p>
        </div>
        <div className="live-log-toolbar">
          <span className={`live-log-badge ${liveEnabled ? "live" : "idle"}`}>
            {statusLabel(liveEnabled, polling)}
          </span>
          {!liveEnabled ? (
            <>
              <select
                className="compact-select"
                value={selectedGenreId}
                onChange={(e) => setSelectedGenreId(e.target.value)}
                title="Instrumental genre — shapes oscillator palette, pitch register, and dynamics"
              >
                {musicStyleCatalog.musicStyles.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.label}
                  </option>
                ))}
              </select>
              <select
                className="compact-select"
                value={adapterKind}
                onChange={(e) => setAdapterKind(e.target.value as StreamAdapterKind)}
              >
                <option value="file">File tail</option>
                <option value="process">Process stdout</option>
              </select>
            </>
          ) : null}
          {liveEnabled ? (
            <button type="button" className="secondary-action" onClick={handleStop}>
              Stop live tail
            </button>
          ) : (
            <button type="button" className="action" onClick={() => void handleStart()}>
              Start live tail
            </button>
          )}
        </div>
      </div>

      {!liveEnabled && adapterKind === "process" ? (
        <div className="audio-path-card top-spaced">
          <label htmlFor="process-command">Process command</label>
          <input
            id="process-command"
            type="text"
            placeholder="e.g. tail -f /var/log/syslog"
            value={processCommand}
            onChange={(e) => setProcessCommand(e.target.value)}
          />
        </div>
      ) : null}

      {liveEnabled && activeSessionId ? (
        <div className="audio-path-card">
          <span>Session</span>
          <strong>{activeSessionId}</strong>
        </div>
      ) : null}

      <div className="metric-grid">
        <div>
          <span>Mode</span>
          <strong>{adapterKind === "process" ? "Process stdout" : "File tail"}</strong>
        </div>
        <div>
          <span>Audio</span>
          <strong>{audioLabel(audioStatus, liveEnabled)}</strong>
        </div>
        <div>
          <span>Cue engine</span>
          <strong>
            {sampleStatus === "ready"
              ? scene.sampleSourceCount > 1
                ? "Base sample pack"
                : "Base sample"
              : sampleStatus === "loading"
                ? "Loading sample"
                : "Internal synth"}
          </strong>
        </div>
        <div>
          <span>Cursor</span>
          <strong>{formatCursor(cursor)}</strong>
        </div>
        <div>
          <span>Poll cadence</span>
          <strong>{(POLL_INTERVAL_MS / 1000).toFixed(1)}s</strong>
        </div>
        <div>
          <span>Windows heard</span>
          <strong>{windowCount}</strong>
        </div>
        <div>
          <span>Cues emitted</span>
          <strong>{emittedCueCount}</strong>
        </div>
        <div>
          <span>Lines processed</span>
          <strong>{processedLines}</strong>
        </div>
        <div>
          <span>Anomalies heard</span>
          <strong>{totalAnomalies}</strong>
        </div>
      </div>

      <div className="audio-path-card top-spaced">
        <span>Live source path</span>
        <strong>{repository.sourcePath}</strong>
      </div>

      <LiveSonificationScenePanel
        availableBaseAssets={availableBaseAssets}
        availableCompositions={availableCompositions}
        sceneBaseAssetId={sceneBaseAssetId}
        sceneCompositionId={sceneCompositionId}
        onSceneBaseAssetIdChange={setSceneBaseAssetId}
        onSceneCompositionIdChange={setSceneCompositionId}
        scene={scene}
      />

      {lastUpdate ? (
        <>
          <div className="render-master-card top-spaced">
            <span>Current window summary</span>
            <strong>{lastUpdate.summary}</strong>
          </div>

          <div className="metric-grid top-spaced">
            <div>
              <span>Suggested BPM</span>
              <strong>
                {typeof lastUpdate.suggestedBpm === "number"
                  ? lastUpdate.suggestedBpm.toFixed(0)
                  : repository.suggestedBpm?.toFixed(0) ?? "Pending"}
              </strong>
            </div>
            <div>
              <span>Confidence</span>
              <strong>{formatConfidence(lastUpdate.confidence)}</strong>
            </div>
            <div>
              <span>Dominant level</span>
              <strong>{lastUpdate.dominantLevel}</strong>
            </div>
            <div>
              <span>Chunk lines</span>
              <strong>{lastUpdate.lineCount}</strong>
            </div>
            <div>
              <span>Errors</span>
              <strong>{levelCount(currentLevelCounts, "error")}</strong>
            </div>
            <div>
              <span>Warnings</span>
              <strong>{levelCount(currentLevelCounts, "warn")}</strong>
            </div>
            <div>
              <span>Info</span>
              <strong>{levelCount(currentLevelCounts, "info")}</strong>
            </div>
            <div>
              <span>Tail window</span>
              <strong>
                {formatCursor(lastUpdate.fromOffset)} → {formatCursor(lastUpdate.toOffset)}
              </strong>
            </div>
          </div>

          {lastUpdate.topComponents.length > 0 ? (
            <>
              <div className="panel-header compact top-spaced">
                <div>
                  <h2>Active components</h2>
                  <p className="support-copy">
                    Most active sources in the latest live window.
                  </p>
                </div>
              </div>
              <div className="pill-strip">
                {lastUpdate.topComponents.map((component) => (
                  <span key={`${component.component}-${component.count}`}>
                    {component.component} · {component.count}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </>
      ) : (
        <div className="empty-state top-spaced">
          <p>
            Start the live tail to listen to newly appended log lines as internal cues inside
            Maia.
          </p>
        </div>
      )}

      <div className="panel-header compact top-spaced">
        <div>
          <h2>Recent cues</h2>
          <p className="support-copy">
            Last emitted musical events derived from appended log lines.
          </p>
        </div>
      </div>

      {recentCues.length > 0 ? (
        <div className="cue-pill-strip">
          {recentCues.map((cue) => (
            <article key={cue.id} className="cue-pill">
              <span>
                {cue.level} · {cue.waveform} · {cue.routeLabel}
              </span>
              <strong>{cue.component}</strong>
              <small>
                {formatFrequency(cue.noteHz)} · {cue.durationMs} ms
              </small>
              <small>
                {cue.stemLabel} · {cue.sectionLabel}
              </small>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No live cues emitted yet.</p>
        </div>
      )}

      <div className="panel-header compact top-spaced">
        <div>
          <h2>Recent anomaly markers</h2>
          <p className="support-copy">
            Last spikes Maia translated into stronger accents.
          </p>
        </div>
      </div>

      {recentMarkers.length > 0 ? (
        <ul className="stack-list">
          {recentMarkers.map((marker) => (
            <li key={`${marker.eventIndex}-${marker.component}-${marker.level}`}>
              <strong>
                Event {marker.eventIndex} · {marker.level} · {marker.component}
              </strong>
              <small>{marker.excerpt}</small>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <p>No anomaly markers have been heard in this session.</p>
        </div>
      )}

      {recentWarnings.length > 0 || error ? (
        <>
          <div className="panel-header compact top-spaced">
            <div>
              <h2>Monitor notes</h2>
              <p className="support-copy">
                Runtime notes from the internal tail loop and audio engine.
              </p>
            </div>
          </div>
          <ul className="stack-list live-log-warning-list">
            {error ? (
              <li key="live-log-error">
                <strong>Runtime error</strong>
                <small>{error}</small>
              </li>
            ) : null}
            {recentWarnings.map((warning) => (
              <li key={warning}>
                <strong>Monitor note</strong>
                <small>{warning}</small>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
