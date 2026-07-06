import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";

export type GuideTrackLoadSuccessOutcome =
  | {
      kind: "superseded";
      requestedPath: string;
      currentPath: string | null;
    }
  | {
      kind: "ready";
      durationLabel: string;
      sampleCount: number;
    };

export type GuideTrackLoadFailureOutcome =
  | { kind: "ignored" }
  | {
      kind: "failed";
      message: string;
    };

export function resolveGuideTrackLoadSuccessOutcome(input: {
  accepted: boolean;
  requestedPath: string;
  currentPath: string | null;
  pcm: GuideTrackPCM;
}): GuideTrackLoadSuccessOutcome {
  if (!input.accepted) {
    return {
      kind: "superseded",
      requestedPath: input.requestedPath,
      currentPath: input.currentPath,
    };
  }

  return {
    kind: "ready",
    durationLabel: input.pcm.durationSec.toFixed(2),
    sampleCount: input.pcm.samples.length,
  };
}

export function resolveGuideTrackLoadFailureOutcome(input: {
  rejected: boolean;
  error: unknown;
}): GuideTrackLoadFailureOutcome {
  if (!input.rejected) {
    return { kind: "ignored" };
  }

  return {
    kind: "failed",
    message: input.error instanceof Error ? input.error.message : String(input.error),
  };
}
