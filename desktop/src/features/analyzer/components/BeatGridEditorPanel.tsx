import { useEffect, useState } from "react";
import { useT } from "../../../i18n/I18nContext";

import type { LibraryTrack, UpdateTrackAnalysisInput } from "../../../types/library";
import {
  createAnchoredBeatGridUpdate,
  createNudgedBeatGridUpdate,
  isEditableBpm,
  resolveBeatDurationSeconds,
  resolveBeatGridAnchorSecond,
} from "../../../utils/beatGrid";
import { formatTrackTime } from "../../../utils/track";

interface BeatGridEditorPanelProps {
  track: LibraryTrack;
  busy?: boolean;
  currentTime?: number;
  onUpdateAnalysis?: (input: UpdateTrackAnalysisInput) => Promise<void>;
}

function formatBeatSpacing(value: number | null, pendingLabel: string): string {
  if (value === null) {
    return pendingLabel;
  }

  return `${value.toFixed(3)}s`;
}

function formatBpmInputValue(value: number | null): string {
  if (!isEditableBpm(value)) {
    return "";
  }

  return Number(value.toFixed(3)).toString();
}

function parseEditableBpm(value: string): number | null {
  const parsed = Number(value.trim());
  return isEditableBpm(parsed) ? parsed : null;
}

