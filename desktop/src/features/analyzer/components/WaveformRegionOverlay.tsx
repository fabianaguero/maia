import type { CSSProperties, MutableRefObject } from "react";

import { useT } from "../../../i18n/I18nContext";
import type { BeatGridPoint } from "../../../types/library";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import { nudgeTrackSecond } from "../../../utils/track";
import type { RenderedRegion } from "./waveformPlaceholderRuntime";

interface WaveformRegionOverlayProps {
  renderedRegions: RenderedRegion[];
  selectedPhraseRange: BeatGridPhraseRange | null;
  durationSeconds: number | null;
  canEditPerformance: boolean;
  beatGrid: BeatGridPoint[];
  onSeek?: (second: number) => void;
  onMoveLoop?: (loopId: string, startSecond: number) => void;
  onMoveLoopBoundary?: (loopId: string, boundary: "start" | "end", second: number) => void;
  onBeginLoopDrag: (input: {
    eventClientX: number;
    loopId: string;
    startSecond: number;
    endSecond: number;
    pointerOffsetSecond: number;
  }) => void;
  onBeginLoopBoundaryDrag: (input: {
    eventClientX: number;
    loopId: string;
    boundary: "start" | "end";
    second: number;
  }) => void;
  resolveSecondFromClientX: (clientX: number) => number | null;
  dragMovedRef: MutableRefObject<boolean>;
}

export function WaveformRegionOverlay({
  renderedRegions,
  selectedPhraseRange,
  durationSeconds,
  canEditPerformance,
  beatGrid,
  onSeek,
  onMoveLoop,
  onMoveLoopBoundary,
  onBeginLoopDrag,
  onBeginLoopBoundaryDrag,
  resolveSecondFromClientX,
  dragMovedRef,
}: WaveformRegionOverlayProps) {
  const t = useT();

  return (
    <div className="waveform-region-overlay" aria-label={t.inspect.loopPhraseRegions}>
      {renderedRegions.map((region) => {
        const startPosition =
          durationSeconds && durationSeconds > 0
            ? Math.min(100, (region.startSecond / durationSeconds) * 100)
            : 0;
        const endPosition =
          durationSeconds && durationSeconds > 0
            ? Math.min(100, (region.endSecond / durationSeconds) * 100)
            : startPosition;

        return (
          <div
            key={region.id}
            className={`waveform-region waveform-region--${region.type}`}
            style={
              {
                "--region-start": `${startPosition}%`,
                "--region-width": `${Math.max(0.8, endPosition - startPosition)}%`,
                "--region-color": region.color ?? "rgba(72, 215, 255, 0.28)",
              } as CSSProperties
            }
            title={region.excerpt ? `${region.label} · ${region.excerpt}` : region.label}
            role="button"
            tabIndex={onSeek || (canEditPerformance && region.editableLoop) ? 0 : -1}
            aria-label={t.inspect.seekTo.replace("{label}", region.label)}
            aria-disabled={!onSeek}
            onClick={(event) => {
              event.stopPropagation();
              if (dragMovedRef.current) {
                dragMovedRef.current = false;
                return;
              }
              onSeek?.(region.startSecond);
            }}
            onKeyDown={(event) => {
              if (
                canEditPerformance &&
                region.editableLoop &&
                (event.key === "ArrowLeft" || event.key === "ArrowRight")
              ) {
                event.preventDefault();
                event.stopPropagation();

                const direction = event.key === "ArrowLeft" ? -1 : 1;
                const nextSecond = nudgeTrackSecond(region.startSecond, direction, {
                  durationSeconds,
                  beatGrid,
                  coarse: event.shiftKey,
                  freeSlip: event.altKey,
                });

                onMoveLoop?.(region.id, nextSecond);
                return;
              }

              if (!onSeek) {
                return;
              }
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onSeek(region.startSecond);
              }
            }}
            onMouseDown={(event) => {
              if (!canEditPerformance || !region.editableLoop) {
                return;
              }
              const clickedSecond = resolveSecondFromClientX(event.clientX);
              const pointerOffsetSecond =
                clickedSecond === null ? 0 : clickedSecond - region.startSecond;
              event.preventDefault();
              event.stopPropagation();
              onBeginLoopDrag({
                eventClientX: event.clientX,
                loopId: region.id,
                startSecond: region.startSecond,
                endSecond: region.endSecond,
                pointerOffsetSecond,
              });
            }}
          >
            <span className="waveform-region-label">{region.label}</span>
            {canEditPerformance && region.editableLoop ? (
              <>
                <button
                  type="button"
                  className="waveform-region-handle waveform-region-handle--start"
                  aria-label={t.inspect.dragStartOf.replace("{label}", region.label)}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                      return;
                    }

                    event.preventDefault();
                    event.stopPropagation();

                    const direction = event.key === "ArrowLeft" ? -1 : 1;
                    const nextSecond = nudgeTrackSecond(region.startSecond, direction, {
                      durationSeconds,
                      beatGrid,
                      coarse: event.shiftKey,
                      freeSlip: event.altKey,
                    });

                    onMoveLoopBoundary?.(region.id, "start", nextSecond);
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onBeginLoopBoundaryDrag({
                      eventClientX: event.clientX,
                      loopId: region.id,
                      boundary: "start",
                      second: region.startSecond,
                    });
                  }}
                />
                <button
                  type="button"
                  className="waveform-region-handle waveform-region-handle--end"
                  aria-label={t.inspect.dragEndOf.replace("{label}", region.label)}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                      return;
                    }

                    event.preventDefault();
                    event.stopPropagation();

                    const direction = event.key === "ArrowLeft" ? -1 : 1;
                    const nextSecond = nudgeTrackSecond(region.endSecond, direction, {
                      durationSeconds,
                      beatGrid,
                      coarse: event.shiftKey,
                      freeSlip: event.altKey,
                    });

                    onMoveLoopBoundary?.(region.id, "end", nextSecond);
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onBeginLoopBoundaryDrag({
                      eventClientX: event.clientX,
                      loopId: region.id,
                      boundary: "end",
                      second: region.endSecond,
                    });
                  }}
                />
              </>
            ) : null}
          </div>
        );
      })}

      {selectedPhraseRange && durationSeconds && durationSeconds > 0 ? (
        <div
          className="waveform-region waveform-region--phrase waveform-region--selected"
          style={
            {
              "--region-start": `${Math.min(100, (selectedPhraseRange.startSecond / durationSeconds) * 100)}%`,
              "--region-width": `${Math.max(
                0.8,
                ((selectedPhraseRange.endSecond - selectedPhraseRange.startSecond) /
                  durationSeconds) *
                  100,
              )}%`,
              "--region-color": "rgba(244, 184, 94, 0.28)",
            } as CSSProperties
          }
          title={`${selectedPhraseRange.label} · ${selectedPhraseRange.beatCount} beats`}
          role="button"
          tabIndex={onSeek ? 0 : -1}
          aria-label={t.inspect.seekTo.replace("{label}", selectedPhraseRange.label)}
          aria-disabled={!onSeek}
          onClick={(event) => {
            event.stopPropagation();
            onSeek?.(selectedPhraseRange.startSecond);
          }}
          onKeyDown={(event) => {
            if (!onSeek) {
              return;
            }
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              onSeek(selectedPhraseRange.startSecond);
            }
          }}
        >
          <span className="waveform-region-label">{selectedPhraseRange.label}</span>
        </div>
      ) : null}
    </div>
  );
}
