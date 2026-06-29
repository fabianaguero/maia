import { describe, expect, it } from "vitest";

import {
  canManagedAudioAttemptPlayback,
  describeManagedAudioState,
  formatManagedAudioDuration,
  mimeTypeFromPath,
  resolveManagedAudioInitialState,
  resolveManagedAudioNote,
  resolveManagedAudioScrubberRange,
  resolveManagedAudioShownDuration,
} from "../../src/features/analyzer/components/managedAudioPlayerRuntime";
import { en } from "../../src/i18n/en";

describe("managedAudioPlayerRuntime", () => {
  it("formats transport durations conservatively", () => {
    expect(formatManagedAudioDuration(null)).toBe("--:--");
    expect(formatManagedAudioDuration(0)).toBe("--:--");
    expect(formatManagedAudioDuration(79.4)).toBe("1:19");
  });

  it("detects when desktop playback can be attempted", () => {
    expect(canManagedAudioAttemptPlayback("/music/demo.wav", true)).toBe(true);
    expect(canManagedAudioAttemptPlayback("browser-fallback://demo.wav", true)).toBe(false);
    expect(canManagedAudioAttemptPlayback("/music/demo.wav", false)).toBe(false);
    expect(canManagedAudioAttemptPlayback(null, true)).toBe(false);
  });

  it("derives the initial playback state from path and shell capabilities", () => {
    expect(resolveManagedAudioInitialState({ audioPath: null, isDesktopShell: true })).toBe("idle");
    expect(
      resolveManagedAudioInitialState({
        audioPath: "browser-fallback://demo.wav",
        isDesktopShell: true,
      }),
    ).toBe("unavailable");
    expect(
      resolveManagedAudioInitialState({ audioPath: "/music/demo.wav", isDesktopShell: true }),
    ).toBe("loading");
  });

  it("resolves mime types, transport copy, and fallback note messaging", () => {
    expect(mimeTypeFromPath("/music/demo.flac")).toBe("audio/flac");
    expect(mimeTypeFromPath("/music/demo.unknown")).toBe("audio/mpeg");
    expect(describeManagedAudioState("playing", en)).toBe(en.inspect.playbackPlaying);
    expect(
      resolveManagedAudioNote({
        audioPath: null,
        blobReady: false,
        playbackState: "idle",
        missingNote: "Missing",
        browserFallbackNote: "Fallback",
        desktopOnlyNote: "Desktop",
        availableNote: "Ready",
      }),
    ).toBe("Missing");
    expect(
      resolveManagedAudioNote({
        audioPath: "browser-fallback://preview.mp3",
        blobReady: false,
        playbackState: "unavailable",
        missingNote: "Missing",
        browserFallbackNote: "Fallback",
        desktopOnlyNote: "Desktop",
        availableNote: "Ready",
      }),
    ).toBe("Fallback");
    expect(
      resolveManagedAudioNote({
        audioPath: "/music/demo.wav",
        blobReady: false,
        playbackState: "unavailable",
        missingNote: "Missing",
        browserFallbackNote: "Fallback",
        desktopOnlyNote: "Desktop",
        availableNote: "Ready",
      }),
    ).toBe("Desktop");
  });

  it("derives shown duration and scrubber range without UI branching", () => {
    expect(resolveManagedAudioShownDuration(93, 95)).toBe(93);
    expect(resolveManagedAudioShownDuration(0, 95)).toBe(95);
    expect(
      resolveManagedAudioScrubberRange({
        currentTimeSeconds: 120,
        shownDurationSeconds: 95,
      }),
    ).toEqual({
      max: 95,
      value: 95,
    });
  });
});
