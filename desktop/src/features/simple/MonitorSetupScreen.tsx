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

      {screenModel.signalBanks.map((bank) => (
        <MonitorSetupSignalBank
          key={bank.key}
          kicker={bank.kicker}
          title={bank.title}
          hint={bank.hint}
          description={bank.description}
          cards={bank.cards}
          role={bank.role}
        />
      ))}

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
