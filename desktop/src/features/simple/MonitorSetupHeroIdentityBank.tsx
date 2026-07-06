import type { AppTranslations } from "../../i18n/types";
import type { AppSkin } from "./appSkin";
import type { MonitorSetupOptionViewModel } from "./monitorSetupViewModel";

interface MonitorSetupHeroIdentityBankProps {
  t: AppTranslations;
  languageOptions: Array<MonitorSetupOptionViewModel<"en" | "es">>;
  skinCards: Array<
    MonitorSetupOptionViewModel<AppSkin> & {
      swatches: string[];
    }
  >;
  onChangeLanguage: (lang: "en" | "es") => void;
  onChangeSkin: (skin: AppSkin) => void;
}

export function MonitorSetupHeroIdentityBank({
  t,
  languageOptions,
  skinCards,
  onChangeLanguage,
  onChangeSkin,
}: MonitorSetupHeroIdentityBankProps) {
  return (
    <div className="monitor-setup-screen__identity-bank">
      <div className="monitor-setup-screen__language-bank">
        <div className="monitor-setup-screen__language-copy">
          <span className="monitor-setup-screen__rack-kicker">
            {t.simpleMode.deckSetup.languageBank}
          </span>
          <strong>{t.simpleMode.deckSetup.languageTitle}</strong>
          <span
            className="monitor-setup-screen__microcopy"
            title={t.simpleMode.deckSetup.languageDescription}
          >
            {t.simpleMode.deckSetup.languageHint}
          </span>
        </div>
        <div
          className="monitor-setup-screen__language-actions"
          role="group"
          aria-label={t.simpleMode.deckSetup.languageTitle}
        >
          {languageOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`monitor-setup-screen__language-btn ${option.isActive ? "active" : ""}`}
              aria-pressed={option.isActive}
              onClick={() => onChangeLanguage(option.id)}
              title={option.detail}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="monitor-setup-screen__skin-bank">
        <div className="monitor-setup-screen__skin-copy">
          <span className="monitor-setup-screen__rack-kicker">
            {t.simpleMode.deckSetup.skinBank}
          </span>
          <strong>{t.simpleMode.deckSetup.skinTitle}</strong>
          <span
            className="monitor-setup-screen__microcopy"
            title={t.simpleMode.deckSetup.skinDescription}
          >
            {t.simpleMode.deckSetup.skinHint}
          </span>
        </div>
        <div className="monitor-setup-screen__skin-grid" role="list">
          {skinCards.map((card) => (
            <button
              key={card.id}
              type="button"
              role="listitem"
              className={`monitor-setup-screen__skin-card monitor-setup-screen__skin-card--${card.id} ${card.isActive ? "active" : ""}`}
              aria-label={card.label}
              aria-pressed={card.isActive}
              onClick={() => onChangeSkin(card.id)}
              title={card.detail}
            >
              <div className="monitor-setup-screen__skin-card-top">
                <span className="monitor-setup-screen__skin-label">{card.label}</span>
                <span className="monitor-setup-screen__skin-chip">{card.chipLabel}</span>
              </div>
              <div className="monitor-setup-screen__skin-swatches" aria-hidden="true">
                {card.swatches.map((swatch) => (
                  <span
                    key={swatch}
                    className="monitor-setup-screen__skin-swatch"
                    style={{ background: swatch }}
                  />
                ))}
              </div>
              <span className="monitor-setup-screen__card-detail">{card.detail}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
