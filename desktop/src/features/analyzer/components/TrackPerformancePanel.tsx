import { useEffect, useState } from "react";
import { useT } from "../../../i18n/I18nContext";
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
  hasUsableBeatGrid,
  removeTrackCuePoint,
  removeTrackSavedLoop,
  resolveTrackPlacementSecond,
  setTrackSavedLoopBoundary,
  snapTrackSecond,
  updateTrackCuePoint,
  updateTrackSavedLoop,
} from "../../../utils/track";
import { TrackCueList } from "./TrackCueList";
import { TrackSavedLoopList } from "./TrackSavedLoopList";

interface TrackPerformancePanelProps {
  track: LibraryTrack;
  busy?: boolean;
  currentTime?: number;
  selectedPhraseRange?: BeatGridPhraseRange | null;
  onUpdatePerformance?: (input: UpdateTrackPerformanceInput) => Promise<void>;
}

const LOOP_BEAT_PRESETS = [4, 8, 16];

function renderCueLabel(cue: TrackCuePoint, slotTemplate: string): string {
  const slotLabel = cue.slot !== null ? slotTemplate.replace("{slot}", String(cue.slot)) : cue.kind;
  return `${cue.label} · ${formatTrackTime(cue.second)} · ${slotLabel}`;
}

function renderLoopLabel(
  loop: TrackSavedLoop,
  slotTemplate: string,
  loopWord: string,
  lockedLabel: string,
  editableLabel: string,
): string {
  const slotLabel =
    loop.slot !== null ? slotTemplate.replace("{slot}", String(loop.slot)) : loopWord;
  const lockLabel = loop.locked ? lockedLabel : editableLabel;
  return `${loop.label} · ${formatTrackTime(loop.startSecond)} -> ${formatTrackTime(loop.endSecond)} · ${slotLabel} · ${lockLabel}`;
}

