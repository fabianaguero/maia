import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { convertFileSrc, isTauri } from "@tauri-apps/api/core";

import type {
  BaseAssetRecord,
  CompositionResultRecord,
  LibraryTrack,
  LiveLogCue,
  LiveLogMarker,
  LiveLogStreamUpdate,
  RepositoryAnalysis,
  StartSessionInput,
  StreamAdapterKind,
} from "../../../types/library";
import { useMonitor } from "../../monitor/MonitorContext";
import { musicStyleCatalog } from "../../../config/musicStyles";
import { LiveSonificationScenePanel } from "./LiveSonificationScenePanel";
import {
  blendAnchors,
  deriveReferenceAnchor,
  resolveLiveSonificationScene,
  routeCueThroughScene,
  type RoutedLiveCue,
} from "./liveSonificationScene";

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
  availableTracks: LibraryTrack[];
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

interface MonitorPrefs {
  referencePlaylistIds: string[];
  selectedGenreId: string;
  selectedPresetId: string;
}

function loadMonitorPrefs(repoId: string): MonitorPrefs | null {
  try {
    const raw = localStorage.getItem(`maia.monitor-prefs.${repoId}`);
    return raw ? (JSON.parse(raw) as MonitorPrefs) : null;
  } catch {
    return null;
  }
}

