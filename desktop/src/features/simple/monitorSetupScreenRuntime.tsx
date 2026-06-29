import { Activity, AlertTriangle, RadioTower, SlidersHorizontal, Waves } from "lucide-react";
import type { ReactNode } from "react";

import type { AppTranslations } from "../../i18n/en";
import type {
  MonitorSetupCardViewModel,
  MonitorSetupOptionViewModel,
  MonitorSetupSignalViewModel,
  MonitorSetupScreenViewModel,
} from "./monitorSetupViewModel";

export type MonitorSetupSelectablePresetId = "passive" | "balanced" | "alert";

export interface MonitorSetupSignalBankSectionViewModel {
  key: "signal-chain" | "transport";
  kicker: string;
  title: string;
  hint: string;
  description: string;
  cards: MonitorSetupSignalViewModel[];
  role?: "list";
}

export interface MonitorSetupScreenModel {
  presetCards: Array<MonitorSetupOptionViewModel<MonitorSetupSelectablePresetId>>;
  customPresetCard: MonitorSetupOptionViewModel<"custom"> | null;
  signalBanks: MonitorSetupSignalBankSectionViewModel[];
  setupIcons: Record<MonitorSetupCardViewModel["key"], ReactNode>;
}

export function buildMonitorSetupScreenModel(input: {
  t: AppTranslations;
  viewModel: MonitorSetupScreenViewModel;
}): MonitorSetupScreenModel {
  return {
    presetCards: input.viewModel.presetCards.filter(
      (preset): preset is MonitorSetupOptionViewModel<MonitorSetupSelectablePresetId> =>
        preset.id !== "custom",
    ),
    customPresetCard:
      input.viewModel.presetCards.find(
        (preset): preset is MonitorSetupOptionViewModel<"custom"> => preset.id === "custom",
      ) ?? null,
    signalBanks: [
      {
        key: "signal-chain",
        kicker: input.t.simpleMode.deckSetup.signalChain,
        title: input.t.simpleMode.deckSetup.signalChainTitle,
        hint: input.t.simpleMode.deckSetup.signalChainHint,
        description: input.t.simpleMode.deckSetup.signalChainDescription,
        cards: input.viewModel.signalChainCards,
      },
      {
        key: "transport",
        kicker: input.t.simpleMode.deckSetup.transportBank,
        title: input.t.simpleMode.deckSetup.transportTitle,
        hint: input.t.simpleMode.deckSetup.transportHint,
        description: input.t.simpleMode.deckSetup.transportDescription,
        cards: input.viewModel.transportCards,
        role: "list",
      },
    ],
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
