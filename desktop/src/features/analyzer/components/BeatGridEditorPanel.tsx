import { useEffect, useState } from "react";
import { useT } from "../../../i18n/I18nContext";

import type { LibraryTrack, UpdateTrackAnalysisInput } from "../../../types/library";
import { createBeatGridEditorActions } from "./beatGridEditorPanelActionsRuntime";
import {
  buildBeatGridEditorPanelState,
  formatBpmInputValue,
} from "./beatGridEditorPanelViewRuntime";

interface BeatGridEditorPanelProps {
  track: LibraryTrack;
  busy?: boolean;
  currentTime?: number;
  onUpdateAnalysis?: (input: UpdateTrackAnalysisInput) => Promise<void>;
}

export function BeatGridEditorPanel({
  track,
  busy = false,
  currentTime = 0,
  onUpdateAnalysis,
}: BeatGridEditorPanelProps) {
  const t = useT();
  const [bpmInput, setBpmInput] = useState(() => formatBpmInputValue(track.analysis.bpm));
  const viewState = buildBeatGridEditorPanelState({
    track,
    busy,
    currentTime,
    bpmInput,
    onUpdateAnalysis,
    t,
  });
  const actions = createBeatGridEditorActions({
    track,
    currentTime,
    parsedBpm: viewState.parsedBpm,
    effectiveBpm: viewState.effectiveBpm,
    canPersist: viewState.canPersist,
    onUpdateAnalysis,
  });

  useEffect(() => {
    setBpmInput(formatBpmInputValue(track.analysis.bpm));
  }, [track.id, track.analysis.bpm]);

  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>{t.inspect.beatGridEditTitle}</h2>
          <p className="support-copy">{t.inspect.beatGridEditCopy}</p>
        </div>
      </div>

      <div className="metric-grid">
        {viewState.metrics.map((metric) => (
          <div key={metric.key}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
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
                disabled={!viewState.canEditGrid}
                onChange={(event) => setBpmInput(event.target.value)}
              />
            </label>
          </span>
          <button
            type="button"
            className="compact-action"
            disabled={!viewState.canSetGrid || viewState.parsedBpm === null}
            onClick={() => void actions.applyBpm()}
          >
            {t.inspect.applyBpm}
          </button>
          <button
            type="button"
            className="compact-action"
            disabled={!viewState.canSetGrid || !viewState.canHalveBpm}
            onClick={() => {
              const nextScale = actions.scaleBpm(0.5);
              if (nextScale) {
                setBpmInput(formatBpmInputValue(nextScale.nextBpm));
                void actions.updateAnalysis(nextScale.update);
              }
            }}
          >
            {t.inspect.halfBpm}
          </button>
          <button
            type="button"
            className="compact-action"
            disabled={!viewState.canSetGrid || !viewState.canDoubleBpm}
            onClick={() => {
              const nextScale = actions.scaleBpm(2);
              if (nextScale) {
                setBpmInput(formatBpmInputValue(nextScale.nextBpm));
                void actions.updateAnalysis(nextScale.update);
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
            disabled={!viewState.canSetGrid}
            onClick={() => void actions.setDownbeatHere()}
          >
            {t.inspect.setDownbeatHere}
          </button>
          <button
            type="button"
            className="compact-action"
            disabled={!viewState.canNudgeGrid}
            onClick={() => void actions.nudgeGrid(-0.25)}
          >
            {t.inspect.nudgeQuarterBack}
          </button>
          <button
            type="button"
            className="compact-action"
            disabled={!viewState.canNudgeGrid}
            onClick={() => void actions.nudgeGrid(0.25)}
          >
            {t.inspect.nudgeQuarterForward}
          </button>
          <button
            type="button"
            className="compact-action"
            disabled={!viewState.canNudgeGrid}
            onClick={() => void actions.nudgeGrid(-1)}
          >
            {t.inspect.nudgeBeatBack}
          </button>
          <button
            type="button"
            className="compact-action"
            disabled={!viewState.canNudgeGrid}
            onClick={() => void actions.nudgeGrid(1)}
          >
            {t.inspect.nudgeBeatForward}
          </button>
        </div>

        {viewState.gridLocked ? (
          <p className="support-copy top-spaced">{t.inspect.unlockGridHint}</p>
        ) : null}
      </div>
    </section>
  );
}