function saveMonitorPrefs(repoId: string, prefs: MonitorPrefs): void {
  try {
    localStorage.setItem(`maia.monitor-prefs.${repoId}`, JSON.stringify(prefs));
  } catch {
    // ignore quota / private-browsing storage errors
  }
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

// ---------------------------------------------------------------------------
// Beat clock — phase-accurate scheduling across poll windows
// ---------------------------------------------------------------------------

interface BeatClock {
  /** AudioContext time at session start — the phase anchor */
  originTime: number;
  /** BPM the clock was initialised with (anchor or live-detected) */
  bpm: number;
}

/**
 * Returns the next subdivision boundary after `contextNow + lookaheadS`.
 * subdivision=4 → quarter notes, 8 → eighth notes, 16 → sixteenth notes.
 */
function nextBeatTime(
  contextNow: number,
  originTime: number,
  bpm: number,
  subdivision: number,
  lookaheadS: number,
): number {
  const subdivPeriodS = 60 / bpm / Math.max(1, subdivision / 4);
  const elapsed = contextNow + lookaheadS - originTime;
  const nextCount = Math.max(0, Math.ceil(elapsed / subdivPeriodS));
  return originTime + nextCount * subdivPeriodS;
}

function statusLabel(liveEnabled: boolean): string {
  return liveEnabled ? "Live" : "Stopped";
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
  availableTracks,
}: LiveLogMonitorPanelProps) {
  const monitor = useMonitor();
  // Session is live for THIS repo when the global monitor owns it
  const liveEnabled = monitor.session?.repoId === repository.id;

  const audioContextRef = useRef<AudioContext | null>(null);
  const sampleBuffersRef = useRef(new Map<string, AudioBuffer>());
  const [adapterKind, setAdapterKind] = useState<StreamAdapterKind>("file");
  const [processCommand, setProcessCommand] = useState("");
  const [wsUrl, setWsUrl] = useState("ws://");
  const [httpUrl, setHttpUrl] = useState("http://");
  const [selectedGenreId, setSelectedGenreId] = useState(
    () => loadMonitorPrefs(repository.id)?.selectedGenreId ?? musicStyleCatalog.defaultTrackMusicStyleId,
  );
  const [selectedPresetId, setSelectedPresetId] = useState(
    () => loadMonitorPrefs(repository.id)?.selectedPresetId ?? "balanced",
  );
  const [referencePlaylistIds, setReferencePlaylistIds] = useState<string[]>(
    () => loadMonitorPrefs(repository.id)?.referencePlaylistIds ?? [],
  );
  const [pendingAddTrackId, setPendingAddTrackId] = useState("");
  const beatClockRef = useRef<BeatClock | null>(null);
  const [beatClockBpm, setBeatClockBpm] = useState<number | null>(null);
  const knownComponentsRef = useRef<string[]>([]);
  const [sceneBaseAssetId, setSceneBaseAssetId] = useState(() =>
    preferredBaseAssetId(availableBaseAssets, preferredBaseAssetIdProp),
  );
  const [sceneCompositionId, setSceneCompositionId] = useState(() =>
    preferredCompositionId(availableCompositions, preferredCompositionIdProp),
  );
  const [audioStatus, setAudioStatus] = useState<AudioEngineStatus>("idle");
  const [sampleStatus, setSampleStatus] = useState<SampleEngineStatus>("unavailable");
  const [lastUpdate, setLastUpdate] = useState<LiveLogStreamUpdate | null>(null);
  const [emittedCueCount, setEmittedCueCount] = useState(0);
  const [recentCues, setRecentCues] = useState<RoutedLiveCue[]>([]);
  const [recentMarkers, setRecentMarkers] = useState<LiveLogMarker[]>([]);
  const [recentWarnings, setRecentWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const selectedSceneBaseAsset =
    availableBaseAssets.find((entry) => entry.id === sceneBaseAssetId) ?? null;
  const selectedSceneComposition =
    availableCompositions.find((entry) => entry.id === sceneCompositionId) ?? null;
  const playlistAnchors = referencePlaylistIds
    .map((id) => availableTracks.find((t) => t.id === id))
    .filter((t): t is LibraryTrack => t !== undefined)
    .map(deriveReferenceAnchor);
  const referenceAnchor =
    playlistAnchors.length > 0 ? blendAnchors(playlistAnchors) : null;
  const scene = resolveLiveSonificationScene(
    selectedSceneBaseAsset,
    selectedSceneComposition,
    selectedGenreId,
    selectedPresetId,
    referenceAnchor,
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

  // Close AudioContext on unmount — the background poll loop lives in MonitorContext
  useEffect(() => {
    return () => {
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

  // Reset local display state when switching repos; the background monitor keeps running
  useEffect(() => {
    setLastUpdate(null);
    setEmittedCueCount(0);
    setRecentCues([]);
    setRecentMarkers([]);
    setRecentWarnings([]);
    setError(null);
    knownComponentsRef.current = [];
    setSceneBaseAssetId(preferredBaseAssetId(availableBaseAssets, preferredBaseAssetIdProp));
    setSceneCompositionId(
      preferredCompositionId(availableCompositions, preferredCompositionIdProp),
    );
    const nextPrefs = loadMonitorPrefs(repository.id);
    setReferencePlaylistIds(nextPrefs?.referencePlaylistIds ?? []);
    setSelectedGenreId(nextPrefs?.selectedGenreId ?? musicStyleCatalog.defaultTrackMusicStyleId);
    setSelectedPresetId(nextPrefs?.selectedPresetId ?? "balanced");
    setPendingAddTrackId("");
    beatClockRef.current = null;
    setBeatClockBpm(null);
  }, [repository.id]);useEffect(() => {
    saveMonitorPrefs(repository.id, { referencePlaylistIds, selectedGenreId, selectedPresetId });
  }, [repository.id, referencePlaylistIds, selectedGenreId, selectedPresetId]);

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

  const playWithCurrentEngine = useEffectEvent(async (cues: RoutedLiveCue[], liveBpm?: number | null) => {
    if (cues.length === 0) {
      return;
    }

    const context = await ensureAudioReady();
    if (!context) {
      return;
    }

    const preset = scene.preset;
    const cappedCues = cues.slice(0, preset.maxCuesPerWindow);

    // Prefer the beat clock (seeded from the reference anchor), then fall back to the
    // live-detected BPM, then fall through to the free-running gap.
    const clock = beatClockRef.current;
    const activeBpm =
      clock?.bpm ??
      (typeof liveBpm === "number" && liveBpm > 0 ? liveBpm : null);
    const useBeat = preset.useBeatGrid && activeBpm !== null && clock !== null;

    const firstCueAt = useBeat
      ? nextBeatTime(
          context.currentTime,
          clock!.originTime,
          activeBpm!,
          preset.rhythmDivision,
          0.04,
        )
      : context.currentTime + 0.04;
    const gapSeconds = useBeat
      ? 60 / activeBpm! / Math.max(1, preset.rhythmDivision / 4)
      : preset.scheduleGapMs / 1000;

    for (const [index, cue] of cappedCues.entries()) {
      const cueStartAt = firstCueAt + index * gapSeconds;
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

  // ---------------------------------------------------------------------------
  // Stream update handler — receives poll windows from MonitorContext
  // ---------------------------------------------------------------------------

  const onStreamUpdate = useEffectEvent((update: LiveLogStreamUpdate) => {
    // Only process updates for the repo this panel is showing
    if (monitor.session?.repoId !== repository.id) return;

    // Accumulate known components for per-component stereo routing
    const updatedComponents = [...knownComponentsRef.current];
    for (const cmp of update.topComponents.map((c) => c.component)) {
      if (!updatedComponents.includes(cmp)) {
        updatedComponents.push(cmp);
      }
    }
    knownComponentsRef.current = updatedComponents.slice(0, 12);

    const routedCues = update.sonificationCues.map((cue, index) =>
      routeCueThroughScene(cue, scene, index, knownComponentsRef.current),
    );

    startTransition(() => {
      setLastUpdate(update);
      setRecentWarnings(update.warnings.slice(0, MAX_RECENT_WARNINGS));
      setError(null);

      if (!update.hasData) return;

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
      // Auto-seed beat clock from the first live BPM; re-sync on >12% drift
      const liveBpmVal = update.suggestedBpm;
      if (typeof liveBpmVal === "number" && liveBpmVal > 0) {
        if (beatClockRef.current === null && scene.preset.useBeatGrid) {
          const ctx = audioContextRef.current;
          if (ctx) {
            beatClockRef.current = { originTime: ctx.currentTime, bpm: liveBpmVal };
            setBeatClockBpm(liveBpmVal);
          }
        } else if (beatClockRef.current !== null) {
          const drift =
            Math.abs(liveBpmVal - beatClockRef.current.bpm) / beatClockRef.current.bpm;
          if (drift > 0.12) {
            beatClockRef.current = { ...beatClockRef.current, bpm: liveBpmVal };
            setBeatClockBpm(liveBpmVal);
          }
        }
      }

      void playWithCurrentEngine(routedCues, update.suggestedBpm);
    }
  });

  // Subscribe to the global monitor stream while this panel is mounted
  useEffect(() => {
    return monitor.subscribe(onStreamUpdate);
  }, [monitor]);

  // ---------------------------------------------------------------------------
  // Start / stop (delegate to MonitorContext)
  // ---------------------------------------------------------------------------

  async function handleStart() {
    setLastUpdate(null);
    setEmittedCueCount(0);
    setRecentCues([]);
    setRecentMarkers([]);
    setRecentWarnings([]);
    setError(null);

    const sessionId = `sess-${repository.id}-${Date.now()}`;
    let input: StartSessionInput;

    if (adapterKind === "process") {
      input = {
        sessionId,
        adapterKind: "process",
        source: repository.sourcePath,
        label: repository.title,
        command: processCommand
          .split(/\s+/)
          .map((s) => s.trim())
          .filter(Boolean),
      };
    } else if (adapterKind === "websocket") {
      const trimmedWsUrl = wsUrl.trim();
      if (!trimmedWsUrl || trimmedWsUrl === "ws://") {
        setError("A WebSocket URL is required (e.g. ws://localhost:9000/logs).");
        return;
      }
      input = {
        sessionId,
        adapterKind: "websocket",
        source: trimmedWsUrl,
        label: repository.title,
        wsUrl: trimmedWsUrl,
      };
    } else if (adapterKind === "http-poll") {
      const trimmedHttpUrl = httpUrl.trim();
      if (!trimmedHttpUrl || trimmedHttpUrl === "http://") {
        setError("An HTTP URL is required (e.g. http://localhost:9200/logs/stream).");
        return;
      }
      input = {
        sessionId,
        adapterKind: "http-poll",
        source: trimmedHttpUrl,
        label: repository.title,
        httpUrl: trimmedHttpUrl,
      };
    } else {
      input = {
        sessionId,
        adapterKind: "file",
        source: repository.sourcePath,
        label: repository.title,
      };
    }

    await monitor.startSession(repository, input);

    // Warm the audio engine and seed the beat clock from the reference anchor
    await ensureAudioReady();
    const anchorBpm = referenceAnchor?.bpm ?? null;
    const ctx = audioContextRef.current;
    if (ctx && anchorBpm && anchorBpm > 0) {
      beatClockRef.current = { originTime: ctx.currentTime, bpm: anchorBpm };
      setBeatClockBpm(anchorBpm);
    } else {
      beatClockRef.current = null;
      setBeatClockBpm(null);
    }
  }

  function handleStop() {
    void monitor.stopSession();
    beatClockRef.current = null;
    setBeatClockBpm(null);
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
            {statusLabel(liveEnabled)}
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
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                title="Sequencer preset — controls cue density, gain spread, and scheduling mode"
              >
                <option value="sparse">Sparse</option>
                <option value="balanced">Balanced</option>
                <option value="cascade">Cascade</option>
                <option value="beat-locked">Beat-locked</option>
              </select>
              {availableTracks.length > 0 ? (
                <>
                  <select
                    className="compact-select"
                    value={pendingAddTrackId}
                    onChange={(e) => setPendingAddTrackId(e.target.value)}
                    title="Pick a track to add to the reference playlist"
                  >
                    <option value="">Add reference track…</option>
                    {availableTracks
                      .filter((t) => !referencePlaylistIds.includes(t.id))
                      .map((track) => (
                        <option key={track.id} value={track.id}>
                          {track.title}
                          {track.bpm !== null ? ` · ${track.bpm.toFixed(0)} BPM` : ""}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    className="compact-action"
                    disabled={!pendingAddTrackId}
                    onClick={() => {
                      if (!pendingAddTrackId) {
                        return;
                      }
                      setReferencePlaylistIds((ids) =>
                        ids.includes(pendingAddTrackId) ? ids : [...ids, pendingAddTrackId],
                      );
                      setPendingAddTrackId("");
                    }}
                  >
                    + Add
                  </button>
                </>
              ) : null}
              <select
                className="compact-select"
                value={adapterKind}
                onChange={(e) => setAdapterKind(e.target.value as StreamAdapterKind)}
              >
                <option value="file">File tail</option>
                <option value="process">Process stdout</option>
                <option value="websocket">WebSocket</option>
                <option value="http-poll">HTTP poll</option>
              </select>
              {adapterKind === "websocket" ? (
                <input
                  className="compact-input compact-input--url"
                  placeholder="ws://host:port/path"
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                  aria-label="WebSocket URL"
                />
              ) : adapterKind === "http-poll" ? (
                <input
                  className="compact-input compact-input--url"
                  placeholder="http://host:port/logs/stream"
                  value={httpUrl}
                  onChange={(e) => setHttpUrl(e.target.value)}
                  aria-label="HTTP poll URL"
                />
              ) : null}
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

      {referencePlaylistIds.length > 0 ? (
        <div className="pill-strip top-spaced">
          {referencePlaylistIds.map((id, idx) => {
            const track = availableTracks.find((t) => t.id === id);
            if (!track) {
              return null;
            }
            return (
              <span key={id} className="pill-removable">
                <button
                  type="button"
                  className="pill-reorder"
                  aria-label={`Move ${track.title} up`}
                  disabled={idx === 0}
                  onClick={() =>
                    setReferencePlaylistIds((ids) => {
                      const next = [...ids];
                      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                      return next;
                    })
                  }
                >
                  ↑
                </button>
                {track.title}
                {track.bpm !== null ? ` · ${track.bpm.toFixed(0)} BPM` : ""}
                <button
                  type="button"
                  className="pill-reorder"
                  aria-label={`Move ${track.title} down`}
                  disabled={idx === referencePlaylistIds.length - 1}
                  onClick={() =>
                    setReferencePlaylistIds((ids) => {
                      const next = [...ids];
                      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                      return next;
                    })
                  }
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${track.title} from reference playlist`}
                  onClick={() =>
                    setReferencePlaylistIds((ids) => ids.filter((i) => i !== id))
                  }
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

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

      {liveEnabled && monitor.session ? (
        <div className="audio-path-card">
          <span>Session</span>
          <strong>{monitor.session.sessionId}</strong>
          {monitor.session.pollMode === "direct" ? (
            <em> (fallback — direct file poll)</em>
          ) : monitor.session.pollMode === "websocket" ? (
            <em> · WebSocket — {monitor.session.sourcePath}</em>
          ) : monitor.session.pollMode === "http-poll" ? (
            <em> · HTTP poll — {monitor.session.sourcePath}</em>
          ) : null}
        </div>
      ) : null}

      <div className="metric-grid">
        <div>
          <span>Mode</span>
          <strong>
            {adapterKind === "process"
              ? "Process stdout"
              : adapterKind === "websocket"
                ? "WebSocket"
                : adapterKind === "http-poll"
                  ? "HTTP poll"
                  : "File tail"}
          </strong>
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
          <span>Windows heard</span>
          <strong>{monitor.metrics.windowCount}</strong>
        </div>
        <div>
          <span>Cues emitted</span>
          <strong>{emittedCueCount}</strong>
        </div>
        <div>
          <span>Lines processed</span>
          <strong>{monitor.metrics.processedLines}</strong>
        </div>
        <div>
          <span>Anomalies heard</span>
          <strong>{monitor.metrics.totalAnomalies}</strong>
        </div>
        <div>
          <span>Beat clock</span>
          <strong>
            {beatClockBpm !== null ? `${beatClockBpm.toFixed(0)} BPM` : "Free"}
          </strong>
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
