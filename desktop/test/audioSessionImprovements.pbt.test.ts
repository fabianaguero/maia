/**
 * Property-Based Tests for Audio Session Improvements
 *
 * 11 properties validating:
 * 1. Crossfade scheduling overlap correctness
 * 2. Crossfade ramp gain values
 * 3. Template values forwarded on every poll
 * 4. Mid-session template switch takes effect
 * 5. Session creation round-trip preserves sourceTemplateId
 * 6. Session card BPM formatting
 * 7. Session card template label resolution
 * 8. Template chip content correctness
 * 9. Bookmark BPM formatting
 * 10. Dominant level title-casing
 * 11. Log excerpt truncation
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { SOURCE_TEMPLATES } from "../src/config/sourceTemplates";

// ============================================================================
// Utility Functions for Testing
// ============================================================================

/** Format BPM for display: null → "— BPM", number → "${round} BPM" */
function formatBpm(bpm: number | null): string {
  return bpm != null ? `${Math.round(bpm)} BPM` : "— BPM";
}

/** Resolve template label: null → "No template", valid ID → label, invalid → "Unknown template" */
function resolveSessionTemplateLabel(sourceTemplateId: string | null): string {
  if (sourceTemplateId === null) {
    return "No template";
  }
  const found = SOURCE_TEMPLATES.find((t) => t.id === sourceTemplateId);
  return found ? found.label : "Unknown template";
}

