import { formatAnomalyCueCode } from "./monitorDisplay";

export interface MonitorDeckFocusBarState {
  badgeClassName: string;
  containerClassName: string;
  cueLabel: string;
  shouldRender: boolean;
}

export function buildMonitorDeckFocusBarState(input: {
  focusBadgeLabel: string | null;
  focusBadgeTone: "warning" | "critical" | null;
  focusTimestamp: string | null;
  focusMessage: string | null;
  focusCueCode: string | null;
}): MonitorDeckFocusBarState {
  const tone = input.focusBadgeTone === "critical" ? "critical" : "warning";

  return {
    shouldRender: Boolean(input.focusBadgeLabel && input.focusTimestamp && input.focusMessage),
    containerClassName: `monitor-deck-focusbar ${tone}`,
    badgeClassName: `monitor-deck-focusbar__badge ${tone}`,
    cueLabel: formatAnomalyCueCode(input.focusCueCode),
  };
}
