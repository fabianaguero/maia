import type { ReactNode } from "react";

import type { AppTranslations } from "../../i18n/en";
import type { AppSkin } from "./appSkin";
import type {
  MonitorSetupPreferenceFieldViewModel,
  MonitorSetupPreferenceGroupViewModel,
  MonitorSetupPreferences,
} from "./monitorSetupPreferences";
import type {
  MonitorSetupCardViewModel,
  MonitorSetupOptionViewModel,
  MonitorSetupPreviewMeterViewModel,
  MonitorSetupSignalViewModel,
} from "./monitorSetupViewModel";

function SetupBankFrame(input: {
  kicker: string;
  title: string;
  hint: string;
  description: string;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="monitor-setup-screen__signal-bank">
      <div className="monitor-setup-screen__signal-copy">
        <span className="monitor-setup-screen__rack-kicker">{input.kicker}</span>
        <strong>{input.title}</strong>
        <span className="monitor-setup-screen__microcopy" title={input.description}>
          {input.hint}
        </span>
      </div>
      <div className={input.contentClassName ?? "monitor-setup-screen__signal-cards"}>
        {input.children}
      </div>
    </div>
  );
}

export function MonitorSetupHeroIdentityBank(input: {
  t: AppTranslations;
  languageOptions: Array<MonitorSetupOptionViewModel<"en" | "es">>;
  skinCards: Array<
    MonitorSetupOptionViewModel<AppSkin> & {
      swatches: string[];
    }
  >;
  onChangeLanguage: (lang: "en" | "es") => void;
  onChangeSkin: (skin: AppSkin) => void;
}) {
  return (
    <div className="monitor-setup-screen__identity-bank">
      <div className="monitor-setup-screen__language-bank">
        <div className="monitor-setup-screen__language-copy">
          <span className="monitor-setup-screen__rack-kicker">
            {input.t.simpleMode.deckSetup.languageBank}
          </span>
          <strong>{input.t.simpleMode.deckSetup.languageTitle}</strong>
          <span
            className="monitor-setup-screen__microcopy"
            title={input.t.simpleMode.deckSetup.languageDescription}
          >
            {input.t.simpleMode.deckSetup.languageHint}
          </span>
        </div>
        <div
          className="monitor-setup-screen__language-actions"
          role="group"
          aria-label={input.t.simpleMode.deckSetup.languageTitle}
        >
          {input.languageOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`monitor-setup-screen__language-btn ${option.isActive ? "active" : ""}`}
              aria-pressed={option.isActive}
              onClick={() => input.onChangeLanguage(option.id)}
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
            {input.t.simpleMode.deckSetup.skinBank}
          </span>
          <strong>{input.t.simpleMode.deckSetup.skinTitle}</strong>
          <span
            className="monitor-setup-screen__microcopy"
            title={input.t.simpleMode.deckSetup.skinDescription}
          >
            {input.t.simpleMode.deckSetup.skinHint}
          </span>
        </div>
        <div className="monitor-setup-screen__skin-grid" role="list">
          {input.skinCards.map((card) => (
            <button
              key={card.id}
              type="button"
              role="listitem"
              className={`monitor-setup-screen__skin-card monitor-setup-screen__skin-card--${card.id} ${card.isActive ? "active" : ""}`}
              aria-label={card.label}
              aria-pressed={card.isActive}
              onClick={() => input.onChangeSkin(card.id)}
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

export function MonitorSetupSummaryBank(input: {
  summaryCards: MonitorSetupCardViewModel[];
  icons: Record<MonitorSetupCardViewModel["key"], ReactNode>;
}) {
  return (
    <div className="monitor-setup-screen__summary">
      {input.summaryCards.map((card) => (
        <div key={card.label} className="monitor-setup-screen__summary-card">
          <div className="monitor-setup-screen__summary-head">
            <span className="monitor-setup-screen__summary-icon">{input.icons[card.key]}</span>
            <span className="monitor-setup-screen__summary-label">{card.label}</span>
          </div>
          <strong className="monitor-setup-screen__summary-value">{card.value}</strong>
          <span className="monitor-setup-screen__summary-meta" title={card.detail}>
            {card.detail}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MonitorSetupSignalBank(input: {
  kicker: string;
  title: string;
  hint: string;
  description: string;
  cards: MonitorSetupSignalViewModel[];
  role?: "list" | "group";
}) {
  return (
    <SetupBankFrame
      kicker={input.kicker}
      title={input.title}
      hint={input.hint}
      description={input.description}
      contentClassName="monitor-setup-screen__signal-cards"
    >
      {input.cards.map((card) => (
        <div
          key={card.key}
          className="monitor-setup-screen__signal-card"
          role={input.role === "list" ? "listitem" : undefined}
        >
          <span className="monitor-setup-screen__signal-label">{card.label}</span>
          <strong className="monitor-setup-screen__signal-value">{card.value}</strong>
        </div>
      ))}
    </SetupBankFrame>
  );
}

export function MonitorSetupPresetCards(input: {
  t: AppTranslations;
  presetCards: Array<
    MonitorSetupOptionViewModel<"passive" | "balanced" | "alert"> | null
  >;
  customPresetCard: MonitorSetupOptionViewModel<"custom"> | null;
  activePreset: "passive" | "balanced" | "alert" | "custom";
  applyDeckPreset: (preset: "passive" | "balanced" | "alert") => void;
}) {
  return (
    <div className="monitor-setup-screen__preset-bank">
      <div className="monitor-setup-screen__preset-copy">
        <span className="monitor-setup-screen__rack-kicker">
          {input.t.simpleMode.deckSetup.presetBank}
        </span>
        <strong>{input.t.simpleMode.deckSetup.presetTitle}</strong>
        <span
          className="monitor-setup-screen__microcopy"
          title={input.t.simpleMode.deckSetup.presetDescription}
        >
          {input.t.simpleMode.deckSetup.presetHint}
        </span>
      </div>

      <div className="monitor-setup-screen__preset-grid" role="list">
        {input.presetCards.filter(Boolean).map((preset) => (
          <button
            key={preset!.id}
            type="button"
            role="listitem"
            className={`monitor-setup-screen__preset-card ${preset!.isActive ? "active" : ""}`}
            aria-label={preset!.label}
            aria-pressed={preset!.isActive}
            onClick={() => input.applyDeckPreset(preset!.id)}
            title={preset!.detail}
          >
            <div className="monitor-setup-screen__preset-head">
              <span className="monitor-setup-screen__preset-label">{preset!.label}</span>
              <span className="monitor-setup-screen__preset-chip">{preset!.chipLabel}</span>
            </div>
            <span className="monitor-setup-screen__card-detail">{preset!.detail}</span>
          </button>
        ))}

        <div
          className={`monitor-setup-screen__preset-card monitor-setup-screen__preset-card--custom ${input.activePreset === "custom" ? "active" : ""}`}
          title={input.customPresetCard?.detail}
        >
          <div className="monitor-setup-screen__preset-head">
            <span className="monitor-setup-screen__preset-label">
              {input.customPresetCard?.label}
            </span>
            <span className="monitor-setup-screen__preset-chip">
              {input.customPresetCard?.chipLabel}
            </span>
          </div>
          <span className="monitor-setup-screen__card-detail">
            {input.customPresetCard?.detail}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MonitorSetupPreviewBank(input: {
  t: AppTranslations;
  meters: MonitorSetupPreviewMeterViewModel[];
}) {
  return (
    <div className="monitor-setup-screen__preview-bank">
      <div className="monitor-setup-screen__preview-copy">
        <span className="monitor-setup-screen__rack-kicker">
          {input.t.simpleMode.deckSetup.livePreview}
        </span>
        <strong>{input.t.simpleMode.deckSetup.livePreviewTitle}</strong>
        <span
          className="monitor-setup-screen__microcopy"
          title={input.t.simpleMode.deckSetup.livePreviewDescription}
        >
          {input.t.simpleMode.deckSetup.livePreviewHint}
        </span>
      </div>

      <div className="monitor-setup-screen__preview-meters" role="list">
        {input.meters.map((meter) => (
          <div key={meter.key} className="monitor-setup-screen__preview-meter" role="listitem">
            <div className="monitor-setup-screen__preview-meter-bar">
              <span
                className="monitor-setup-screen__preview-meter-fill"
                style={{ height: `${Math.max(10, meter.value)}%` }}
              />
            </div>
            <strong>{meter.value}%</strong>
            <span>{meter.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonitorSetupRuntimeDefaultsBank(input: {
  t: AppTranslations;
  setupPreferences: MonitorSetupPreferences;
  runtimeDefaultFields: MonitorSetupPreferenceFieldViewModel[];
  runtimeDefaultGroups?: MonitorSetupPreferenceGroupViewModel[];
  onUpdateSetupPreference: <K extends keyof MonitorSetupPreferences>(
    key: K,
    value: MonitorSetupPreferences[K],
  ) => void;
}) {
  return (
    <div className="monitor-setup-screen__preset-bank">
      <div className="monitor-setup-screen__preset-copy">
        <span className="monitor-setup-screen__rack-kicker">
          {input.t.simpleMode.deckSetup.runtimeDefaults}
        </span>
        <strong>{input.t.simpleMode.deckSetup.runtimeDefaultsTitle}</strong>
        <span
          className="monitor-setup-screen__microcopy"
          title={input.t.simpleMode.deckSetup.runtimeDefaultsDescription}
        >
          {input.t.simpleMode.deckSetup.runtimeDefaultsHint}
        </span>
      </div>

      <div className="monitor-control-rack__grid" role="group">
        {(input.runtimeDefaultGroups ?? [{ key: "stream-runtime", label: "", hint: "", fields: input.runtimeDefaultFields }]).map((group) => (
          <div key={group.key} className="monitor-setup-screen__runtime-group">
            {group.label ? (
              <div className="monitor-setup-screen__runtime-group-copy">
                <strong>{group.label}</strong>
                <span className="monitor-setup-screen__microcopy">{group.hint}</span>
              </div>
            ) : null}
            <div className="monitor-control-rack__grid" role="group" aria-label={group.label || undefined}>
              {group.fields.map((field) => (
                <label key={field.key} className="monitor-control-field monitor-control-field--compact">
                  <span className="monitor-control-field__label">{field.label}</span>
                  <div className="monitor-control-field__meta">
                    <span>{field.help}</span>
                    <strong>{field.valueLabel}</strong>
                  </div>
                  <input
                    type={field.inputMode}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    placeholder={field.placeholder}
                    value={String(input.setupPreferences[field.key])}
                    onChange={(event) => {
                      const nextValue =
                        field.inputMode === "number"
                          ? Number(event.target.value)
                          : event.target.value;
                      input.onUpdateSetupPreference(
                        field.key,
                        nextValue as MonitorSetupPreferences[typeof field.key],
                      );
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
