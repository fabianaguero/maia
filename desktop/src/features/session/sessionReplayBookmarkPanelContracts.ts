import type { ComponentProps } from "react";

import type { ReplayFeedbackSummaryCard } from "../../components/ReplayFeedbackSummaryCard";
import type { SessionReplayBookmarkCard } from "./SessionReplayBookmarkCard";

export interface SessionReplayBookmarkPanelHeaderState {
  title: string;
  summary: string;
}

export interface SessionReplayBookmarkMetaState {
  windowLabel: string;
  note: string;
  tags: string[];
}

export interface SessionReplayBookmarkContextState {
  bpmLabel: string;
  dominantLevelLabel: string;
  anomalyLabel: string;
  excerpt: string;
}

export interface SessionReplayBookmarkPanelSections {
  header: SessionReplayBookmarkPanelHeaderState;
  replayDisabled: boolean;
  recommendationProps: ComponentProps<typeof ReplayFeedbackSummaryCard> | null;
  bookmarkCardPropsList: Array<ComponentProps<typeof SessionReplayBookmarkCard>>;
  emptyLabel: string;
}
