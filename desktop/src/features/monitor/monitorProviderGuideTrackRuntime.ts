import type { MutableRefObject } from "react";

import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";
import type { SourceTemplate } from "../../config/sourceTemplates";

export interface MonitorProviderGuideTrackLogger {
  info: (message: string, ...args: unknown[]) => void;
}

type SetSourceTemplateState = (template: SourceTemplate) => void;

export function setMonitorActiveTemplateState(input: {
  id: string;
  resolveSourceTemplate: (id: string) => SourceTemplate;
  activeTemplateRef: MutableRefObject<SourceTemplate>;
  setActiveTemplateState: SetSourceTemplateState;
  logger: MonitorProviderGuideTrackLogger;
}): SourceTemplate {
  const resolved = input.resolveSourceTemplate(input.id);
  input.activeTemplateRef.current = resolved;
  input.setActiveTemplateState(resolved);
  input.logger.info("setActiveTemplate id=%s → bpm=%d", input.id, resolved.bpm);
  return resolved;
}

export function seekMonitorGuideTrackState(input: {
  second: number;
  guideTrack: GuideTrackPCM | null;
  guideTrackCursorRef: MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  logger: MonitorProviderGuideTrackLogger;
}): boolean {
  if (!input.guideTrack) {
    return false;
  }

  const targetSample = Math.max(0, Math.floor(input.second * input.guideTrack.sampleRate));
  input.guideTrackCursorRef.current.current = Math.min(
    targetSample,
    input.guideTrack.samples.length - 1,
  );
  input.guideTrackFinishedRef.current = false;
  input.logger.info(
    "guide track seek to %ss (sample %d)",
    input.second.toFixed(2),
    input.guideTrackCursorRef.current.current,
  );
  return true;
}

export function setMonitorGuideTrackState(input: {
  path: string | null;
  guideTrackQueueRef: MutableRefObject<string[]>;
  guideTrackQueueIndexRef: MutableRefObject<number>;
  loadGuideTrackPath: (path: string | null) => void;
}): void {
  input.guideTrackQueueRef.current = input.path ? [input.path] : [];
  input.guideTrackQueueIndexRef.current = 0;
  input.loadGuideTrackPath(input.path);
}

export function setMonitorGuideTrackPlaylistState(input: {
  paths: string[];
  buildGuideTrackQueue: (paths: string[]) => string[];
  guideTrackQueueRef: MutableRefObject<string[]>;
  guideTrackQueueIndexRef: MutableRefObject<number>;
  loadGuideTrackPath: (path: string | null) => void;
}): string[] {
  const queue = input.buildGuideTrackQueue(input.paths);
  input.guideTrackQueueRef.current = queue;
  input.guideTrackQueueIndexRef.current = 0;
  input.loadGuideTrackPath(queue[0] ?? null);
  return queue;
}
