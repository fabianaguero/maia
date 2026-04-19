import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import type { LibraryTrack } from "../src/types/library";
import { TrackPlaybackPanel } from "../src/features/analyzer/components/TrackPlaybackPanel";
import { ManagedAudioPlayer } from "../src/features/analyzer/components/ManagedAudioPlayer";

/**
 * Simplified test suite for audio playback functionality.
 * Each test is self-contained to avoid DOM conflicts.
 */

describe("Audio Playback Components", () => {
  beforeEach(() => {
    // Setup URL mocks if needed
    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = () => "blob:mock-url";
    }
    if (!globalThis.URL.revokeObjectURL) {
      globalThis.URL.revokeObjectURL = () => {};
    }
  });

  afterEach(() => {
    cleanup();
  });

  describe("ManagedAudioPlayer", () => {
    it("should render without crashing", () => {
      const { getByText } = render(
        <ManagedAudioPlayer
          title="My Audio"
          description="Playback test"
          audioPath={null}
          durationSeconds={null}
          playLabel="Play"
          pauseLabel="Pause"
          missingNote="Not available"
          browserFallbackNote="Browser only"
          desktopOnlyNote="Desktop required"
          availableNote="Ready"
          errorNote="Error occurred"
        />
      );

      expect(getByText("My Audio")).toBeTruthy();
    });

    it("should show missing state when no audio path", () => {
      const { getByText } = render(
        <ManagedAudioPlayer
          title="Track"
          description="Test"
          audioPath={null}
          durationSeconds={180}
          playLabel="Play"
          pauseLabel="Pause"
          missingNote="Audio not found"
          browserFallbackNote="Browser only"
          desktopOnlyNote="Desktop required"
          availableNote="Ready"
          errorNote="Error occurred"
        />
      );

      expect(getByText("Audio not found")).toBeTruthy();
    });

    it("should contain audio element", () => {
      const { container } = render(
        <ManagedAudioPlayer
          title="Track"
          description="Test"
          audioPath={null}
          durationSeconds={180}
          playLabel="Play"
          pauseLabel="Pause"
          missingNote="Missing"
          browserFallbackNote="Browser only"
          desktopOnlyNote="Desktop required"
          availableNote="Ready"
          errorNote="Error occurred"
        />
      );

      const audioEl = container.querySelector("audio");
      expect(audioEl).toBeTruthy();
    });

    it("should have play button", () => {
      const { container } = render(
        <ManagedAudioPlayer
          title="Track"
          description="Test"
          audioPath={null}
          durationSeconds={180}
          playLabel="Play"
          pauseLabel="Pause"
          missingNote="Missing"
          browserFallbackNote="Browser only"
          desktopOnlyNote="Desktop required"
          availableNote="Ready"
          errorNote="Error occurred"
        />
      );

      const button = container.querySelector(".action");
      expect(button).toBeTruthy();
    });

    it("should have volume slider", () => {
      const { container } = render(
        <ManagedAudioPlayer
          title="Track"
          description="Test"
          audioPath={null}
          durationSeconds={180}
          playLabel="Play"
          pauseLabel="Pause"
          missingNote="Missing"
          browserFallbackNote="Browser only"
          desktopOnlyNote="Desktop required"
          availableNote="Ready"
          errorNote="Error occurred"
        />
      );

      const volumeSlider = container.querySelector(".volume-slider");
      expect(volumeSlider).toBeTruthy();
    });

    it("should have scrubber control", () => {
      const { container } = render(
        <ManagedAudioPlayer
          title="Track"
          description="Test"
          audioPath={null}
          durationSeconds={180}
          playLabel="Play"
          pauseLabel="Pause"
          missingNote="Missing"
          browserFallbackNote="Browser only"
          desktopOnlyNote="Desktop required"
          availableNote="Ready"
          errorNote="Error occurred"
        />
      );

      const scrubber = container.querySelector(".render-audio-scrubber");
      expect(scrubber).toBeTruthy();
    });
  });

  describe("TrackPlaybackPanel", () => {
    const createMockTrack = (): LibraryTrack => ({
      id: "test-1",
      tags: {
        title: "Test Track",
        musicStyleId: "house",
        musicStyleLabel: "House",
      },
      analysis: {
        importedAt: new Date().toISOString(),
        durationSeconds: 240,
        bpm: 128,
        bpmConfidence: 0.95,
        keySignature: "C",
        energyLevel: 0.8,
        danceability: 0.9,
        beatGridPoints: [],
        bpmCurve: [],
        structuralPatterns: [],
        waveformBins: new Array(100).fill(0.5),
      },
      file: {
        sourcePath: "/path/test.mp3",
        storagePath: null,
        fileExtension: ".mp3",
        playbackSource: "source_file",
      },
      performance: {
        rating: null,
        hotCuePoints: [],
        mainCuePoints: [],
        memoryCuePoints: [],
        savedLoops: [],
        primaryColor: null,
        secondaryColor: null,
      },
    });

    it("should render track panel", () => {
      const track = createMockTrack();
      const { container } = render(
        <TrackPlaybackPanel
          track={track}
          onStateChange={() => {}}
          onCueRequest={() => {}}
        />
      );

      // Component should render without crashing
      expect(container).toBeTruthy();
      expect(container.querySelector("section")).toBeTruthy();
    });

    it("should handle null source path", () => {
      const track = createMockTrack();
      track.file.sourcePath = null as any;

      const { container } = render(
        <TrackPlaybackPanel
          track={track}
          onStateChange={() => {}}
          onCueRequest={() => {}}
        />
      );

      // Should render without crashing
      expect(container).toBeTruthy();
    });
  });

  describe("Audio Component Structure", () => {
    it("should have status display", () => {
      const { container } = render(
        <ManagedAudioPlayer
          title="Track"
          description="Test"
          audioPath={null}
          durationSeconds={180}
          playLabel="Play"
          pauseLabel="Pause"
          missingNote="Missing"
          browserFallbackNote="Browser only"
          desktopOnlyNote="Desktop required"
          availableNote="Ready"
          errorNote="Error occurred"
        />
      );

      const status = container.querySelector(".render-audio-status");
      expect(status).toBeTruthy();
    });

    it("should have controls display", () => {
      const { container } = render(
        <ManagedAudioPlayer
          title="Track"
          description="Test"
          audioPath={null}
          durationSeconds={180}
          playLabel="Play"
          pauseLabel="Pause"
          missingNote="Missing"
          browserFallbackNote="Browser only"
          desktopOnlyNote="Desktop required"
          availableNote="Ready"
          errorNote="Error occurred"
        />
      );

      const controls = container.querySelector(".render-audio-controls");
      expect(controls).toBeTruthy();
    });

    it("should have note display", () => {
      const { container } = render(
        <ManagedAudioPlayer
          title="Track"
          description="Test"
          audioPath={null}
          durationSeconds={180}
          playLabel="Play"
          pauseLabel="Pause"
          missingNote="Missing"
          browserFallbackNote="Browser only"
          desktopOnlyNote="Desktop required"
          availableNote="Ready"
          errorNote="Error occurred"
        />
      );

      const note = container.querySelector(".render-audio-note");
      expect(note).toBeTruthy();
    });
  });
});
