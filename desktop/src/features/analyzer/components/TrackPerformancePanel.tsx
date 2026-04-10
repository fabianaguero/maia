import { useEffect, useState } from "react";
import type {
  LibraryTrack,
  TrackCuePoint,
  TrackSavedLoop,
  UpdateTrackPerformanceInput,
} from "../../../types/library";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import { formatShortDateTime } from "../../../utils/date";
import {
  canCreateBeatLoop,
  canCreateHotCue,
  canCreateSavedLoop,
  createTrackCuePoint,
  createTrackSavedLoop,
  createTrackSavedLoopFromRange,
  formatTrackTime,
  getTrackAvailabilityLabel,
  hasUsableBeatGrid,
  removeTrackCuePoint,
  removeTrackSavedLoop,
  resolveTrackPlacementSecond,
  setTrackSavedLoopBoundary,
  snapTrackSecond,
  updateTrackCuePoint,
  updateTrackSavedLoop,
} from "../../../utils/track";

interface TrackPerformancePanelProps {
  track: LibraryTrack;
  busy?: boolean;
  currentTime?: number;
  selectedPhraseRange?: BeatGridPhraseRange | null;
  onUpdatePerformance?: (input: UpdateTrackPerformanceInput) => Promise<void>;
}

const TRACK_COLOR_OPTIONS = [
  { value: "", label: "None" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#22d3ee", label: "Cyan" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#84cc16", label: "Lime" },
];

const LOOP_BEAT_PRESETS = [4, 8, 16];

function renderCueLabel(cue: TrackCuePoint): string {
  const slotLabel = cue.slot !== null ? `Slot ${cue.slot}` : cue.kind;
  return `${cue.label} · ${formatTrackTime(cue.second)} · ${slotLabel}`;
}

function renderLoopLabel(loop: TrackSavedLoop): string {
  const slotLabel = loop.slot !== null ? `Slot ${loop.slot}` : "Loop";
  const lockLabel = loop.locked ? "Locked" : "Editable";
  return `${loop.label} · ${formatTrackTime(loop.startSecond)} -> ${formatTrackTime(loop.endSecond)} · ${slotLabel} · ${lockLabel}`;
}

export function TrackPerformancePanel({
  track,
  busy = false,
  currentTime = 0,
  selectedPhraseRange = null,
  onUpdatePerformance,
}: TrackPerformancePanelProps) {
  const { performance } = track;
  const durationSeconds = track.analysis.durationSeconds;
  const bpm = track.analysis.bpm;
  const beatGrid = track.analysis.beatGrid;
  const canEditPerformance = !busy && !!onUpdatePerformance;
  const canAddHot = canCreateHotCue(performance.hotCues);
  const canAddLoop = canCreateSavedLoop(performance.savedLoops);
  const quantizeAvailable = hasUsableBeatGrid(beatGrid);
  const [quantizeEnabled, setQuantizeEnabled] = useState(quantizeAvailable);

  useEffect(() => {
    setQuantizeEnabled(quantizeAvailable);
  }, [track.id, quantizeAvailable]);

  const placementSecond = resolveTrackPlacementSecond(
    currentTime,
    durationSeconds,
    beatGrid,
    quantizeEnabled,
  );

  const updatePerformance = (input: UpdateTrackPerformanceInput) => {
    if (!canEditPerformance) {
      return;
    }

    return onUpdatePerformance(input);
  };

  const addCue = (kind: "hot" | "memory") => {
    const existingCues =
      kind === "hot" ? performance.hotCues : performance.memoryCues;
    const nextCue = createTrackCuePoint(
      kind,
      placementSecond,
      existingCues,
      durationSeconds,
    );

    return updatePerformance({
      [kind === "hot" ? "hotCues" : "memoryCues"]: [...existingCues, nextCue],
    });
  };

  const removeCue = (kind: "hot" | "memory", cueId: string) => {
    const existingCues =
      kind === "hot" ? performance.hotCues : performance.memoryCues;

    return updatePerformance({
      [kind === "hot" ? "hotCues" : "memoryCues"]: removeTrackCuePoint(
        existingCues,
        cueId,
      ),
    });
  };

  const addSavedLoop = (beatCount: number) => {
    const nextLoop = createTrackSavedLoop(
      placementSecond,
      beatCount,
      bpm,
      performance.savedLoops,
      durationSeconds,
    );

    return updatePerformance({
      savedLoops: [...performance.savedLoops, nextLoop],
    });
  };

  const addSelectedPhraseLoop = () => {
    if (!selectedPhraseRange) {
      return;
    }

    const nextLoop = createTrackSavedLoopFromRange(
      selectedPhraseRange.startSecond,
      selectedPhraseRange.endSecond,
      performance.savedLoops,
      durationSeconds,
      selectedPhraseRange.label,
    );

    return updatePerformance({
      savedLoops: [...performance.savedLoops, nextLoop],
    });
  };

  const removeSavedLoop = (loopId: string) =>
    updatePerformance({
      savedLoops: removeTrackSavedLoop(performance.savedLoops, loopId),
    });

  const patchCue = (
    kind: "hot" | "memory",
    cueId: string,
    patch: Partial<Pick<TrackCuePoint, "label" | "color">>,
  ) => {
    const existingCues =
      kind === "hot" ? performance.hotCues : performance.memoryCues;

    return updatePerformance({
      [kind === "hot" ? "hotCues" : "memoryCues"]: updateTrackCuePoint(
        existingCues,
        cueId,
        patch,
      ),
    });
  };

  const patchSavedLoop = (
    loopId: string,
    patch: Partial<Pick<TrackSavedLoop, "label" | "color" | "locked">>,
  ) =>
    updatePerformance({
      savedLoops: updateTrackSavedLoop(performance.savedLoops, loopId, patch),
    });

  const setSavedLoopBoundary = (
    loopId: string,
    boundary: "start" | "end",
  ) =>
    updatePerformance({
      savedLoops: setTrackSavedLoopBoundary(
        performance.savedLoops,
        loopId,
        boundary,
        currentTime,
        {
          bpm,
          durationSeconds,
          beatGrid,
          quantizeEnabled,
        },
      ),
    });

  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>Performance</h2>
          <p className="support-copy">
            DJ-style library state persisted separately from analysis artifacts.
          </p>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>Availability</span>
          <strong>{getTrackAvailabilityLabel(track)}</strong>
        </div>
        <div>
          <span>Main cue</span>
          <strong>{formatTrackTime(performance.mainCueSecond)}</strong>
        </div>
        <div>
          <span>Hot cues</span>
          <strong>{performance.hotCues.length}</strong>
        </div>
        <div>
          <span>Memory cues</span>
          <strong>{performance.memoryCues.length}</strong>
        </div>
        <div>
          <span>Saved loops</span>
          <strong>{performance.savedLoops.length}</strong>
        </div>
        <div>
          <span>Rating</span>
          <strong>{performance.rating}/5</strong>
        </div>
        <div>
          <span>Play count</span>
          <strong>{performance.playCount}</strong>
        </div>
        <div>
          <span>Last played</span>
          <strong>{performance.lastPlayedAt ? formatShortDateTime(performance.lastPlayedAt) : "Never"}</strong>
        </div>
        <div>
          <span>BPM lock</span>
          <strong>{performance.bpmLock ? "Locked" : "Open"}</strong>
        </div>
        <div>
          <span>Grid lock</span>
          <strong>{performance.gridLock ? "Locked" : "Open"}</strong>
        </div>
      </div>

      <div className="top-spaced">
        <p className="support-copy">Performance controls</p>
        <div className="pill-strip top-spaced">
          <span>
            <label>
              Rating
              <select
                className="compact-select"
                aria-label="Performance rating"
                value={performance.rating}
                disabled={!canEditPerformance}
                onChange={(event) =>
                  void updatePerformance({
                    rating: Number(event.target.value),
                  })
                }
              >
                {[0, 1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </span>
          <span>
            <label>
              Color
              <select
                className="compact-select"
                aria-label="Performance color"
                value={performance.color ?? ""}
                disabled={!canEditPerformance}
                onChange={(event) =>
                  void updatePerformance({
                    color: event.target.value || null,
                  })
                }
              >
                {TRACK_COLOR_OPTIONS.map((option) => (
                  <option key={option.value || "none"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </span>
          <span>
            <button
              type="button"
              className="compact-action"
              disabled={!canEditPerformance}
              onClick={() =>
                void updatePerformance({
                  bpmLock: !performance.bpmLock,
                })
              }
            >
              {performance.bpmLock ? "Unlock BPM" : "Lock BPM"}
            </button>
          </span>
          <span>
            <button
              type="button"
              className="compact-action"
              disabled={!canEditPerformance}
              onClick={() =>
                void updatePerformance({
                  gridLock: !performance.gridLock,
                })
              }
            >
              {performance.gridLock ? "Unlock grid" : "Lock grid"}
            </button>
          </span>
          <span>
            <button
              type="button"
              className="secondary-action"
              disabled={!canEditPerformance}
              onClick={() =>
                void updatePerformance({
                  markPlayed: true,
                })
              }
            >
              Mark played
            </button>
          </span>
        </div>
      </div>

      <details className="panel-collapsible top-spaced">
        <summary className="panel-collapsible-summary">Cues &amp; loops</summary>
        <div className="panel-collapsible-body">
          <div className="status-stack">
            <div className="status-row">
              <span>Color tag</span>
              <strong>{performance.color ?? "None"}</strong>
            </div>
            <div className="status-row">
              <span>Quantize</span>
              <strong>{quantizeEnabled && quantizeAvailable ? "On" : "Off"}</strong>
            </div>
          </div>

          <p className="support-copy top-spaced">
            Playhead cue tools at {formatTrackTime(currentTime)}
            {placementSecond !== snapTrackSecond(currentTime, durationSeconds)
              ? ` → ${formatTrackTime(placementSecond)}`
              : ""}
          </p>
          <div className="pill-strip top-spaced">
            <span>
              <button
                type="button"
                className="compact-action"
                aria-pressed={quantizeEnabled && quantizeAvailable}
                disabled={!quantizeAvailable}
                onClick={() => setQuantizeEnabled((value) => !value)}
              >
                {quantizeEnabled && quantizeAvailable ? "Quantize on" : "Quantize off"}
              </button>
            </span>
            <span>
              <button
                type="button"
                className="compact-action"
                disabled={!canEditPerformance}
                onClick={() =>
                  void updatePerformance({
                    mainCueSecond: placementSecond,
                  })
                }
              >
                Set main cue
              </button>
            </span>
            <span>
              <button
                type="button"
                className="compact-action"
                disabled={!canEditPerformance || performance.mainCueSecond === null}
                onClick={() =>
                  void updatePerformance({
                    mainCueSecond: null,
                  })
                }
              >
                Clear main cue
              </button>
            </span>
            <span>
              <button
                type="button"
                className="compact-action"
                disabled={!canEditPerformance || !canAddHot}
                onClick={() => void addCue("hot")}
              >
                Add hot cue
              </button>
            </span>
            <span>
              <button
                type="button"
                className="compact-action"
                disabled={!canEditPerformance}
                onClick={() => void addCue("memory")}
              >
                Add memory cue
              </button>
            </span>
          </div>

          <p className="support-copy top-spaced">
            Beat loops from detected BPM {typeof bpm === "number" ? bpm.toFixed(1) : "Pending"}
          </p>
          <div className="pill-strip top-spaced">
            {LOOP_BEAT_PRESETS.map((beatCount) => (
              <span key={beatCount}>
                <button
                  type="button"
                  className="compact-action"
                  disabled={
                    !canEditPerformance ||
                    !canAddLoop ||
                    !canCreateBeatLoop(
                      bpm,
                      placementSecond,
                      beatCount,
                      durationSeconds,
                    )
                  }
                  onClick={() => void addSavedLoop(beatCount)}
                >
                  Save {beatCount}-beat loop
                </button>
              </span>
            ))}
          </div>

          {selectedPhraseRange ? (
            <>
              <p className="support-copy top-spaced">
                {selectedPhraseRange.label} selected
                {` · ${formatTrackTime(selectedPhraseRange.startSecond)} -> ${formatTrackTime(selectedPhraseRange.endSecond)}`}
              </p>
              <div className="pill-strip top-spaced">
                <span>
                  <button
                    type="button"
                    className="compact-action"
                    disabled={!canEditPerformance}
                    onClick={() =>
                      void updatePerformance({
                        mainCueSecond: selectedPhraseRange.startSecond,
                      })
                    }
                  >
                    Set cue to phrase start
                  </button>
                </span>
                <span>
                  <button
                    type="button"
                    className="compact-action"
                    disabled={!canEditPerformance}
                    onClick={() =>
                      void updatePerformance({
                        memoryCues: [
                          ...performance.memoryCues,
                          createTrackCuePoint(
                            "memory",
                            selectedPhraseRange.startSecond,
                            performance.memoryCues,
                            durationSeconds,
                          ),
                        ],
                      })
                    }
                  >
                    Add phrase memory cue
                  </button>
                </span>
                <span>
                  <button
                    type="button"
                    className="compact-action"
                    disabled={!canEditPerformance || !canAddLoop}
                    onClick={() => void addSelectedPhraseLoop()}
                  >
                    Save phrase loop
                  </button>
                </span>
              </div>
            </>
          ) : (
            <p className="support-copy top-spaced">
              Arm phrase select on the waveform to capture phrase-aligned cues and loops.
            </p>
          )}

          <p className="support-copy top-spaced">Hot cues</p>
          {performance.hotCues.length > 0 ? (
            <ul className="stack-list">
              {performance.hotCues.map((cue) => (
                <li key={cue.id}>
                  <div className="pill-strip">
                    <span>{renderCueLabel(cue)}</span>
                    <span>
                      <label>
                        Label
                        <input
                          key={`${cue.id}:${cue.label}`}
                          className="compact-input"
                          aria-label={`Cue label ${cue.id}`}
                          defaultValue={cue.label}
                          disabled={!canEditPerformance}
                          onBlur={(event) =>
                            void patchCue("hot", cue.id, {
                              label: event.target.value,
                            })
                          }
                        />
                      </label>
                    </span>
                    <span>
                      <label>
                        Color
                        <select
                          className="compact-select"
                          aria-label={`Cue color ${cue.id}`}
                          value={cue.color ?? ""}
                          disabled={!canEditPerformance}
                          onChange={(event) =>
                            void patchCue("hot", cue.id, {
                              color: event.target.value || null,
                            })
                          }
                        >
                          {TRACK_COLOR_OPTIONS.map((option) => (
                            <option key={option.value || "none"} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </span>
                    <span>
                      <button
                        type="button"
                        className="compact-action danger"
                        disabled={!canEditPerformance}
                        onClick={() => void removeCue("hot", cue.id)}
                      >
                        Remove {cue.label}
                      </button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="support-copy">No hot cues stored.</p>
          )}

          <p className="support-copy top-spaced">Memory cues</p>
          {performance.memoryCues.length > 0 ? (
            <ul className="stack-list">
              {performance.memoryCues.map((cue) => (
                <li key={cue.id}>
                  <div className="pill-strip">
                    <span>{renderCueLabel(cue)}</span>
                    <span>
                      <label>
                        Label
                        <input
                          key={`${cue.id}:${cue.label}`}
                          className="compact-input"
                          aria-label={`Cue label ${cue.id}`}
                          defaultValue={cue.label}
                          disabled={!canEditPerformance}
                          onBlur={(event) =>
                            void patchCue("memory", cue.id, {
                              label: event.target.value,
                            })
                          }
                        />
                      </label>
                    </span>
                    <span>
                      <label>
                        Color
                        <select
                          className="compact-select"
                          aria-label={`Cue color ${cue.id}`}
                          value={cue.color ?? ""}
                          disabled={!canEditPerformance}
                          onChange={(event) =>
                            void patchCue("memory", cue.id, {
                              color: event.target.value || null,
                            })
                          }
                        >
                          {TRACK_COLOR_OPTIONS.map((option) => (
                            <option key={option.value || "none"} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </span>
                    <span>
                      <button
                        type="button"
                        className="compact-action danger"
                        disabled={!canEditPerformance}
                        onClick={() => void removeCue("memory", cue.id)}
                      >
                        Remove {cue.label}
                      </button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="support-copy">No memory cues stored.</p>
          )}

          <p className="support-copy top-spaced">Saved loops</p>
          {performance.savedLoops.length > 0 ? (
            <ul className="stack-list">
              {performance.savedLoops.map((loop) => (
                <li key={loop.id}>
                  <div className="pill-strip">
                    <span>{renderLoopLabel(loop)}</span>
                    <span>
                      <button
                        type="button"
                        className="compact-action"
                        aria-label={`Set loop start ${loop.id}`}
                        disabled={!canEditPerformance}
                        onClick={() => void setSavedLoopBoundary(loop.id, "start")}
                      >
                        Set start
                      </button>
                    </span>
                    <span>
                      <button
                        type="button"
                        className="compact-action"
                        aria-label={`Set loop end ${loop.id}`}
                        disabled={!canEditPerformance}
                        onClick={() => void setSavedLoopBoundary(loop.id, "end")}
                      >
                        Set end
                      </button>
                    </span>
                    <span>
                      <label>
                        Label
                        <input
                          key={`${loop.id}:${loop.label}`}
                          className="compact-input"
                          aria-label={`Loop label ${loop.id}`}
                          defaultValue={loop.label}
                          disabled={!canEditPerformance}
                          onBlur={(event) =>
                            void patchSavedLoop(loop.id, {
                              label: event.target.value,
                            })
                          }
                        />
                      </label>
                    </span>
                    <span>
                      <label>
                        Color
                        <select
                          className="compact-select"
                          aria-label={`Loop color ${loop.id}`}
                          value={loop.color ?? ""}
                          disabled={!canEditPerformance}
                          onChange={(event) =>
                            void patchSavedLoop(loop.id, {
                              color: event.target.value || null,
                            })
                          }
                        >
                          {TRACK_COLOR_OPTIONS.map((option) => (
                            <option key={option.value || "none"} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </span>
                    <span>
                      <button
                        type="button"
                        className="compact-action"
                        aria-label={`Toggle loop lock ${loop.id}`}
                        disabled={!canEditPerformance}
                        onClick={() =>
                          void patchSavedLoop(loop.id, {
                            locked: !loop.locked,
                          })
                        }
                      >
                        {loop.locked ? "Unlock loop" : "Lock loop"}
                      </button>
                    </span>
                    <span>
                      <button
                        type="button"
                        className="compact-action danger"
                        disabled={!canEditPerformance}
                        onClick={() => void removeSavedLoop(loop.id)}
                      >
                        Remove {loop.label}
                      </button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="support-copy">No saved loops stored.</p>
          )}
        </div>
      </details>
    </section>
  );
}
