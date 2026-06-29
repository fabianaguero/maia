import type { ReactNode } from "react";

import type { AppTranslations } from "../../i18n/en";
import type { AppSkin } from "./appSkin";
import {
  MonitorSetupHeroIdentityBank,
  MonitorSetupSummaryBank,
} from "./MonitorSetupSections";
import type {
  MonitorSetupCardViewModel,
  MonitorSetupOptionViewModel,
} from "./monitorSetupViewModel";

interface MonitorSetupHeroPanelProps {
  t: AppTranslations;
  languageOptions: Array<MonitorSetupOptionViewModel<"en" | "es">>;
  skinCards: Array<
    MonitorSetupOptionViewModel<AppSkin> & {
      swatches: string[];
    }
  >;
  summaryCards: MonitorSetupCardViewModel[];
  summaryIcons: Record<MonitorSetupCardViewModel["key"], ReactNode>;
  onChangeLanguage: (lang: "en" | "es") => void;
  onChangeSkin: (skin: AppSkin) => void;
}

export function MonitorSetupHeroPanel({
  t,
  languageOptions,
  skinCards,
  summaryCards,
  summaryIcons,
  onChangeLanguage,
  onChangeSkin,
}: MonitorSetupHeroPanelProps) {
  return (
    <div className="monitor-setup-screen__hero">
      <div className="monitor-setup-screen__headline">
        <span className="monitor-setup-screen__eyebrow">{t.simpleMode.deckSetup.eyebrow}</span>
        <h1>{t.simpleMode.deckSetup.title}</h1>
        <p>{t.simpleMode.deckSetup.description}</p>
        <MonitorSetupHeroIdentityBank
          t={t}
          languageOptions={languageOptions}
          skinCards={skinCards}
          onChangeLanguage={onChangeLanguage}
          onChangeSkin={onChangeSkin}
        />
      </div>

      <MonitorSetupSummaryBank summaryCards={summaryCards} icons={summaryIcons} />
    </div>
  );
}
