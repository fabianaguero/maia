import type { SourceTemplate } from "../../config/sourceTemplates";
import type { MonitorProviderStateViewModel } from "./monitorProviderControllerStateTypes";
import type {
  MonitorProviderGuideTrackLogger,
  UseMonitorProviderGuideTrackInput,
} from "./monitorProviderGuideTrackTypes";

export function buildMonitorProviderGuideTrackInput(input: {
  state: MonitorProviderStateViewModel;
  resolveSourceTemplate: (id: string) => SourceTemplate;
  decodedAudioCache: UseMonitorProviderGuideTrackInput["decodedAudioCache"];
  logger: MonitorProviderGuideTrackLogger;
}): UseMonitorProviderGuideTrackInput {
  return {
    resolveSourceTemplate: input.resolveSourceTemplate,
    decodedAudioCache: input.decodedAudioCache,
    logger: input.logger,
    audioContextRef: input.state.audioContextRef,
    currentSegmentRef: input.state.currentSegmentRef,
    guideTrackPathRef: input.state.guideTrackPathRef,
    guideTrackQueueRef: input.state.guideTrackQueueRef,
    guideTrackQueueIndexRef: input.state.guideTrackQueueIndexRef,
    guideTrackRef: input.state.guideTrackRef,
    guideTrackCursorRef: input.state.guideTrackCursorRef,
    guideTrackFinishedRef: input.state.guideTrackFinishedRef,
    guideTrackLoadPromiseRef: input.state.guideTrackLoadPromiseRef,
    activeTemplateRef: input.state.activeTemplateRef,
    setGuideTrackReady: input.state.setGuideTrackReady,
    setGuideTrackPathState: input.state.setGuideTrackPathState,
    setGuideTrackDurationSec: input.state.setGuideTrackDurationSec,
    setActiveTemplateState: input.state.setActiveTemplateState,
  };
}
