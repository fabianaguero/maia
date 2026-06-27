import React from "react";
import { Activity, AlertTriangle, RadioTower, SlidersHorizontal, Waves } from "lucide-react";

import { useT } from "../../i18n/I18nContext";
import type { AppSkin } from "./appSkin";
import { MonitorDeckControlPanel } from "./MonitorDeckControlPanel";
import {
  MonitorSetupHeroIdentityBank,
  MonitorSetupPreviewBank,
  MonitorSetupPresetCards,
  MonitorSetupRuntimeDefaultsBank,
  MonitorSetupSignalBank,
  MonitorSetupSummaryBank,
} from "./MonitorSetupSections";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import { useMonitorDeckControls } from "./useMonitorDeckControls";
import { buildMonitorSetupScreenViewModel } from "./monitorSetupViewModel";

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
  const {
    deckControls,
    updateDeckControl,
    resetDeckControls,
    applyDeckPreset,
    activePreset,
    isDirty,
  } = useMonitorDeckControls();
  const viewModel = buildMonitorSetupScreenViewModel({
    controls: deckControls,
    lang,
    skin,
    activePreset,
    isDirty,
    setupPreferences,
    t,
  });
  const presetCards = viewModel.presetCards.filter(
    (
      preset,
    ): preset is (typeof viewModel.presetCards)[number] & {
      id: "passive" | "balanced" | "alert";
    } => preset.id !== "custom",
  );
  const customPresetCard =
    viewModel.presetCards.find(
      (
        preset,
      ): preset is (typeof viewModel.presetCards)[number] & {
        id: "custom";
      } => preset.id === "custom",
    ) ?? null;
  const setupIcons = {
    "reactive-mix": <Activity size={16} />,
    "anomaly-emphasis": <AlertTriangle size={16} />,
    "idle-motion": <Waves size={16} />,
    "monitor-level": <SlidersHorizontal size={16} />,
    "ducking-intensity": <RadioTower size={16} />,
    "recovery-release": <Waves size={16} />,
    "alert-shape": <RadioTower size={16} />,
  } as const;

  return (
    <div className="monitor-setup-screen">
      <div className="monitor-setup-screen__hero">
        <div className="monitor-setup-screen__headline">
          <span className="monitor-setup-screen__eyebrow">{t.simpleMode.deckSetup.eyebrow}</span>
          <h1>{t.simpleMode.deckSetup.title}</h1>
          <p>{t.simpleMode.deckSetup.description}</p>
          <MonitorSetupHeroIdentityBank
            t={t}
            languageOptions={viewModel.languageOptions}
            skinCards={viewModel.skinCards}
            onChangeLanguage={onChangeLanguage}
            onChangeSkin={onChangeSkin}
          />
        </div>

        <MonitorSetupSummaryBank summaryCards={viewModel.summaryCards} icons={setupIcons} />
      </div>

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

        <MonitorSetupPreviewBank t={t} meters={viewModel.previewMeters} />

        <MonitorSetupRuntimeDefaultsBank
          t={t}
          setupPreferences={setupPreferences}
          runtimeDefaultFields={viewModel.runtimeDefaultFields}
          runtimeDefaultGroups={viewModel.runtimeDefaultGroups}
          onUpdateSetupPreference={onUpdateSetupPreference}
        />

        <MonitorDeckControlPanel
          controls={deckControls}
          onChange={updateDeckControl}
          onReset={resetDeckControls}
        />
      </div>
    </div>
  );
}
