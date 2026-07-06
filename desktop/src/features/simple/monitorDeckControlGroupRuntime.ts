import type { AppTranslations } from "../../i18n/types";
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
import type { MonitorDeckControlGroupViewModel } from "./monitorDeckControlPanelTypes";

export function buildMonitorDeckControlGroups(input: {
  controls: MonitorDeckControls;
  t: AppTranslations;
}): MonitorDeckControlGroupViewModel[] {
  const { controls, t } = input;

  return [
    {
      key: "wave-timing",
      title: t.simpleMode.deckSetup.waveTimingRack,
      detail: t.simpleMode.deckSetup.waveTimingRackDetail,
      fields: [
        {
          key: "waveformScale",
          inputKind: "range",
          label: t.simpleMode.deckSetup.waveZoom,
          help: t.simpleMode.deckSetup.waveZoomDetail,
          valueLabel: formatMonitorDeckWaveZoom(controls.waveformScale),
          min: 0.5,
          max: 3.5,
          step: 0.1,
        },
        {
          key: "beatSnapSubdivision",
          inputKind: "select",
          compact: true,
          label: t.simpleMode.deckSetup.beatSnap,
          help: t.simpleMode.deckSetup.beatSnapMeta,
          valueLabel: formatMonitorDeckBeatSnap(controls.beatSnapSubdivision, t),
          options: [
            { value: 0.5, label: t.simpleMode.deckSetup.beatHalf },
            { value: 0.25, label: t.simpleMode.deckSetup.beatQuarter },
            { value: 0.125, label: t.simpleMode.deckSetup.beatEighth },
          ],
        },
        {
          key: "cueCooldownMs",
          inputKind: "number",
          compact: true,
          label: t.simpleMode.deckSetup.cueCooldown,
          help: t.simpleMode.deckSetup.cueCooldownMeta,
          valueLabel: formatMonitorDeckCooldown(controls.cueCooldownMs),
          min: 400,
          max: 6000,
          step: 100,
        },
      ],
    },
    {
      key: "response",
      title: t.simpleMode.deckSetup.responseRack,
      detail: t.simpleMode.deckSetup.responseRackDetail,
      fields: [
        {
          key: "reactivity",
          inputKind: "range",
          label: t.simpleMode.deckSetup.reactiveMix,
          help: t.simpleMode.deckSetup.reactiveMixMeta,
          valueLabel: `${controls.reactivity}%`,
          min: 0,
          max: 100,
          step: 1,
        },
        {
          key: "anomalyEmphasis",
          inputKind: "range",
          label: t.simpleMode.deckSetup.anomalyEmphasis,
          help: t.simpleMode.deckSetup.anomalyEmphasisMeta,
          valueLabel: `${controls.anomalyEmphasis}%`,
          min: 0,
          max: 100,
          step: 1,
        },
        {
          key: "duckingIntensity",
          inputKind: "range",
          label: t.simpleMode.deckSetup.duckingIntensity,
          help: t.simpleMode.deckSetup.duckingIntensityMeta,
          valueLabel: formatMonitorDeckDuckingIntensity(controls.duckingIntensity),
          min: 0,
          max: 100,
          step: 1,
        },
        {
          key: "recoveryRelease",
          inputKind: "range",
          label: t.simpleMode.deckSetup.recoveryRelease,
          help: t.simpleMode.deckSetup.recoveryReleaseMeta,
          valueLabel: formatMonitorDeckRecoveryRelease(controls.recoveryRelease),
          min: 0,
          max: 100,
          step: 1,
        },
      ],
    },
    {
      key: "output",
      title: t.simpleMode.deckSetup.outputRack,
      detail: t.simpleMode.deckSetup.outputRackDetail,
      fields: [
        {
          key: "masterVolume",
          inputKind: "range",
          label: t.simpleMode.deckSetup.monitorLevel,
          help: t.simpleMode.deckSetup.monitorLevelMeta,
          valueLabel: formatMonitorDeckMasterVolume(controls.masterVolume),
          min: 0,
          max: 1,
          step: 0.01,
        },
        {
          key: "idleMotion",
          inputKind: "range",
          label: t.simpleMode.deckSetup.idleMotion,
          help: t.simpleMode.deckSetup.idleMotionMeta,
          valueLabel: `${controls.idleMotion}%`,
          min: 0,
          max: 100,
          step: 1,
        },
        {
          key: "alertShape",
          inputKind: "select",
          compact: true,
          label: t.simpleMode.deckSetup.alertShape,
          help: t.simpleMode.deckSetup.alertShapeMeta,
          valueLabel: formatMonitorDeckAlertShape(controls.alertShape, t),
          options: [
            { value: "soft", label: t.simpleMode.deckSetup.alertShapeSoft },
            { value: "tight", label: t.simpleMode.deckSetup.alertShapeTight },
            { value: "aggressive", label: t.simpleMode.deckSetup.alertShapeAggressive },
          ],
        },
      ],
    },
  ];
}
