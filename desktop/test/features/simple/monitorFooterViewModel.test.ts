import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import { buildMonitorFooterViewModel } from "../../../src/features/simple/monitorFooterViewModel";

describe("monitorFooterViewModel", () => {
  it("builds footer status pills and actions for active audio", () => {
    const viewModel = buildMonitorFooterViewModel({
      t: en,
      streamStatusLabel: "file: 24 visible lines",
      audioStatusLabel: "Audio active",
      audioStatusTone: "live",
      audioStatus: "running",
    });

    expect(viewModel.statusPills).toEqual([
      {
        key: "stream",
        label: en.simpleMode.monitor.logEngine,
        tone: "default",
        value: "file: 24 visible lines",
      },
      {
        key: "audio",
        label: en.simpleMode.monitor.audioEngine,
        tone: "live",
        value: "Audio active",
      },
    ]);
    expect(viewModel.actions.map((action) => action.label)).toEqual([
      en.simpleMode.common.audioActive,
    ]);
  });

  it("switches the audio action label when the context is suspended", () => {
    const viewModel = buildMonitorFooterViewModel({
      t: en,
      streamStatusLabel: "gcp: connecting",
      audioStatusLabel: "Audio paused",
      audioStatusTone: "muted",
      audioStatus: "suspended",
    });

    expect(viewModel.statusPills[1]).toMatchObject({
      label: en.simpleMode.monitor.audioEngine,
      tone: "muted",
      value: "Audio paused",
    });
    expect(viewModel.actions[0]).toMatchObject({
      key: "audio",
      label: en.simpleMode.common.resumeAudio,
    });
  });
});
