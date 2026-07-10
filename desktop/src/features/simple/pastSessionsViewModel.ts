import type { PersistedSession } from "../../api/sessions";
import type { AppTranslations } from "../../i18n/types";
import type { LibraryTrack } from "../../types/library";
import { resolveSessionStatusLabel } from "../../utils/monitorLabels";
import { getBasename, truncateMiddle } from "./monitorDisplay";
import {
  formatSessionLineCount,
  formatSessionUpdatedAt,
  sortMonitorSessions,
} from "./monitorSessions";

export interface PastSessionRowViewModel {
  id: string;
  name: string;
  trackLabel: string;
  status: PersistedSession["status"];
  statusLabel: string;
  sourcePathLabel: string;
  sourceBasenameLabel: string;
  updatedAtLabel: string;
  totalAnomalies: number;
  lineCountLabel: string;
  replaySourcePath: string;
  replaySourceTitle: string;
  replayTrackId: string | null;
  isTrackAvailable: boolean;
  isSourceAvailable: boolean;
  validationPending: boolean;
  invalidReason: PastSessionInvalidReason | null;
  invalidReasonLabel: string | null;
}

export interface PastSessionsViewModel {
  title: string;
  emptyStateLabel: string;
  rows: PastSessionRowViewModel[];
}

export type PastSessionInvalidReason = "missing-source" | "missing-log" | "missing-track";

function resolvePastSessionInvalidReason(input: {
  hasSourcePath: boolean;
  sourceExists: boolean;
  isTrackAvailable: boolean;
}): PastSessionInvalidReason | null {
  if (!input.hasSourcePath) {
    return "missing-source";
  }

  if (!input.sourceExists) {
    return "missing-log";
  }

  if (!input.isTrackAvailable) {
    return "missing-track";
  }

  return null;
}

function resolvePastSessionInvalidReasonLabel(
  reason: PastSessionInvalidReason | null,
  t: AppTranslations,
): string | null {
  if (reason === "missing-source") {
    return t.library.pastSessionMissingSource;
  }

  if (reason === "missing-log") {
    return t.library.pastSessionMissingLog;
  }

  if (reason === "missing-track") {
    return t.library.pastSessionMissingTrack;
  }

  return null;
}

export function buildPastSessionsViewModel(input: {
  t: AppTranslations;
  sessions: PersistedSession[];
  tracks?: LibraryTrack[];
  sourceExistsByPath?: Record<string, boolean>;
  trackExistsById?: Record<string, boolean>;
  maxVisible?: number;
}): PastSessionsViewModel {
  const sortedSessions = sortMonitorSessions(input.sessions).slice(0, input.maxVisible ?? 5);
  const tracks = input.tracks ?? [];

  return {
    title: input.t.simpleMode.setup.pastSessions,
    emptyStateLabel: input.t.simpleMode.setup.noPreviousSessions,
    rows: sortedSessions.map((session) => {
      const track = session.trackId ? tracks.find((item) => item.id === session.trackId) : null;
      const hasSourcePath = Boolean(session.sourcePath);
      const requiresLocalSourceCheck = Boolean(
        session.sourcePath && !session.sourcePath.includes("://"),
      );
      const sourceValidationPending =
        requiresLocalSourceCheck &&
        input.sourceExistsByPath?.[session.sourcePath ?? ""] === undefined;
      const sourceExists =
        !session.sourcePath ||
        input.sourceExistsByPath?.[session.sourcePath] === undefined ||
        input.sourceExistsByPath[session.sourcePath];
      const trackValidationPending =
        track !== null &&
        track !== undefined &&
        track.file.availabilityState !== "missing" &&
        input.trackExistsById?.[track.id] === undefined;
      const trackExists =
        !track ||
        input.trackExistsById?.[track.id] === undefined ||
        input.trackExistsById[track.id];
      const isTrackAvailable =
        Boolean(track) && track?.file.availabilityState !== "missing" && trackExists;
      const validationPending = sourceValidationPending || trackValidationPending;
      const invalidReason = resolvePastSessionInvalidReason({
        hasSourcePath,
        sourceExists,
        isTrackAvailable,
      });
      const invalidReasonLabel = resolvePastSessionInvalidReasonLabel(invalidReason, input.t);

      return {
        id: session.id,
        name: session.label || session.sourceTitle || input.t.simpleMode.common.untitledSession,
        trackLabel: session.trackTitle || input.t.simpleMode.common.noTrack,
        status: session.status,
        statusLabel: resolveSessionStatusLabel(session.status, input.t),
        sourcePathLabel: truncateMiddle(session.sourcePath, 74),
        sourceBasenameLabel: getBasename(session.sourcePath),
        updatedAtLabel: `${input.t.simpleMode.common.updated} ${formatSessionUpdatedAt(session.updatedAt, input.t.locale, input.t.simpleMode.common.justNow)}`,
        totalAnomalies: session.totalAnomalies,
        lineCountLabel: formatSessionLineCount(
          session.totalLines,
          input.t.simpleMode.common.line,
          input.t.simpleMode.common.lines,
        ),
        replaySourcePath: session.sourcePath || "",
        replaySourceTitle: session.sourceTitle || input.t.simpleMode.common.untitledSession,
        replayTrackId: session.trackId,
        isTrackAvailable,
        isSourceAvailable: sourceExists,
        validationPending,
        invalidReason,
        invalidReasonLabel,
      };
    }),
  };
}
