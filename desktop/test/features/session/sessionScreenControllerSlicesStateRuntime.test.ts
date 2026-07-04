import { describe, expect, it, vi } from "vitest";

import {
  buildSessionScreenControllerSlicesDerivedDeps,
  pickSessionScreenControllerSlicesActionLocalState,
  pickSessionScreenControllerSlicesBoothLocalState,
  pickSessionScreenControllerSlicesDerivedLocalState,
  pickSessionScreenControllerSlicesEffectsLocalState,
  resolveSessionScreenControllerTemplateMeta,
} from "../../../src/features/session/sessionScreenControllerSlicesStateRuntime";
import { en } from "../../../src/i18n/en";

describe("sessionScreenControllerSlicesStateRuntime", () => {
  it("picks action, derived, effects and booth local slices", () => {
    const localState = {
      baseMode: "track",
      mode: "log",
      selectedPlaylistId: null,
      selectedSourceId: "repo-1",
      selectedTrackId: "track-1",
      sessionLabel: "Night watch",
      directPath: "/logs/service.log",
      setCreateError: vi.fn(),
      setCreating: vi.fn(),
      setIsDirectLoading: vi.fn(),
      setSessionLabel: vi.fn(),
      setSelectedSourceId: vi.fn(),
      setSelectedTrackId: vi.fn(),
      setSelectedPlaylistId: vi.fn(),
      setDirectPath: vi.fn(),
      selectedSessionEvents: [],
      setLatestUpdate: vi.fn(),
      setSelectedSessionEvents: vi.fn(),
      boothBedAudioRef: { current: null },
      latestUpdate: { suggestedBpm: 126 },
    } as never;

    const actionLocalState = pickSessionScreenControllerSlicesActionLocalState(localState);
    const derivedLocalState = pickSessionScreenControllerSlicesDerivedLocalState(localState);
    const effectsLocalState = pickSessionScreenControllerSlicesEffectsLocalState(localState);
    const boothLocalState = pickSessionScreenControllerSlicesBoothLocalState(localState);

    expect(actionLocalState.directPath).toBe("/logs/service.log");
    expect(derivedLocalState.selectedSourceId).toBe("repo-1");
    expect(effectsLocalState.boothBedAudioRef.current).toBeNull();
    expect(boothLocalState.latestUpdate?.suggestedBpm).toBe(126);
  });

  it("resolves template meta and derived dependencies", () => {
    const meta = resolveSessionScreenControllerTemplateMeta({
      selectedTemplate: { genre: "House", label: "Deep House" },
      selectedTemplatePresentation: { genre: "Club House", label: "Club" },
    });
    const deps = buildSessionScreenControllerSlicesDerivedDeps({
      controllerInput: { id: "controller" } as never,
      monitorSnapshot: { sessionId: "monitor-1" },
      localState: {
        baseMode: "track",
        mode: "log",
        selectedPlaylistId: null,
        selectedSessionEvents: [],
        selectedSourceId: "repo-1",
        selectedTrackId: "track-1",
      },
      t: en,
      selectedTemplateGenre: meta.selectedTemplateGenre,
      selectedTemplateLabel: meta.selectedTemplateLabel,
    });

    expect(meta.selectedTemplateGenre).toBe("Club House");
    expect(meta.selectedTemplateLabel).toBe("Club");
    expect(deps).toHaveLength(11);
    expect(deps[0]).toEqual({ id: "controller" });
  });
});
