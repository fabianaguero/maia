import type { AppTranslations } from "../../i18n/types";
import type { DeckSelectedMarker } from "./monitorDeckViewModel";
import type { ActiveMonitorDeckViewModel } from "./activeMonitorDeckViewModelTypes";

export function buildActiveMonitorFocusState(input: {
  t: AppTranslations;
  selectedDeckMarker: DeckSelectedMarker | null;
  selectedBurstCount?: number | null;
}): Pick<
  ActiveMonitorDeckViewModel,
  | "focusBadgeLabel"
  | "focusBadgeTone"
  | "focusTimestamp"
  | "focusMessage"
  | "focusCueCode"
  | "focusBurstLabel"
> {
  const isCritical = (input.selectedDeckMarker?.severity ?? 0) >= 0.9;

  return {
    focusBadgeLabel: input.selectedDeckMarker
      ? isCritical
        ? input.t.simpleMode.monitor.activeAnomaly
        : input.t.simpleMode.monitor.activeWarning
      : null,
    focusBadgeTone: input.selectedDeckMarker ? (isCritical ? "critical" : "warning") : null,
    focusTimestamp: input.selectedDeckMarker?.timestamp ?? null,
    focusMessage: input.selectedDeckMarker?.message ?? null,
    focusCueCode: input.selectedDeckMarker?.id ?? null,
    focusBurstLabel:
      input.selectedDeckMarker && input.selectedBurstCount
        ? `${input.t.simpleMode.monitor.burst} ${input.selectedBurstCount}`
        : null,
  };
}