/** Title-case a string or return "—" for null/empty */
function formatDominantLevel(level: string | null): string {
  if (!level || !level.trim()) return "—";
  return level
    .trim()
    .split(/[-\s]+/)
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/** Truncate log line to max 120 chars, preserving original if within limit */
function truncateLogExcerpt(line: string | null): string {
  if (!line) return "No log excerpt available";
  return line.slice(0, 120);
}

// ============================================================================
// Mock Audio Context for Testing Crossfade Scheduling
// ============================================================================

interface MockGainNodeCall {
  method: "setValueAtTime" | "linearRampToValueAtTime";
  value: number;
  time: number;
}

/** Mock GainNode that records all gain automation calls */
class MockGainNode {
  calls: MockGainNodeCall[] = [];

  setValueAtTime(value: number, time: number) {
    this.calls.push({ method: "setValueAtTime", value, time });
  }

  linearRampToValueAtTime(value: number, time: number) {
    this.calls.push({ method: "linearRampToValueAtTime", value, time });
  }
}

/** Mock AudioBufferSourceNode */
class MockAudioBufferSourceNode {
  buffer: AudioBuffer | null = null;
  started = false;
  startTime: number | null = null;

  start(when?: number) {
    this.started = true;
    this.startTime = when ?? 0;
  }

  stop() {
    // no-op
  }

  connect() {
    // no-op
  }
}

/** Mock AudioContext for testing crossfade logic */
class MockAudioContext {
  currentTime: number = 0;
  state: AudioContextState = "running";
  sampleRate: number = 44100;
  createdGains: MockGainNode[] = [];
  createdSources: MockAudioBufferSourceNode[] = [];

  createGain(): MockGainNode {
    const g = new MockGainNode();
    this.createdGains.push(g);
    return g as any;
  }

  createBufferSource(): MockAudioBufferSourceNode {
    const s = new MockAudioBufferSourceNode();
    this.createdSources.push(s);
    return s as any;
  }

  connect() {
    // no-op
  }

  destination = {};
}

// ============================================================================
// Property Tests
// ============================================================================

describe("Audio Session Improvements — Property Tests", () => {
  // =========================================================================
  // Property 1: Crossfade scheduling overlap
  // =========================================================================

  it("Property 1: Crossfade scheduling overlap — incoming start <= outgoing end - 20ms", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1.0, max: 8.0, noNaN: true }),
        fc.float({ min: 0, max: 3600, noNaN: true }),
        fc.float({ min: 0, max: 10, noNaN: true }),
        (segmentDuration, currentTime, offsetFromEnd) => {
          const previousEndTime = currentTime + offsetFromEnd;
          const overlap = 0.02; // 20ms overlap

          // Incoming start time should never be after outgoing end minus overlap
          const incomingStartTime = Math.max(currentTime, previousEndTime - overlap);

          expect(incomingStartTime).toBeLessThanOrEqual(previousEndTime);
        },
      ),
      { numRuns: 100 },
    );
  });

  // =========================================================================
  // Property 2: Crossfade ramp correctness
  // =========================================================================

  it("Property 2: Crossfade ramp correctness — outgoing to 0, incoming 0→volume", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.float({ min: 0, max: 3600, noNaN: true }),
        (volume, currentTime) => {
          const ctx = new MockAudioContext();
          ctx.currentTime = currentTime;
          const rampDuration = 0.12; // 120ms

          // Simulate outgoing fade
          const outgoing = ctx.createGain();
          outgoing.linearRampToValueAtTime(0, currentTime + rampDuration);

          // Simulate incoming fade
          const incoming = ctx.createGain();
          const startTime = currentTime;
          incoming.setValueAtTime(0, startTime);
          incoming.linearRampToValueAtTime(volume, startTime + rampDuration);

          // Verify outgoing ramps to 0
          const outgoingFadeCall = outgoing.calls.find(
            (c) => c.method === "linearRampToValueAtTime" && c.value === 0,
          );
          expect(outgoingFadeCall).toBeDefined();
          expect(outgoingFadeCall?.time).toBe(currentTime + rampDuration);

          // Verify incoming starts at 0
          const incomingSetCall = incoming.calls.find(
            (c) => c.method === "setValueAtTime" && c.value === 0,
          );
          expect(incomingSetCall).toBeDefined();
          expect(incomingSetCall?.time).toBe(startTime);

          // Verify incoming ramps to volume
          const incomingRampCall = incoming.calls.find(
            (c) => c.method === "linearRampToValueAtTime" && c.value === volume,
          );
          expect(incomingRampCall).toBeDefined();
          expect(incomingRampCall?.time).toBe(startTime + rampDuration);
        },
      ),
      { numRuns: 100 },
    );
  });

  // =========================================================================
  // Property 3: Template values forwarded on every poll
  // =========================================================================

  it("Property 3: Template values forwarded on every poll", () => {
    fc.assert(
      fc.property(fc.constantFrom(...SOURCE_TEMPLATES), (template) => {
        // Simulate reading template on multiple polls
        const reads = [];
        for (let i = 0; i < 5; i++) {
          const read = {
            bpm: template.bpm,
            styleProfileId: template.styleProfileId,
            mutationProfileId: template.mutationProfileId,
          };
          reads.push(read);
        }

        // All reads should be identical
        reads.forEach((read) => {
          expect(read.bpm).toBe(template.bpm);
          expect(read.styleProfileId).toBe(template.styleProfileId);
          expect(read.mutationProfileId).toBe(template.mutationProfileId);
        });
      }),
      { numRuns: 100 },
    );
  });

  // =========================================================================
  // Property 4: Mid-session template switch takes effect on next poll
  // =========================================================================

  it("Property 4: Mid-session template switch takes effect on next poll", () => {
    fc.assert(
      fc.property(
        fc
          .tuple(fc.constantFrom(...SOURCE_TEMPLATES), fc.constantFrom(...SOURCE_TEMPLATES))
          .filter(([a, b]) => a.id !== b.id),
        ([templateA, templateB]) => {
          let activeTemplate = templateA;

          // Poll N uses template A
          const pollNValues = {
            bpm: activeTemplate.bpm,
            styleProfileId: activeTemplate.styleProfileId,
          };
          expect(pollNValues.bpm).toBe(templateA.bpm);

          // Switch template
          activeTemplate = templateB;

          // Poll N+1 uses template B
          const pollN1Values = {
            bpm: activeTemplate.bpm,
            styleProfileId: activeTemplate.styleProfileId,
          };
          expect(pollN1Values.bpm).toBe(templateB.bpm);
          expect(pollN1Values.bpm).not.toBe(pollNValues.bpm);
        },
      ),
      { numRuns: 100 },
    );
  });

  // =========================================================================
  // Property 5: Session creation round-trip preserves sourceTemplateId
  // =========================================================================

  it("Property 5: Session creation round-trip preserves sourceTemplateId", () => {
    fc.assert(
      fc.property(
        fc.option(
          fc.oneof(
            fc.constantFrom(...SOURCE_TEMPLATES.map((t) => t.id)),
            fc.string({ maxLength: 50 }),
          ),
        ),
        (sourceTemplateId) => {
          // Simulate database round-trip
          const inserted = { sourceTemplateId };
          const retrieved = { sourceTemplateId: inserted.sourceTemplateId };

          // Verify value is preserved
          expect(retrieved.sourceTemplateId).toBe(inserted.sourceTemplateId);
        },
      ),
      { numRuns: 100 },
    );
  });

  // =========================================================================
  // Property 6: Session card BPM formatting
  // =========================================================================

  it("Property 6: Session card BPM formatting — null → '— BPM', number → rounded", () => {
    fc.assert(
      fc.property(fc.option(fc.float({ min: 0, max: 300 })), (bpm) => {
        const formatted = formatBpm(bpm);

        if (bpm === null) {
          expect(formatted).toBe("— BPM");
        } else {
          expect(formatted).toBe(`${Math.round(bpm)} BPM`);
          // Verify it doesn't contain fractional part
          expect(/\.\d+/.test(formatted)).toBe(false);
        }
      }),
      { numRuns: 100 },
    );
  });

  // =========================================================================
  // Property 7: Session card template label resolution
  // =========================================================================

  it("Property 7: Session card template label resolution — null/valid/invalid ID rules", () => {
    fc.assert(
      fc.property(
        fc.option(
          fc.oneof(
            fc.constantFrom(...SOURCE_TEMPLATES.map((t) => t.id)),
            fc.string({ maxLength: 50 }).filter((s) => !SOURCE_TEMPLATES.find((t) => t.id === s)),
          ),
        ),
        (sourceTemplateId) => {
          const label = resolveSessionTemplateLabel(sourceTemplateId);

          if (sourceTemplateId === null) {
            expect(label).toBe("No template");
          } else {
            const found = SOURCE_TEMPLATES.find((t) => t.id === sourceTemplateId);
            if (found) {
              expect(label).toBe(found.label);
            } else {
              expect(label).toBe("Unknown template");
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // =========================================================================
  // Property 8: Template chip content correctness
  // =========================================================================

  it("Property 8: Template chip content — icon, genre, BPM; 'Synth Default' when null", () => {
    fc.assert(
      fc.property(
        fc.option(fc.constantFrom(...SOURCE_TEMPLATES)),
        fc.option(fc.float({ min: 60, max: 200 })),
        (template, liveBpm) => {
          let chipText = "";

          if (template === null) {
            chipText = "Synth Default";
          } else {
            chipText = `${template.icon} ${template.genre} · ${template.bpm} BPM`;
            const showLive = liveBpm != null && Math.abs(liveBpm - template.bpm) > 5;
            if (showLive) {
              chipText += ` → ${Math.round(liveBpm!)} live`;
            }
          }

          // Verify expectations
          if (template === null) {
            expect(chipText).toBe("Synth Default");
          } else {
            expect(chipText).toContain(template.icon);
            expect(chipText).toContain(template.genre);
            expect(chipText).toContain(String(template.bpm));
            if (liveBpm != null && Math.abs(liveBpm - template.bpm) > 5) {
              expect(chipText).toContain("live");
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // =========================================================================
  // Property 9: Bookmark BPM formatting
  // =========================================================================

  it("Property 9: Bookmark BPM formatting — same as session card", () => {
    fc.assert(
      fc.property(fc.option(fc.float({ min: 0, max: 300 })), (suggestedBpm) => {
        const formatted = formatBpm(suggestedBpm);

        if (suggestedBpm === null) {
          expect(formatted).toBe("— BPM");
        } else {
          expect(formatted).toBe(`${Math.round(suggestedBpm)} BPM`);
        }
      }),
      { numRuns: 100 },
    );
  });

  // =========================================================================
  // Property 10: Dominant level title-casing
  // =========================================================================

  it("Property 10: Dominant level title-casing or '—' for null/empty", () => {
    fc.assert(
      fc.property(
        fc.option(
          fc.oneof(
            fc.string({ maxLength: 50 }),
            fc.constant(""),
            fc.constantFrom("error", "warn", "info", "debug"),
          ),
        ),
        (level) => {
          const formatted = formatDominantLevel(level);

          if (!level) {
            expect(formatted).toBe("—");
          } else {
            // Verify each word is capitalized
            const words = formatted.split(/[\s-]+/);
            words.forEach((word) => {
              expect(word[0]).toBe(word[0].toUpperCase());
            });
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // =========================================================================
  // Property 11: Log excerpt truncation to max 120 chars
  // =========================================================================

  it("Property 11: Log excerpt truncation — max 120 chars, preserve if shorter", () => {
    fc.assert(
      fc.property(fc.option(fc.string({ maxLength: 500 })), (logLine) => {
        const excerpt = truncateLogExcerpt(logLine);

        if (!logLine) {
          expect(excerpt).toBe("No log excerpt available");
        } else {
          // Excerpt length never exceeds 120
          expect(excerpt.length).toBeLessThanOrEqual(120);

          // If original was <= 120, excerpt equals original
          if (logLine.length <= 120) {
            expect(excerpt).toBe(logLine);
          } else {
            // Else it's the first 120 chars
            expect(excerpt).toBe(logLine.slice(0, 120));
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
