import React from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

import { useT } from "../../i18n/I18nContext";
import type { MonitorDeckControls } from "./monitorDeckControls";
import {
  formatMonitorDeckAlertShape,
  formatMonitorDeckBeatSnap,
  formatMonitorDeckCooldown,
  formatMonitorDeckDuckingIntensity,
  formatMonitorDeckMasterVolume,
  formatMonitorDeckRecoveryRelease,
  formatMonitorDeckWaveZoom,
} from "./monitorSetupViewModel";

interface MonitorDeckControlPanelProps {
  controls: MonitorDeckControls;
  onChange: <K extends keyof MonitorDeckControls>(key: K, value: MonitorDeckControls[K]) => void;
  onReset: () => void;
}

export function MonitorDeckControlPanel({
  controls,
  onChange,
  onReset,
}: MonitorDeckControlPanelProps) {
  const t = useT();
  return (
    <div className="monitor-control-rack">
      <div className="monitor-control-rack__header">
        <div className="monitor-control-rack__title">
          <SlidersHorizontal size={14} />
          <span>{t.simpleMode.deckSetup.deckControls}</span>
        </div>
        <button type="button" className="monitor-control-rack__reset" onClick={onReset}>
          <RotateCcw size={12} />
          {t.simpleMode.deckSetup.reset}
        </button>
      </div>

      <div className="monitor-control-rack__clusters">
        <section className="monitor-control-cluster">
          <div className="monitor-control-cluster__header">
            <strong>{t.simpleMode.deckSetup.waveTimingRack}</strong>
            <p>{t.simpleMode.deckSetup.waveTimingRackDetail}</p>
          </div>
          <div className="monitor-control-rack__grid">
            <label className="monitor-control-field">
              <span className="monitor-control-field__label">
                {t.simpleMode.deckSetup.waveZoom}
              </span>
              <div className="monitor-control-field__meta">
                <span>{t.simpleMode.deckSetup.waveZoomDetail}</span>
                <strong>{formatMonitorDeckWaveZoom(controls.waveformScale)}</strong>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.5"
                step="0.1"
                value={controls.waveformScale}
                onChange={(event) => onChange("waveformScale", parseFloat(event.target.value))}
              />
            </label>

            <label className="monitor-control-field monitor-control-field--compact">
              <span className="monitor-control-field__label">
                {t.simpleMode.deckSetup.beatSnap}
              </span>
              <div className="monitor-control-field__meta">
                <span>{t.simpleMode.deckSetup.beatSnapMeta}</span>
                <strong>{formatMonitorDeckBeatSnap(controls.beatSnapSubdivision, t)}</strong>
              </div>
              <select
                value={controls.beatSnapSubdivision}
                onChange={(event) =>
                  onChange("beatSnapSubdivision", parseFloat(event.target.value))
                }
              >
                <option value="0.5">{t.simpleMode.deckSetup.beatHalf}</option>
                <option value="0.25">{t.simpleMode.deckSetup.beatQuarter}</option>
                <option value="0.125">{t.simpleMode.deckSetup.beatEighth}</option>
              </select>
            </label>

            <label className="monitor-control-field monitor-control-field--compact">
              <span className="monitor-control-field__label">
                {t.simpleMode.deckSetup.cueCooldown}
              </span>
              <div className="monitor-control-field__meta">
                <span>{t.simpleMode.deckSetup.cueCooldownMeta}</span>
                <strong>{formatMonitorDeckCooldown(controls.cueCooldownMs)}</strong>
              </div>
              <input
                type="number"
                min="400"
                max="6000"
                step="100"
                value={controls.cueCooldownMs}
                onChange={(event) => onChange("cueCooldownMs", parseInt(event.target.value, 10))}
              />
            </label>
          </div>
        </section>

        <section className="monitor-control-cluster">
          <div className="monitor-control-cluster__header">
            <strong>{t.simpleMode.deckSetup.responseRack}</strong>
            <p>{t.simpleMode.deckSetup.responseRackDetail}</p>
          </div>
          <div className="monitor-control-rack__grid">
            <label className="monitor-control-field">
              <span className="monitor-control-field__label">
                {t.simpleMode.deckSetup.reactiveMix}
              </span>
              <div className="monitor-control-field__meta">
                <span>{t.simpleMode.deckSetup.reactiveMixMeta}</span>
                <strong>{controls.reactivity}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={controls.reactivity}
                onChange={(event) => onChange("reactivity", parseInt(event.target.value, 10))}
              />
            </label>

            <label className="monitor-control-field">
              <span className="monitor-control-field__label">
                {t.simpleMode.deckSetup.anomalyEmphasis}
              </span>
              <div className="monitor-control-field__meta">
                <span>{t.simpleMode.deckSetup.anomalyEmphasisMeta}</span>
                <strong>{controls.anomalyEmphasis}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={controls.anomalyEmphasis}
                onChange={(event) => onChange("anomalyEmphasis", parseInt(event.target.value, 10))}
              />
            </label>

            <label className="monitor-control-field">
              <span className="monitor-control-field__label">
                {t.simpleMode.deckSetup.duckingIntensity}
              </span>
              <div className="monitor-control-field__meta">
                <span>{t.simpleMode.deckSetup.duckingIntensityMeta}</span>
                <strong>{formatMonitorDeckDuckingIntensity(controls.duckingIntensity)}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={controls.duckingIntensity}
                onChange={(event) => onChange("duckingIntensity", parseInt(event.target.value, 10))}
              />
            </label>

            <label className="monitor-control-field">
              <span className="monitor-control-field__label">
                {t.simpleMode.deckSetup.recoveryRelease}
              </span>
              <div className="monitor-control-field__meta">
                <span>{t.simpleMode.deckSetup.recoveryReleaseMeta}</span>
                <strong>{formatMonitorDeckRecoveryRelease(controls.recoveryRelease)}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={controls.recoveryRelease}
                onChange={(event) => onChange("recoveryRelease", parseInt(event.target.value, 10))}
              />
            </label>
          </div>
        </section>

        <section className="monitor-control-cluster">
          <div className="monitor-control-cluster__header">
            <strong>{t.simpleMode.deckSetup.outputRack}</strong>
            <p>{t.simpleMode.deckSetup.outputRackDetail}</p>
          </div>
          <div className="monitor-control-rack__grid">
            <label className="monitor-control-field">
              <span className="monitor-control-field__label">
                {t.simpleMode.deckSetup.monitorLevel}
              </span>
              <div className="monitor-control-field__meta">
                <span>{t.simpleMode.deckSetup.monitorLevelMeta}</span>
                <strong>{formatMonitorDeckMasterVolume(controls.masterVolume)}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={controls.masterVolume}
                onChange={(event) => onChange("masterVolume", parseFloat(event.target.value))}
              />
            </label>

            <label className="monitor-control-field">
              <span className="monitor-control-field__label">
                {t.simpleMode.deckSetup.idleMotion}
              </span>
              <div className="monitor-control-field__meta">
                <span>{t.simpleMode.deckSetup.idleMotionMeta}</span>
                <strong>{controls.idleMotion}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={controls.idleMotion}
                onChange={(event) => onChange("idleMotion", parseInt(event.target.value, 10))}
              />
            </label>

            <label className="monitor-control-field monitor-control-field--compact">
              <span className="monitor-control-field__label">
                {t.simpleMode.deckSetup.alertShape}
              </span>
              <div className="monitor-control-field__meta">
                <span>{t.simpleMode.deckSetup.alertShapeMeta}</span>
                <strong>{formatMonitorDeckAlertShape(controls.alertShape, t)}</strong>
              </div>
              <select
                value={controls.alertShape}
                onChange={(event) =>
                  onChange("alertShape", event.target.value as MonitorDeckControls["alertShape"])
                }
              >
                <option value="soft">{t.simpleMode.deckSetup.alertShapeSoft}</option>
                <option value="tight">{t.simpleMode.deckSetup.alertShapeTight}</option>
                <option value="aggressive">{t.simpleMode.deckSetup.alertShapeAggressive}</option>
              </select>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
