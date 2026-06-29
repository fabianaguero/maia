import { describe, expect, it } from "vitest";

import { en } from "../src/i18n/en";
import { es } from "../src/i18n/es";

function flattenStrings(
  value: unknown,
  prefix = "",
  target: Map<string, string> = new Map(),
): Map<string, string> {
  if (typeof value === "string") {
    target.set(prefix, value);
    return target;
  }

  if (!value || typeof value !== "object") {
    return target;
  }

  Object.entries(value).forEach(([key, nested]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    flattenStrings(nested, nextPrefix, target);
  });

  return target;
}

const englishLeakAllowlist = new Set([
  "nav.inspect.description",
  "nav.compose.description",
  "nav.pillars.perform.description",
  "nav.pillars.design.description",
  "nav.pillars.curate.description",
  "library.toolbarSoundsTitle",
  "library.noSnapshot",
  "inspect.trackFormat",
  "inspect.hashStub",
  "inspect.buildSystem",
  "inspect.replayTimelineCopy",
  "inspect.mutationMapCopy",
  "inspect.trackPlaybackCopy",
  "inspect.trackTransportCopy",
  "inspect.repoIntakeRemote",
  "inspect.liveMonitorDeckTitle",
  "inspect.liveMonitorDeckOpen",
  "inspect.liveMonitorLiveCopy",
  "inspect.audioOn",
  "inspect.audioBlocked",
  "inspect.baseBedStep",
  "inspect.sceneStep",
  "inspect.auditionAuto",
  "inspect.liveLogDriven",
  "inspect.cueEngineBaseSamplePack",
  "inspect.cueEngineBaseSample",
  "inspect.cueEngineLoadingSample",
  "inspect.cueEngineInternalSynth",
  "inspect.idleUpper",
  "inspect.padSequencerCopy",
  "inspect.liveSceneCopy",
  "inspect.multiSample",
  "inspect.singleSample",
  "inspect.panRight",
  "inspect.panLeft",
  "inspect.panCenter",
  "inspect.previewPlaybackDescription",
  "compose.previewPlaybackDescription",
  "session.liveBooth",
  "sourceTemplates.chillAmbient.genre",
  "sourceTemplates.deepHouse.label",
  "sourceTemplates.deepHouse.genre",
  "sourceTemplates.techHouse.label",
  "sourceTemplates.techHouse.genre",
  "sourceTemplates.melodicTechno.genre",
  "sourceTemplates.peakTechno.label",
  "sourceTemplates.peakTechno.genre",
  "sourceTemplates.tranceBuild.genre",
  "sourceTemplates.glitch.genre",
  "sourceTemplates.drumAndBass.genre",
  "sourceTemplates.lofi.genre",
  "simpleMode.monitor.waveformTitle",
  "simpleMode.setup.cloud",
  "simpleMode.setup.ambientFallback",
  "simpleMode.connections.gcpCloudRun",
  "simpleMode.connections.gcpCloudRunDescription",
  "simpleMode.connections.cloudRunService",
  "simpleMode.connections.cloudLabelPlaceholder",
  "simpleMode.connections.cloudRunLabelSuffix",
  "simpleMode.proMonitor.logKind",
  "simpleMode.proMonitor.trackMeta",
  "simpleMode.proMonitor.healthCheckOk",
  "simpleMode.proMonitor.timeoutCallingGateway",
  "simpleMode.proMonitor.recoveryConfirmed",
  "simpleMode.deckSetup.description",
  "simpleMode.deckSetup.languageDescription",
  "simpleMode.deckSetup.deckParameterBank",
  "simpleMode.deckSetup.deckControls",
  "simpleMode.deckSetup.beatSnap",
]);

const suspiciousEnglishTokens = [
  /\bwarning\b/i,
  /\bpreview\b/i,
  /\bstream\b/i,
  /\btimeline\b/i,
  /\bruntime\b/i,
  /\bsnapshot\b/i,
  /\bfallback\b/i,
  /\bfilesystem\b/i,
  /\bfeed\b/i,
  /\binline\b/i,
];

describe("i18n translations", () => {
  it("keeps Spanish and English translation trees aligned", () => {
    const enStrings = flattenStrings(en);
    const esStrings = flattenStrings(es);

    expect([...esStrings.keys()].sort()).toEqual([...enStrings.keys()].sort());
  });

  it("avoids accidental English copy leakage in Spanish visible strings", () => {
    const esStrings = flattenStrings(es);
    const leaks = [...esStrings.entries()]
      .filter(([key]) => !englishLeakAllowlist.has(key))
      .filter(([, value]) => suspiciousEnglishTokens.some((pattern) => pattern.test(value)))
      .map(([key, value]) => `${key}: ${value}`);

    expect(leaks).toEqual([]);
  });
});