export function TrackPerformancePanel({
  track,
  busy = false,
  currentTime = 0,
  selectedPhraseRange = null,
  onUpdatePerformance,
}: TrackPerformancePanelProps) {
  const t = useT();
  const { performance } = track;
  const TRACK_COLOR_OPTIONS = [
    { value: "", label: t.inspect.none },
    { value: "#f59e0b", label: t.inspect.amber },
    { value: "#22d3ee", label: t.inspect.cyan },
    { value: "#ef4444", label: t.inspect.red },
    { value: "#8b5cf6", label: t.inspect.violet },
    { value: "#84cc16", label: t.inspect.lime },
  ];
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
    const existingCues = kind === "hot" ? performance.hotCues : performance.memoryCues;
    const nextCue = createTrackCuePoint(kind, placementSecond, existingCues, durationSeconds);

    return updatePerformance({
      [kind === "hot" ? "hotCues" : "memoryCues"]: [...existingCues, nextCue],
    });
  };

  const removeCue = (kind: "hot" | "memory", cueId: string) => {
    const existingCues = kind === "hot" ? performance.hotCues : performance.memoryCues;

    return updatePerformance({
      [kind === "hot" ? "hotCues" : "memoryCues"]: removeTrackCuePoint(existingCues, cueId),
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
    const existingCues = kind === "hot" ? performance.hotCues : performance.memoryCues;

    return updatePerformance({
      [kind === "hot" ? "hotCues" : "memoryCues"]: updateTrackCuePoint(existingCues, cueId, patch),
    });
  };

  const patchSavedLoop = (
    loopId: string,
    patch: Partial<Pick<TrackSavedLoop, "label" | "color" | "locked">>,
  ) =>
    updatePerformance({
      savedLoops: updateTrackSavedLoop(performance.savedLoops, loopId, patch),
    });

  const setSavedLoopBoundary = (loopId: string, boundary: "start" | "end") =>
    updatePerformance({
      savedLoops: setTrackSavedLoopBoundary(performance.savedLoops, loopId, boundary, currentTime, {
        bpm,
        durationSeconds,
        beatGrid,
        quantizeEnabled,
      }),
    });

  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>{t.inspect.performanceTitle}</h2>
          <p className="support-copy">{t.inspect.performanceCopy}</p>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>{t.inspect.availability}</span>
          <strong>
            {track.file.availabilityState === "missing" ? t.inspect.missing : t.inspect.available}
          </strong>
        </div>
        <div>
          <span>{t.inspect.mainCue}</span>
          <strong>{formatTrackTime(performance.mainCueSecond)}</strong>
        </div>
        <div>
          <span>{t.inspect.hotCues}</span>
          <strong>{performance.hotCues.length}</strong>
        </div>
        <div>
          <span>{t.inspect.memoryCues}</span>
          <strong>{performance.memoryCues.length}</strong>
        </div>
        <div>
          <span>{t.inspect.savedLoops}</span>
          <strong>{performance.savedLoops.length}</strong>
        </div>
        <div>
          <span>{t.inspect.rating}</span>
          <strong>{performance.rating}/5</strong>
        </div>
        <div>
          <span>{t.inspect.playCount}</span>
          <strong>{performance.playCount}</strong>
        </div>
        <div>
          <span>{t.inspect.lastPlayed}</span>
          <strong>
            {performance.lastPlayedAt
              ? formatShortDateTime(performance.lastPlayedAt)
              : t.inspect.never}
          </strong>
        </div>
        <div>
          <span>{t.inspect.bpmLockLabel}</span>
          <strong>{performance.bpmLock ? t.inspect.locked : t.inspect.open}</strong>
        </div>
        <div>
          <span>{t.inspect.gridLockLabel}</span>
          <strong>{performance.gridLock ? t.inspect.locked : t.inspect.open}</strong>
        </div>
      </div>

      <div className="top-spaced">
        <p className="support-copy">{t.inspect.performanceControls}</p>
        <div className="pill-strip top-spaced">
          <span>
            <label>
              {t.inspect.rating}
              <select
                className="compact-select"
                aria-label={t.inspect.performanceTitle}
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
              {t.inspect.color}
              <select
                className="compact-select"
                aria-label={t.inspect.color}
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
              {performance.bpmLock ? t.inspect.unlockBpm : t.inspect.lockBpm}
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
              {performance.gridLock ? t.inspect.unlockGrid : t.inspect.lockGrid}
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
              {t.inspect.markPlayed}
            </button>
          </span>
        </div>
      </div>

      <details className="panel-collapsible top-spaced">
        <summary className="panel-collapsible-summary">{t.inspect.cuesLoops}</summary>
        <div className="panel-collapsible-body">
          <div className="status-stack">
            <div className="status-row">
              <span>{t.inspect.colorTag}</span>
              <strong>{performance.color ?? t.inspect.none}</strong>
            </div>
            <div className="status-row">
              <span>{t.inspect.quantize}</span>
              <strong>{quantizeEnabled && quantizeAvailable ? t.inspect.on : t.inspect.off}</strong>
            </div>
          </div>

          <p className="support-copy top-spaced">
            {t.inspect.playheadCueToolsAt.replace("{time}", formatTrackTime(currentTime))}
            {placementSecond !== snapTrackSecond(currentTime, durationSeconds)
              ? ` ${t.inspect.quantizedTo.replace("{time}", formatTrackTime(placementSecond))}`
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
                {quantizeEnabled && quantizeAvailable
                  ? t.inspect.quantizeOn
                  : t.inspect.quantizeOff}
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
                {t.inspect.setMainCue}
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
                {t.inspect.clearMainCue}
              </button>
            </span>
            <span>
              <button
                type="button"
                className="compact-action"
                disabled={!canEditPerformance || !canAddHot}
                onClick={() => void addCue("hot")}
              >
                {t.inspect.addHotCue}
              </button>
            </span>
            <span>
              <button
                type="button"
                className="compact-action"
                disabled={!canEditPerformance}
                onClick={() => void addCue("memory")}
              >
                {t.inspect.addMemoryCue}
              </button>
            </span>
          </div>

          <p className="support-copy top-spaced">
            {t.inspect.beatLoopsFromDetectedBpm.replace(
              "{bpm}",
              typeof bpm === "number" ? bpm.toFixed(1) : t.inspect.pending,
            )}
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
                    !canCreateBeatLoop(bpm, placementSecond, beatCount, durationSeconds)
                  }
                  onClick={() => void addSavedLoop(beatCount)}
                >
                  {t.inspect.saveBeatLoop.replace("{count}", String(beatCount))}
                </button>
              </span>
            ))}
          </div>

          {selectedPhraseRange ? (
            <>
              <p className="support-copy top-spaced">
                {t.inspect.phraseSelected
                  .replace("{label}", selectedPhraseRange.label)
                  .replace("{start}", formatTrackTime(selectedPhraseRange.startSecond))
                  .replace("{end}", formatTrackTime(selectedPhraseRange.endSecond))}
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
                    {t.inspect.setCuePhraseStart}
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
                    {t.inspect.addPhraseMemoryCue}
                  </button>
                </span>
                <span>
                  <button
                    type="button"
                    className="compact-action"
                    disabled={!canEditPerformance || !canAddLoop}
                    onClick={() => void addSelectedPhraseLoop()}
                  >
                    {t.inspect.savePhraseLoop}
                  </button>
                </span>
              </div>
            </>
          ) : (
            <p className="support-copy top-spaced">{t.inspect.armPhraseSelect}</p>
          )}

          <TrackCueList
            cues={performance.hotCues}
            cueKind="hot"
            canEditPerformance={canEditPerformance}
            sectionLabel={t.inspect.hotCues}
            emptyLabel={t.inspect.noHotCuesStored}
            labelText={t.inspect.label}
            colorText={t.inspect.color}
            removeText={(name) => t.inspect.removeNamed.replace("{name}", name)}
            slotTemplate={t.inspect.slot}
            onPatchCue={(kind, cueId, patch) => void patchCue(kind, cueId, patch)}
            onRemoveCue={(kind, cueId) => void removeCue(kind, cueId)}
            renderCueLabel={renderCueLabel}
            colorOptions={TRACK_COLOR_OPTIONS}
          />

          <TrackCueList
            cues={performance.memoryCues}
            cueKind="memory"
            canEditPerformance={canEditPerformance}
            sectionLabel={t.inspect.memoryCues}
            emptyLabel={t.inspect.noMemoryCuesStored}
            labelText={t.inspect.label}
            colorText={t.inspect.color}
            removeText={(name) => t.inspect.removeNamed.replace("{name}", name)}
            slotTemplate={t.inspect.slot}
            onPatchCue={(kind, cueId, patch) => void patchCue(kind, cueId, patch)}
            onRemoveCue={(kind, cueId) => void removeCue(kind, cueId)}
            renderCueLabel={renderCueLabel}
            colorOptions={TRACK_COLOR_OPTIONS}
          />

          <TrackSavedLoopList
            loops={performance.savedLoops}
            canEditPerformance={canEditPerformance}
            sectionLabel={t.inspect.savedLoops}
            emptyLabel={t.inspect.noSavedLoopsStored}
            labelText={t.inspect.label}
            colorText={t.inspect.color}
            slotTemplate={t.inspect.slot}
            loopWord={t.inspect.loopWord}
            lockedLabel={t.inspect.locked}
            editableLabel={t.inspect.editable}
            setStartText={t.inspect.setStart}
            setEndText={t.inspect.setEnd}
            unlockLoopText={t.inspect.unlockLoop}
            lockLoopText={t.inspect.lockLoop}
            removeText={(name) => t.inspect.removeNamed.replace("{name}", name)}
            onSetBoundary={(loopId, boundary) => void setSavedLoopBoundary(loopId, boundary)}
            onPatchLoop={(loopId, patch) => void patchSavedLoop(loopId, patch)}
            onRemoveLoop={(loopId) => void removeSavedLoop(loopId)}
            renderLoopLabel={renderLoopLabel}
            colorOptions={TRACK_COLOR_OPTIONS}
          />
        </div>
      </details>
    </section>
  );
}
