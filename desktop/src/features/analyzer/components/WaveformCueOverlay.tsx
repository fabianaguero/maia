import type { CSSProperties } from "react";

import { useT } from "../../../i18n/I18nContext";
import type { BeatGridPoint } from "../../../types/library";
import type {
  DragTarget,
  RenderedCueMarker,
  WaveformEditableCuePoint,
} from "./waveformPlaceholderRuntime";
import {
  buildWaveformCueOverlayMarkers,
  resolveWaveformCueOverlayNudgeSecond,
} from "./waveformCueOverlayRuntime";

interface WaveformCueOverlayProps {
  renderedCueMarkers: RenderedCueMarker[];
  dragTarget: DragTarget | null;
  durationSeconds: number | null;
  canEditPerformance: boolean;
  beatGrid: BeatGridPoint[];
  onSeek?: (second: number) => void;
  onNudgeCue?: (cue: WaveformEditableCuePoint, second: number) => void;
  onBeginCueDrag: (input: {
    eventClientX: number;
    cue: WaveformEditableCuePoint;
    second: number;
  }) => void;
  consumeDraggedClick: () => boolean;
}

export function WaveformCueOverlay({
  renderedCueMarkers,
  dragTarget,
  durationSeconds,
  canEditPerformance,
  beatGrid,
  onSeek,
  onNudgeCue,
  onBeginCueDrag,
  consumeDraggedClick,
}: WaveformCueOverlayProps) {
  const t = useT();
  const markers = buildWaveformCueOverlayMarkers({
    renderedCueMarkers,
    dragTarget,
    durationSeconds,
    onSeek,
    t,
  });

  return (
    <div className="hot-cue-overlay" aria-label={t.inspect.anomalyMarkersAria}>
      {markers.map((cue) => {
        return (
          <button
            key={cue.key}
            type="button"
            className={`hot-cue-marker ${cue.typeClassName}${cue.dragging ? " is-dragging" : ""}`}
            style={{ "--cue-position": `${cue.position}%` } as CSSProperties}
            title={cue.title}
            aria-label={cue.ariaLabel}
            disabled={cue.disabled}
            onMouseDown={(event) => {
              if (!canEditPerformance || !cue.interactiveCue) {
                return;
              }
              event.preventDefault();
              event.stopPropagation();
              onBeginCueDrag({
                eventClientX: event.clientX,
                cue: cue.interactiveCue,
                second: cue.second,
              });
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (consumeDraggedClick()) {
                return;
              }
              onSeek?.(cue.second);
            }}
            onKeyDown={(event) => {
              if (!canEditPerformance || !cue.interactiveCue) {
                return;
              }

              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                return;
              }

              event.preventDefault();
              event.stopPropagation();

              const direction = event.key === "ArrowLeft" ? -1 : 1;
              const nextSecond = resolveWaveformCueOverlayNudgeSecond({
                cueSecond: cue.second,
                direction,
                durationSeconds,
                beatGrid,
                coarse: event.shiftKey,
                freeSlip: event.altKey,
              });

              onNudgeCue?.(cue.interactiveCue, nextSecond);
            }}
          >
            <span className="hot-cue-label">{cue.label}</span>
          </button>
        );
      })}
    </div>
  );
}
