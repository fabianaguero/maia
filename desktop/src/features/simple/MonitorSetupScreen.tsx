import React from "react";
import { Activity, AlertTriangle, SlidersHorizontal, Waves } from "lucide-react";

import { useT } from "../../i18n/I18nContext";
import { MonitorDeckControlPanel } from "./MonitorDeckControlPanel";
import { useMonitorDeckControls } from "./useMonitorDeckControls";
import { buildMonitorSetupScreenViewModel } from "./monitorSetupViewModel";

interface MonitorSetupScreenProps {
  lang: "en" | "es";
  onChangeLanguage: (lang: "en" | "es") => void;
}

export function MonitorSetupScreen({ lang, onChangeLanguage }: MonitorSetupScreenProps) {
  const t = useT();
  const { deckControls, updateDeckControl, resetDeckControls } = useMonitorDeckControls();
  const viewModel = buildMonitorSetupScreenViewModel({
    controls: deckControls,
    lang,
    t,
  });
  const setupIcons = {
    "reactive-mix": <Activity size={16} />,
    "anomaly-emphasis": <AlertTriangle size={16} />,
    "idle-motion": <Waves size={16} />,
  } as const;

  return (
    <div className="monitor-setup-screen">
      <div className="monitor-setup-screen__hero">
        <div className="monitor-setup-screen__headline">
          <span className="monitor-setup-screen__eyebrow">{t.simpleMode.deckSetup.eyebrow}</span>
          <h1>{t.simpleMode.deckSetup.title}</h1>
          <p>{t.simpleMode.deckSetup.description}</p>

          <div className="monitor-setup-screen__language-bank">
            <div className="monitor-setup-screen__language-copy">
              <span className="monitor-setup-screen__rack-kicker">
                {t.simpleMode.deckSetup.languageBank}
              </span>
              <strong>{t.simpleMode.deckSetup.languageTitle}</strong>
              <p>{t.simpleMode.deckSetup.languageDescription}</p>
            </div>
            <div
              className="monitor-setup-screen__language-actions"
              role="group"
              aria-label={t.simpleMode.deckSetup.languageTitle}
            >
              <button
                type="button"
                className={`monitor-setup-screen__language-btn ${lang === "es" ? "active" : ""}`}
                onClick={() => onChangeLanguage("es")}
              >
                ES · {t.simpleMode.deckSetup.spanish}
              </button>
              <button
                type="button"
                className={`monitor-setup-screen__language-btn ${lang === "en" ? "active" : ""}`}
                onClick={() => onChangeLanguage("en")}
              >
                EN · {t.simpleMode.deckSetup.english}
              </button>
            </div>
          </div>
        </div>

        <div className="monitor-setup-screen__summary">
          {viewModel.summaryCards.map((card) => (
            <div key={card.label} className="monitor-setup-screen__summary-card">
              <div className="monitor-setup-screen__summary-head">
                <span className="monitor-setup-screen__summary-icon">
                  {setupIcons[card.key as keyof typeof setupIcons]}
                </span>
                <span className="monitor-setup-screen__summary-label">{card.label}</span>
              </div>
              <strong className="monitor-setup-screen__summary-value">{card.value}</strong>
              <p>{card.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="monitor-setup-screen__signal-bank">
        <div className="monitor-setup-screen__signal-copy">
          <span className="monitor-setup-screen__rack-kicker">
            {t.simpleMode.deckSetup.signalChain}
          </span>
          <strong>{t.simpleMode.deckSetup.signalChainTitle}</strong>
          <p>{t.simpleMode.deckSetup.signalChainDescription}</p>
        </div>
        <div
          className="monitor-setup-screen__signal-cards"
          aria-label={t.simpleMode.deckSetup.signalChainTitle}
        >
          {viewModel.signalChainCards.map((card) => (
            <div key={card.key} className="monitor-setup-screen__signal-card">
              <span className="monitor-setup-screen__signal-label">{card.label}</span>
              <strong className="monitor-setup-screen__signal-value">{card.value}</strong>
            </div>
          ))}
        </div>
      </div>

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

        <MonitorDeckControlPanel
          controls={deckControls}
          onChange={updateDeckControl}
          onReset={resetDeckControls}
        />
      </div>
    </div>
  );
}
