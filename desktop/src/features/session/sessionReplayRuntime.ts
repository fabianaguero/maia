import type { PersistedSession } from "../../api/sessions";

import type { SessionScreenCopy } from "./sessionStartPlanTypes";

export function resolveReplaySessionError(
  session: PersistedSession | null,
  copy: SessionScreenCopy,
): string | null {
  if (!session?.sourcePath) {
    return copy.session.noStoredSourceReplay;
  }

  return null;
}

export function resolveReplayBookmarkError(
  success: boolean,
  copy: SessionScreenCopy,
): string | null {
  return success ? null : copy.session.failedReplayJump;
}

export function resolveReplaySessionFailure(
  success: boolean,
  copy: SessionScreenCopy,
): string | null {
  return success ? null : copy.session.failedReplay;
}
