import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DEFAULT_SOURCE_TEMPLATE_ID } from "../../../src/config/sourceTemplates";
import { useSessionScreenLocalState } from "../../../src/features/session/useSessionScreenLocalState";

describe("useSessionScreenLocalState", () => {
  it("hydrates deterministic defaults from track availability", () => {
    const { result } = renderHook(() =>
      useSessionScreenLocalState({
        trackCount: 2,
      }),
    );

    expect(result.current.mode).toBe("log");
    expect(result.current.baseMode).toBe("track");
    expect(result.current.selectedTemplateId).toBe(DEFAULT_SOURCE_TEMPLATE_ID);
    expect(result.current.selectedSessionEvents).toEqual([]);
    expect(result.current.boothBedAudioRef.current).toBeNull();
  });

  it("switches to playlist base mode when there are no tracks and keeps setters writable", () => {
    const { result } = renderHook(() =>
      useSessionScreenLocalState({
        trackCount: 0,
      }),
    );

    expect(result.current.baseMode).toBe("playlist");

    act(() => {
      result.current.setSessionLabel("Night watch");
      result.current.setSelectedSourceId("repo-1");
      result.current.setSelectedTrackId("track-1");
      result.current.setSelectedPlaylistId("playlist-1");
      result.current.setDirectPath("/logs/direct.log");
      result.current.setCreateError("boom");
    });

    expect(result.current.sessionLabel).toBe("Night watch");
    expect(result.current.selectedSourceId).toBe("repo-1");
    expect(result.current.selectedTrackId).toBe("track-1");
    expect(result.current.selectedPlaylistId).toBe("playlist-1");
    expect(result.current.directPath).toBe("/logs/direct.log");
    expect(result.current.createError).toBe("boom");
  });
});
