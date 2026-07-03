import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";

export function createGuideTrackLoadPromise(input: {
  requestedPath: string;
  decodeGuideTrack: (path: string) => Promise<GuideTrackPCM>;
  onDecodeSuccess: (pcm: GuideTrackPCM) => void;
  onDecodeFailure: (error: unknown) => void;
}): Promise<void> {
  return input
    .decodeGuideTrack(input.requestedPath)
    .then((pcm) => {
      input.onDecodeSuccess(pcm);
    })
    .catch((error) => {
      input.onDecodeFailure(error);
    });
}
