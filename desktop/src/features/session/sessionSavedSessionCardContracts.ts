import type { ComponentProps } from "react";

import type { SessionSavedSessionCardActions } from "./SessionSavedSessionCardActions";
import type { SessionSavedSessionCardHeader } from "./SessionSavedSessionCardHeader";
import type { SessionSavedSessionCardMetrics } from "./SessionSavedSessionCardMetrics";

export interface SessionSavedSessionCardMetricsState {
  pollsValue: number;
  linesValue: number;
  anomaliesValue: number;
  bpmLabel: string;
  templateLabel: string;
}

export interface SessionSavedSessionCardMetaState {
  title: string;
  sourceLabel: string;
  baseLabel: string | null;
  bookmarksLabel: string | null;
  updatedAtLabel: string;
}

export interface SessionSavedSessionCardActionsState {
  showPlaybackAction: boolean;
  showResumeAction: boolean;
  deleteDisabled: boolean;
}

export interface SessionSavedSessionCardSections {
  statusTone: string;
  updatedAtLabel: string;
  headerProps: ComponentProps<typeof SessionSavedSessionCardHeader>;
  metricsProps: ComponentProps<typeof SessionSavedSessionCardMetrics>;
  actionsProps: ComponentProps<typeof SessionSavedSessionCardActions>;
}
