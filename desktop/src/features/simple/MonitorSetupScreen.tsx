import React from "react";

import { useT } from "../../i18n/I18nContext";
import type { AppSkin } from "./appSkin";
import { MonitorSetupHeroPanel } from "./MonitorSetupHeroPanel";
import { MonitorSetupRackSection } from "./MonitorSetupRackSection";
import { MonitorSetupSignalBank } from "./MonitorSetupSections";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import { useMonitorSetupScreenModel } from "./useMonitorSetupScreenModel";

interface MonitorSetupScreenProps {
  lang: "en" | "es";
  onChangeLanguage: (lang: "en" | "es") => void;
  skin: AppSkin;
  onChangeSkin: (skin: AppSkin) => void;
  setupPreferences: MonitorSetupPreferences;
  onUpdateSetupPreference: <K extends keyof MonitorSetupPreferences>(
    key: K,
    value: MonitorSetupPreferences[K],
  ) => void;
}

export function MonitorSetupScreen({
  lang,
  onChangeLanguage,
  skin,
  onChangeSkin,
  setupPreferences,
  onUpdateSetupPreference,
}: MonitorSetupScreenProps) {
  const t = useT();
  const { profile, viewModel, screenModel, updateDeckControl, resetDeckControls, applyDeckPreset } =
    useMonitorSetupScreenModel({
      lang,
      skin,
      setupPreferences,
      t,
    });

  return (
    <div className="monitor-setup-screen">
      <MonitorSetupHeroPanel
        t={t}
        languageOptions={viewModel.languageOptions}
        skinCards={viewModel.skinCards}
        summaryCards={viewModel.summaryCards}
        summaryIcons={screenModel.setupIcons}
        onChangeLanguage={onChangeLanguage}
        onChangeSkin={onChangeSkin}
      />

      <MonitorSetupSignalBank
        kicker={t.simpleMode.deckSetup.signalChain}
        title={t.simpleMode.deckSetup.signalChainTitle}
        hint={t.simpleMode.deckSetup.signalChainHint}
        description={t.simpleMode.deckSetup.signalChainDescription}
        cards={viewModel.signalChainCards}
      />

      <MonitorSetupSignalBank
        kicker={t.simpleMode.deckSetup.transportBank}
        title={t.simpleMode.deckSetup.transportTitle}
        hint={t.simpleMode.deckSetup.transportHint}
        description={t.simpleMode.deckSetup.transportDescription}
        cards={viewModel.transportCards}
        role="list"
      />

      <MonitorSetupRackSection
        t={t}
        activePreset={profile.activePreset}
        presetCards={screenModel.presetCards}
        customPresetCard={screenModel.customPresetCard}
        applyDeckPreset={applyDeckPreset}
        previewMeters={viewModel.previewMeters}
        setupPreferences={setupPreferences}
        runtimeDefaultFields={viewModel.runtimeDefaultFields}
        runtimeDefaultGroups={viewModel.runtimeDefaultGroups}
        onUpdateSetupPreference={onUpdateSetupPreference}
        controls={profile.deckControls}
        onChangeDeckControl={updateDeckControl}
        onResetDeckControls={resetDeckControls}
      />
    </div>
  );
}