export function BeatGridEditorPanel({
  track,
  busy = false,
  currentTime = 0,
  onUpdateAnalysis,
}: BeatGridEditorPanelProps) {
  const t = useT();
  const [bpmInput, setBpmInput] = useState(() => formatBpmInputValue(track.analysis.bpm));
  const durationSeconds = track.analysis.durationSeconds;
  const beatGrid = track.analysis.beatGrid;
  const parsedBpm = parseEditableBpm(bpmInput);
  const effectiveBpm = parsedBpm ?? track.analysis.bpm;
  const beatSpacing = resolveBeatDurationSeconds(track.analysis.bpm, beatGrid);
  const gridAnchorSecond = resolveBeatGridAnchorSecond(beatGrid, 0);
  const canPersist = !busy && !!onUpdateAnalysis;
  const gridLocked = track.performance.gridLock;
  const canEditGrid = canPersist && !gridLocked;
  const hasGrid = beatGrid.length > 0;
  const canSetGrid = canEditGrid && isEditableBpm(effectiveBpm) && durationSeconds !== null;
  const canNudgeGrid = canSetGrid && hasGrid;
  const canHalveBpm = isEditableBpm(effectiveBpm) ? isEditableBpm(effectiveBpm / 2) : false;
  const canDoubleBpm = isEditableBpm(effectiveBpm) ? isEditableBpm(effectiveBpm * 2) : false;

  useEffect(() => {
    setBpmInput(formatBpmInputValue(track.analysis.bpm));
  }, [track.id, track.analysis.bpm]);

  const updateAnalysis = (input: UpdateTrackAnalysisInput) => {
    if (!canPersist) {
      return;
    }

    return onUpdateAnalysis(input);
  };

  const applyBpm = () => {
    if (!isEditableBpm(parsedBpm)) {
      return;
    }

    const anchorSecond = resolveBeatGridAnchorSecond(beatGrid, currentTime);
    return updateAnalysis(createAnchoredBeatGridUpdate(parsedBpm, durationSeconds, anchorSecond));
  };

  const setDownbeatHere = () => {
    if (!isEditableBpm(effectiveBpm)) {
      return;
    }

    return updateAnalysis(createAnchoredBeatGridUpdate(effectiveBpm, durationSeconds, currentTime));
  };

  const nudgeGrid = (beatDelta: number) => {
    if (!isEditableBpm(effectiveBpm)) {
      return;
    }

    return updateAnalysis(
      createNudgedBeatGridUpdate(beatGrid, effectiveBpm, beatDelta, durationSeconds),
    );
  };

  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>{t.inspect.beatGridEditTitle}</h2>
          <p className="support-copy">{t.inspect.beatGridEditCopy}</p>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>{t.inspect.gridBpm}</span>
          <strong>
            {isEditableBpm(track.analysis.bpm) ? track.analysis.bpm.toFixed(2) : t.inspect.pending}
          </strong>
        </div>
        <div>
          <span>{t.inspect.beatMarkers}</span>
          <strong>{beatGrid.length}</strong>
        </div>
        <div>
          <span>{t.inspect.gridAnchor}</span>
          <strong>{formatTrackTime(hasGrid ? gridAnchorSecond : null)}</strong>
        </div>
        <div>
          <span>{t.inspect.beatSpacing}</span>
          <strong>{formatBeatSpacing(beatSpacing, t.inspect.pending)}</strong>
        </div>
        <div>
          <span>{t.inspect.playhead}</span>
          <strong>{formatTrackTime(currentTime)}</strong>
        </div>
        <div>
          <span>{t.inspect.editState}</span>
          <strong>
            {!canPersist
              ? t.inspect.unavailable
              : gridLocked
                ? t.inspect.gridLockedState
                : t.inspect.ready}
          </strong>
        </div>
      </div>

      <div className="top-spaced">
        <p className="support-copy">{t.inspect.gridControls}</p>
        <div className="pill-strip top-spaced">
          <span>
            <label>
              BPM
              <input
                type="number"
                step="0.01"
                min="40"
                max="240"
                className="compact-input"
                aria-label={t.inspect.gridBpm}
                value={bpmInput}
                disabled={!canEditGrid}
                onChange={(event) => setBpmInput(event.target.value)}
              />
            </label>
          </span>
          <button
            type="button"
            className="compact-action"
            disabled={!canSetGrid || !isEditableBpm(parsedBpm)}
            onClick={() => void applyBpm()}
          >
            {t.inspect.applyBpm}
          </button>
          <button
            type="button"
            className="compact-action"
            disabled={!canSetGrid || !canHalveBpm}
            onClick={() => {
              if (isEditableBpm(effectiveBpm) && isEditableBpm(effectiveBpm / 2)) {
                setBpmInput(formatBpmInputValue(effectiveBpm / 2));
                void updateAnalysis(
                  createAnchoredBeatGridUpdate(
                    effectiveBpm / 2,
                    durationSeconds,
                    resolveBeatGridAnchorSecond(beatGrid, currentTime),
                  ),
                );
              }
            }}
          >
            {t.inspect.halfBpm}
          </button>
          <button
            type="button"
            className="compact-action"
            disabled={!canSetGrid || !canDoubleBpm}
            onClick={() => {
              if (isEditableBpm(effectiveBpm) && isEditableBpm(effectiveBpm * 2)) {
                setBpmInput(formatBpmInputValue(effectiveBpm * 2));
                void updateAnalysis(
                  createAnchoredBeatGridUpdate(
                    effectiveBpm * 2,
                    durationSeconds,
                    resolveBeatGridAnchorSecond(beatGrid, currentTime),
                  ),
                );
              }
            }}
          >
            {t.inspect.doubleBpm}
          </button>
        </div>

        <div className="pill-strip top-spaced">
          <button
            type="button"
            className="compact-action"
            disabled={!canSetGrid}
            onClick={() => void setDownbeatHere()}
          >
            {t.inspect.setDownbeatHere}
          </button>
          <button
            type="button"
            className="compact-action"
            disabled={!canNudgeGrid}
            onClick={() => void nudgeGrid(-0.25)}
          >
            {t.inspect.nudgeQuarterBack}
          </button>
          <button
            type="button"
            className="compact-action"
            disabled={!canNudgeGrid}
            onClick={() => void nudgeGrid(0.25)}
          >
            {t.inspect.nudgeQuarterForward}
          </button>
          <button
            type="button"
            className="compact-action"
            disabled={!canNudgeGrid}
            onClick={() => void nudgeGrid(-1)}
          >
            {t.inspect.nudgeBeatBack}
          </button>
          <button
            type="button"
            className="compact-action"
            disabled={!canNudgeGrid}
            onClick={() => void nudgeGrid(1)}
          >
            {t.inspect.nudgeBeatForward}
          </button>
        </div>

        {gridLocked ? <p className="support-copy top-spaced">{t.inspect.unlockGridHint}</p> : null}
      </div>
    </section>
  );
}
