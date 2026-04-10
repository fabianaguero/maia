import { useEffect, useState } from "react";

import type {
  LibraryTrack,
  UpdateTrackAnalysisInput,
} from "../../../types/library";
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

function formatBeatSpacing(value: number | null): string {
  if (value === null) {
    return "Pending";
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
  const canHalveBpm = isEditableBpm(effectiveBpm)
    ? isEditableBpm(effectiveBpm / 2)
    : false;
  const canDoubleBpm = isEditableBpm(effectiveBpm)
    ? isEditableBpm(effectiveBpm * 2)
    : false;

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
    return updateAnalysis(
      createAnchoredBeatGridUpdate(parsedBpm, durationSeconds, anchorSecond),
    );
  };

  const setDownbeatHere = () => {
    if (!isEditableBpm(effectiveBpm)) {
      return;
    }

    return updateAnalysis(
      createAnchoredBeatGridUpdate(effectiveBpm, durationSeconds, currentTime),
    );
  };

  const nudgeGrid = (beatDelta: number) => {
    if (!isEditableBpm(effectiveBpm)) {
      return;
    }

    return updateAnalysis(
      createNudgedBeatGridUpdate(
        beatGrid,
        effectiveBpm,
        beatDelta,
        durationSeconds,
      ),
    );
  };

  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>Beat grid edit</h2>
          <p className="support-copy">
            Manual DJ-style grid correction persisted into track analysis artifacts.
          </p>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>Grid BPM</span>
          <strong>
            {isEditableBpm(track.analysis.bpm) ? track.analysis.bpm.toFixed(2) : "Pending"}
          </strong>
        </div>
        <div>
          <span>Beat markers</span>
          <strong>{beatGrid.length}</strong>
        </div>
        <div>
          <span>Grid anchor</span>
          <strong>{formatTrackTime(hasGrid ? gridAnchorSecond : null)}</strong>
        </div>
        <div>
          <span>Beat spacing</span>
          <strong>{formatBeatSpacing(beatSpacing)}</strong>
        </div>
        <div>
          <span>Playhead</span>
          <strong>{formatTrackTime(currentTime)}</strong>
        </div>
        <div>
          <span>Edit state</span>
          <strong>
            {!canPersist ? "Unavailable" : gridLocked ? "Grid locked" : "Ready"}
          </strong>
        </div>
      </div>

      <div className="top-spaced">
        <p className="support-copy">Grid controls</p>
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
                aria-label="Beat grid BPM"
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
            Apply BPM
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
            Half BPM
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
            Double BPM
          </button>
        </div>

        <div className="pill-strip top-spaced">
          <button
            type="button"
            className="compact-action"
            disabled={!canSetGrid}
            onClick={() => void setDownbeatHere()}
          >
            Set downbeat here
          </button>
          <button
            type="button"
            className="compact-action"
            disabled={!canNudgeGrid}
            onClick={() => void nudgeGrid(-0.25)}
          >
            Nudge -1/4
          </button>
          <button
            type="button"
            className="compact-action"
            disabled={!canNudgeGrid}
            onClick={() => void nudgeGrid(0.25)}
          >
            Nudge +1/4
          </button>
          <button
            type="button"
            className="compact-action"
            disabled={!canNudgeGrid}
            onClick={() => void nudgeGrid(-1)}
          >
            Nudge -1 beat
          </button>
          <button
            type="button"
            className="compact-action"
            disabled={!canNudgeGrid}
            onClick={() => void nudgeGrid(1)}
          >
            Nudge +1 beat
          </button>
        </div>

        {gridLocked ? (
          <p className="support-copy top-spaced">
            Unlock grid in the Performance panel before editing beat markers.
          </p>
        ) : null}
      </div>
    </section>
  );
}
