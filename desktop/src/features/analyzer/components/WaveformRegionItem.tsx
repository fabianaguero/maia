import type { CSSProperties, KeyboardEvent, MutableRefObject, MouseEvent } from "react";

import type { BeatGridPoint } from "../../../types/library";

import {
  resolveWaveformRegionNudgeSecond,
  resolveWaveformRegionPointerOffset,
  shouldSuppressWaveformRegionClick,
} from "./waveformRegionOverlayInteractionRuntime";
import type { WaveformRegionOverlayRegionViewModel } from "./waveformRegionOverlayRuntime";

interface WaveformRegionItemProps {
  region: WaveformRegionOverlayRegionViewModel;
  canEditPerformance: boolean;
  durationSeconds: number | null;
  beatGrid: BeatGridPoint[];
  dragMovedRef: MutableRefObject<boolean>;
  dragStartLabel: string;
  dragEndLabel: string;
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
}

export function WaveformRegionItem({
  region,
  canEditPerformance,
  durationSeconds,
  beatGrid,
  dragMovedRef,
  dragStartLabel,
  dragEndLabel,
  onSeek,
  onMoveLoop,
  onMoveLoopBoundary,
  onBeginLoopDrag,
  onBeginLoopBoundaryDrag,
  resolveSecondFromClientX,
}: WaveformRegionItemProps) {
  const handleRegionKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      canEditPerformance &&
      region.editableLoop &&
      (event.key === "ArrowLeft" || event.key === "ArrowRight")
    ) {
      event.preventDefault();
      event.stopPropagation();

      const nextSecond = resolveWaveformRegionNudgeSecond({
        second: region.startSecond,
        direction: event.key === "ArrowLeft" ? -1 : 1,
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
  };

  const handleRegionMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (!canEditPerformance || !region.editableLoop) {
      return;
    }
    const pointerOffsetSecond = resolveWaveformRegionPointerOffset({
      clickedSecond: resolveSecondFromClientX(event.clientX),
      regionStartSecond: region.startSecond,
    });
    event.preventDefault();
    event.stopPropagation();
    onBeginLoopDrag({
      eventClientX: event.clientX,
      loopId: region.id,
      startSecond: region.startSecond,
      endSecond: region.endSecond,
      pointerOffsetSecond,
    });
  };

  const handleBoundaryKeyDown =
    (boundary: "start" | "end") => (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const nextSecond = resolveWaveformRegionNudgeSecond({
        second: boundary === "start" ? region.startSecond : region.endSecond,
        direction: event.key === "ArrowLeft" ? -1 : 1,
        durationSeconds,
        beatGrid,
        coarse: event.shiftKey,
        freeSlip: event.altKey,
      });

      onMoveLoopBoundary?.(region.id, boundary, nextSecond);
    };

  const handleBoundaryMouseDown =
    (boundary: "start" | "end", second: number) => (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onBeginLoopBoundaryDrag({
        eventClientX: event.clientX,
        loopId: region.id,
        boundary,
        second,
      });
    };

  return (
    <div
      className={`waveform-region waveform-region--${region.type}`}
      style={
        {
          "--region-start": `${region.startPosition}%`,
          "--region-width": `${region.widthPercent}%`,
          "--region-color": region.color,
        } as CSSProperties
      }
      title={region.title}
      role="button"
      tabIndex={region.tabIndex}
      aria-label={region.ariaLabel}
      aria-disabled={region.ariaDisabled}
      onClick={(event) => {
        event.stopPropagation();
        if (shouldSuppressWaveformRegionClick(dragMovedRef.current)) {
          dragMovedRef.current = false;
          return;
        }
        onSeek?.(region.startSecond);
      }}
      onKeyDown={handleRegionKeyDown}
      onMouseDown={handleRegionMouseDown}
    >
      <span className="waveform-region-label">{region.label}</span>
      {canEditPerformance && region.editableLoop ? (
        <>
          <button
            type="button"
            className="waveform-region-handle waveform-region-handle--start"
            aria-label={dragStartLabel}
            onKeyDown={handleBoundaryKeyDown("start")}
            onMouseDown={handleBoundaryMouseDown("start", region.startSecond)}
          />
          <button
            type="button"
            className="waveform-region-handle waveform-region-handle--end"
            aria-label={dragEndLabel}
            onKeyDown={handleBoundaryKeyDown("end")}
            onMouseDown={handleBoundaryMouseDown("end", region.endSecond)}
          />
        </>
      ) : null}
    </div>
  );
}
