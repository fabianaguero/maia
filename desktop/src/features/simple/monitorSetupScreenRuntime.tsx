import { Activity, AlertTriangle, RadioTower, SlidersHorizontal, Waves } from "lucide-react";
import type { ReactNode } from "react";

import type {
  MonitorSetupCardViewModel,
  MonitorSetupOptionViewModel,
  MonitorSetupScreenViewModel,
} from "./monitorSetupViewModel";

export type MonitorSetupSelectablePresetId = "passive" | "balanced" | "alert";

export interface MonitorSetupScreenModel {
  presetCards: Array<MonitorSetupOptionViewModel<MonitorSetupSelectablePresetId>>;
  customPresetCard: MonitorSetupOptionViewModel<"custom"> | null;
  setupIcons: Record<MonitorSetupCardViewModel["key"], ReactNode>;
}

export function buildMonitorSetupScreenModel(
  viewModel: MonitorSetupScreenViewModel,
): MonitorSetupScreenModel {
  return {
    presetCards: viewModel.presetCards.filter(
      (
        preset,
      ): preset is MonitorSetupOptionViewModel<MonitorSetupSelectablePresetId> =>
        preset.id !== "custom",
    ),
    customPresetCard:
      viewModel.presetCards.find(
        (preset): preset is MonitorSetupOptionViewModel<"custom"> => preset.id === "custom",
      ) ?? null,
    setupIcons: {
      "reactive-mix": <Activity size={16} />,
      "anomaly-emphasis": <AlertTriangle size={16} />,
      "idle-motion": <Waves size={16} />,
      "monitor-level": <SlidersHorizontal size={16} />,
      "ducking-intensity": <RadioTower size={16} />,
      "recovery-release": <Waves size={16} />,
      "alert-shape": <RadioTower size={16} />,
    },
  };
}
