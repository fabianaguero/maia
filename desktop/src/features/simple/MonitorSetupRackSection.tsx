import { SlidersHorizontal } from "lucide-react";

import type { AppTranslations } from "../../i18n/types";
import { MonitorDeckControlPanel } from "./MonitorDeckControlPanel";
import {
  MonitorSetupPresetCards,
  MonitorSetupPreviewBank,
  MonitorSetupRuntimeDefaultsBank,
} from "./MonitorSetupSections";
import type { MonitorDeckControls } from "./monitorDeckControls";
import type {
  MonitorSetupPreferenceFieldViewModel,
  MonitorSetupPreferenceGroupViewModel,
} from "./monitorSetupPreferenceViewModelRuntime";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import type {
  MonitorSetupOptionViewModel,
  MonitorSetupPreviewMeterViewModel,
} from "./monitorSetupViewModel";

interface MonitorSetupRackSectionProps {
  t: AppTranslations;
  activePreset: "passive" | "balanced" | "alert" | "custom";
  presetCards: Array<MonitorSetupOptionViewModel<"passive" | "balanced" | "alert">>;
  customPresetCard: MonitorSetupOptionViewModel<"custom"> | null;
  applyDeckPreset: (preset: "passive" | "balanced" | "alert") => void;
  previewMeters: MonitorSetupPreviewMeterViewModel[];
  setupPreferences: MonitorSetupPreferences;
  runtimeDefaultFields: MonitorSetupPreferenceFieldViewModel[];
  runtimeDefaultGroups: MonitorSetupPreferenceGroupViewModel[];
  onUpdateSetupPreference: <K extends keyof MonitorSetupPreferences>(
    key: K,
    value: MonitorSetupPreferences[K],
  ) => void;
  controls: MonitorDeckControls;
  onChangeDeckControl: <K extends keyof MonitorDeckControls>(
    key: K,
    value: MonitorDeckControls[K],
  ) => void;
  onResetDeckControls: () => void;
}

export function MonitorSetupRackSection({
  t,
  activePreset,
  presetCards,
  customPresetCard,
  applyDeckPreset,
  previewMeters,
  setupPreferences,
  runtimeDefaultFields,
  runtimeDefaultGroups,
  onUpdateSetupPreference,
  controls,
  onChangeDeckControl,
  onResetDeckControls,
}: MonitorSetupRackSectionProps) {
  return (
    <div className="monitor-setup-screen__rack">
      <div className="monitor-setup-screen__rack-header">
        <div>
          <span className="monitor-setup-screen__rack-kicker">
            {t.simpleMode.deckSetup.deckParameterBank}
          </span>
          <h2>{t.simpleMode.deckSetup.editableControls}</h2>
        </div>
        <div className="monitor-setup-screen__rack-badge">
          <SlidersHorizontal size={14} />
          {t.simpleMode.deckSetup.persistentProfile}
        </div>
      </div>

      <MonitorSetupPresetCards
        t={t}
        presetCards={presetCards}
        customPresetCard={customPresetCard}
        activePreset={activePreset}
        applyDeckPreset={applyDeckPreset}
      />

      <MonitorSetupPreviewBank t={t} meters={previewMeters} />

      <MonitorSetupRuntimeDefaultsBank
        t={t}
        setupPreferences={setupPreferences}
        runtimeDefaultFields={runtimeDefaultFields}
        runtimeDefaultGroups={runtimeDefaultGroups}
        onUpdateSetupPreference={onUpdateSetupPreference}
      />

      <MonitorDeckControlPanel
        controls={controls}
        onChange={onChangeDeckControl}
        onReset={onResetDeckControls}
      />
    </div>
  );
}
