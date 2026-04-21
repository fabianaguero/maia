# Implementation Plan: Audio Session Improvements

## Overview

Incremental implementation across four stack layers: Web Audio API crossfade engine in `MonitorContext.tsx`, source template forwarding through the poll loop, SQLite + Rust backend changes for `source_template_id`, and React UI additions for session cards, waveform bar, and replay notes cards. Property-based tests with fast-check cover all 11 correctness properties from the design.

## Tasks

- [ ] 1. Crossfade Engine (MonitorContext.tsx)
  - [~] 1.1 Define `CrossfadeHandle` interface and add `currentSegmentRef` / `pendingSegmentRef` refs
    - Add `CrossfadeHandle` interface (`gainNode: GainNode`, `source: AudioBufferSourceNode`, `scheduledEndTime: number`) inside `MonitorContext.tsx`
    - Add `currentSegmentRef: React.MutableRefObject<CrossfadeHandle | null>` initialized to `useRef(null)`
    - Add `pendingSegmentRef: React.MutableRefObject<AudioBuffer | null>` initialized to `useRef(null)`
    - _Requirements: 1.1, 1.2_

  - [~] 1.2 Implement `scheduleCrossfade` helper function
    - Accept `(ctx: AudioContext, blob: Blob, volume: number): Promise<void>`
    - Decode blob → `AudioBuffer` via `ctx.decodeAudioData`; on failure log and return (do not crash poll loop)
    - If `ctx.state === "suspended"`: store buffer in `pendingSegmentRef`, call `ctx.resume()`, on resolution play pending buffer immediately; if resume fails discard and log warning
    - If `currentSegmentRef.current` exists: schedule `outgoing.gainNode.gain.linearRampToValueAtTime(0, now + 0.12)`; set `startTime = Math.max(now, currentSegmentRef.current.scheduledEndTime - 0.020)`
    - Otherwise set `startTime = now`
    - Create incoming `GainNode`: `setValueAtTime(0, startTime)` then `linearRampToValueAtTime(volume, startTime + 0.12)`
    - Call `source.start(startTime)`; set `currentSegmentRef.current = { gainNode, source, scheduledEndTime: startTime + audioBuffer.duration }`
    - _Requirements: 1.1, 1.2, 1.6, 1.7_

  - [~] 1.3 Replace `playWavBlobWithContext` calls for guide track segments with `scheduleCrossfade`
    - Locate all call sites in the poll loop (`emitUpdate`) where a guide track WAV blob is played
    - Replace each with `await scheduleCrossfade(ctx, blob, volume)`
    - Keep `playWavBlobWithContext` in place for synth fallback output (it is replaced separately in 1.4–1.5)
    - _Requirements: 1.1, 1.2_

  - [~] 1.4 Wire synth→guide crossfade path
    - When `guideTrackFinishedRef.current` transitions from `true` to `false` (new guide track loaded mid-session), call `scheduleCrossfade` for the first guide segment instead of `playWavBlobWithContext`
    - The outgoing synth segment is treated as `currentSegmentRef.current` if one exists; otherwise start time is `now`
    - _Requirements: 1.4_

  - [~] 1.5 Wire guide→synth crossfade path and cursor-exhaustion pre-slice
    - When `sliceGuideTrackBar` returns `null` (cursor exhausted): call `advanceGuideTrack()` synchronously; if no next track set `guideTrackFinishedRef.current = true`
    - When guide track is cleared (`setGuideTrack(null)` while a segment is playing): fade out `currentSegmentRef.current.gainNode` over 120 ms (`linearRampToValueAtTime(0, now + 0.12)`) before switching to synth fallback
    - _Requirements: 1.3, 1.5_

  - [~] 1.6 Write property test for crossfade scheduling overlap (Property 1)
    - **Property 1: Crossfade scheduling overlap**
    - Generate random `segmentDuration` (1.0–8.0 s), `currentTime` (0–3600 s), `previousEndTime` (`currentTime` to `currentTime + 10 s`)
    - Assert `incomingStartTime <= previousEndTime - 0.020`
    - Use a mock `AudioContext` with controllable `currentTime`
    - **Validates: Requirements 1.1**

  - [~] 1.7 Write property test for crossfade ramp correctness (Property 2)
    - **Property 2: Crossfade ramp correctness**
    - Generate random `volume` (0.0–1.0), `currentTime` (0–3600 s)
    - Assert outgoing gain ramp target is `0` at `currentTime + 0.12`; incoming gain starts at `0` and ramps to `volume` at `startTime + 0.12`
    - Use a mock `AudioContext` with a spy `GainNode` that records scheduled calls
    - **Validates: Requirements 1.2, 1.4, 1.5**

- [ ] 2. Source Template Forwarding (MonitorContext.tsx)
  - [~] 2.1 Add `activeTemplateRef` and `setActiveTemplate` to `MonitorProvider`
    - Import `resolveSourceTemplate`, `DEFAULT_SOURCE_TEMPLATE_ID`, `SourceTemplate` from `../../config/sourceTemplates`
    - Add `activeTemplateRef: React.MutableRefObject<SourceTemplate>` initialized to `useRef(resolveSourceTemplate(DEFAULT_SOURCE_TEMPLATE_ID))`
    - Implement `setActiveTemplate(id: string)`: calls `resolveSourceTemplate(id)` and writes result to `activeTemplateRef.current` (no DB write, no session restart)
    - _Requirements: 2.4, 2.5, 2.7_

  - [~] 2.2 Add `sourceTemplateId` to `StartSessionInput` (library.ts) and `CreateSessionInput` / `PersistedSession` (sessions.ts)
    - In `desktop/src/types/library.ts`: add `sourceTemplateId?: string` to `StartSessionInput`
    - In `desktop/src/api/sessions.ts`: add `sourceTemplateId?: string` to `CreateSessionInput`
    - In `desktop/src/api/sessions.ts`: add `sourceTemplateId: string | null` to `PersistedSession`
    - _Requirements: 2.6, 3.2_

  - [~] 2.3 Initialize `activeTemplateRef` at session start and expose `activeTemplate` / `setActiveTemplate` on context value
    - In `startSession`: read `input.sourceTemplateId`, call `resolveSourceTemplate(input.sourceTemplateId)`, store in `activeTemplateRef.current`
    - Add `activeTemplate: SourceTemplate` (derived from `activeTemplateRef.current`) and `setActiveTemplate` to `MonitorContextValue` interface and the value object returned by `MonitorProvider`
    - _Requirements: 2.1, 2.2, 2.3, 2.7_

  - [~] 2.4 Wire `activeTemplateRef` values into `renderSynthFallback` and sonification scene resolver inside `emitUpdate`
    - Pass `activeTemplateRef.current.bpm` as the `bpm` argument to `renderSynthFallback` on every poll cycle
    - Pass `activeTemplateRef.current.styleProfileId` and `activeTemplateRef.current.mutationProfileId` to the sonification scene resolver (`resolveLiveSonificationScene` or equivalent) on every poll cycle
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [~] 2.5 Write property test for template values forwarded on every poll (Property 3)
    - **Property 3: Template values forwarded on every poll**
    - Generate a random `SourceTemplate` from `SOURCE_TEMPLATES`
    - Mock `renderSynthFallback` and the scene resolver; assert each receives the correct `bpm`, `styleProfileId`, `mutationProfileId` from `activeTemplateRef` on every poll
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.7**

  - [~] 2.6 Write property test for mid-session template switch (Property 4)
    - **Property 4: Mid-session template switch takes effect on next poll**
    - Generate two distinct templates A and B
    - Assert poll N uses A's values; after `setActiveTemplate(B.id)`, poll N+1 uses B's values
    - **Validates: Requirements 2.5**

- [~] 3. Checkpoint — crossfade + template forwarding
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. DB + Rust Backend
  - [~] 4.1 Add `ALTER TABLE` migration for `source_template_id`
    - In the Rust startup schema execution path (alongside `SCHEMA_SQL`), add: `ALTER TABLE sessions ADD COLUMN source_template_id TEXT;`
    - Wrap in a Rust helper that catches `rusqlite::Error::SqliteFailure` where the message contains `"duplicate column name"` and treats it as a no-op; propagate all other errors to prevent app startup
    - _Requirements: 3.1_

  - [~] 4.2 Update Rust structs `PersistedSession` and `CreateSessionInput`
    - Add `pub source_template_id: Option<String>` to both `PersistedSession` and `CreateSessionInput` structs in `main.rs`
    - _Requirements: 3.2, 3.3_

  - [~] 4.3 Update `db_create_session` INSERT and `row_to_persisted_session` SELECT
    - Extend the INSERT statement in `db_create_session` to include `source_template_id` bound to `input.source_template_id`
    - In `row_to_persisted_session`, read the new column (index 20 or by name) and map it to `source_template_id`
    - _Requirements: 3.3_

  - [~] 4.4 Update `db_list_sessions` and `db_get_session` SELECT queries
    - Extend both SELECT queries with `s.source_template_id` so the column is returned in all read paths
    - _Requirements: 3.2_

  - [~] 4.5 Write property test for session creation round-trip (Property 5)
    - **Property 5: Session creation round-trip preserves sourceTemplateId**
    - Generate random `sourceTemplateId` (valid template ID, `null`, arbitrary string)
    - Use an in-memory SQLite database (`:memory:`) via the Rust test harness or a TypeScript integration test
    - Assert `createPersistedSession({ ..., sourceTemplateId })` → `getPersistedSession(id)` returns `sourceTemplateId` unchanged
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 5. Session Card UI (SessionScreen.tsx)
  - [~] 5.1 Implement `resolveSessionTemplateLabel` helper
    - Add `function resolveSessionTemplateLabel(id: string | null): string` in `SessionScreen.tsx`
    - Return `SOURCE_TEMPLATES.find(t => t.id === id)?.label` when found, `"No template"` when `id` is `null`, `"Unknown template"` when `id` is a non-null string not in `SOURCE_TEMPLATES`
    - _Requirements: 3.5, 3.6_

  - [~] 5.2 Add BPM chip and template chip to `session-card-metrics`
    - In the session card render, add a BPM chip: `session.lastBpm != null ? \`${Math.round(session.lastBpm)} BPM\` : "— BPM"`
    - Add a template chip using `resolveSessionTemplateLabel(session.sourceTemplateId)`
    - Both chips must be visible without expanding the session detail panel
    - _Requirements: 3.4, 3.5, 3.6, 3.7_

  - [~] 5.3 Write property test for session card BPM formatting (Property 6)
    - **Property 6: Session card BPM formatting**
    - Generate random `lastBpm` (positive float, 0, null)
    - Assert output matches `"${Math.round(lastBpm)} BPM"` when non-null, `"— BPM"` when null
    - **Validates: Requirements 3.4**

  - [~] 5.4 Write property test for session card template label resolution (Property 7)
    - **Property 7: Session card template label resolution**
    - Generate random string (may or may not be a valid template ID) and null
    - Assert output is one of `template.label`, `"No template"`, or `"Unknown template"` per the rules
    - **Validates: Requirements 3.5, 3.6**

- [ ] 6. Waveform Bar Template Chip (MonitorWaveformBar.tsx)
  - [~] 6.1 Implement `TemplateIndicatorChip` sub-component
    - Add `function TemplateIndicatorChip({ template, liveBpm }: { template: SourceTemplate | null; liveBpm: number | null })` inside `MonitorWaveformBar.tsx`
    - When `template` is null: render `<span className="template-chip">Synth Default</span>`
    - Otherwise: render `<span className="template-chip template-chip--active">{template.icon} {template.genre} · {template.bpm} BPM{showLive ? \` → ${Math.round(liveBpm!)} live\` : ""}</span>`
    - `showLive` is true when `liveBpm != null && Math.abs(liveBpm - template.bpm) > 5`
    - _Requirements: 4.1, 4.2, 4.3_

  - [~] 6.2 Wire `monitor.activeTemplate` and `liveBpm` into `MonitorWaveformBar`
    - Read `monitor.activeTemplate` from `useMonitor()`
    - Track the latest `suggestedBpm` from the subscribed update stream in a local `useState`
    - Render `<TemplateIndicatorChip template={monitor.activeTemplate ?? null} liveBpm={latestBpm} />` inside `monitor-header-controls`, to the left of the LISTENING BED selector
    - Only render the chip when `hasSession` is true
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [~] 6.3 Write property test for template chip content correctness (Property 8)
    - **Property 8: Template chip content correctness**
    - Generate random `SourceTemplate` and random `liveBpm` (positive float or null)
    - Assert chip text contains `template.icon`, `template.genre`, `template.bpm`; live BPM suffix present iff `|liveBpm - template.bpm| > 5`
    - Assert `"Synth Default"` when template is null
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [~] 7. Checkpoint — backend + UI chips
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Replay Notes Enrichment (SessionScreen.tsx + ReplayFeedbackSummaryCard.tsx)
  - [~] 8.1 Define `BookmarkContext` interface and implement `resolveBookmarkContext` helper
    - Add `interface BookmarkContext { bpm: number | null; dominantLevel: string | null; anomalyCount: number | null; logExcerpt: string | null; }` in `SessionScreen.tsx`
    - Implement `resolveBookmarkContext(bookmark: SessionBookmark, events: SessionEvent[]): BookmarkContext`
    - When `bookmark.eventIndex == null`: return all-null context
    - When `events[bookmark.eventIndex]` is undefined: return all-null context
    - Parse `event.parsedLinesJson` with try/catch; on failure set `logExcerpt` to `null`
    - Return `{ bpm: event.suggestedBpm, dominantLevel: event.dominantLevel || null, anomalyCount: event.anomalyCount, logExcerpt: lines[0]?.slice(0, 120) ?? null }`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [~] 8.2 Pass `SessionEvent[]` to bookmark rendering in `SessionScreen`
    - Ensure `replayEventsRef.current` (already loaded during playback) is accessible in the bookmark rendering section
    - Build a `bookmarkContexts: Record<number, BookmarkContext>` map by calling `resolveBookmarkContext` for each bookmark in `selectedSessionBookmarks`
    - Pass `bookmarkContexts` down to `ReplayFeedbackSummaryCard` as a prop
    - _Requirements: 5.7_

  - [~] 8.3 Render the 4-field context sub-row in `ReplayFeedbackSummaryCard`
    - Add optional `bookmarkContexts?: Record<number, BookmarkContext>` prop to `ReplayFeedbackSummaryCard`
    - For each bookmark card, look up `bookmarkContexts?.[bookmark.id]`
    - Render a visually distinct sub-row below the existing label/note fields with four fields:
      - BPM: `ctx.bpm != null ? \`${Math.round(ctx.bpm)} BPM\` : "— BPM"`
      - Level: title-cased `ctx.dominantLevel` or `"—"` when null/empty
      - Anomalies: `\`${ctx.anomalyCount ?? 0} anomalies\``
      - Excerpt: `ctx.logExcerpt ?? "No log excerpt available"`
    - When `bookmarkContexts` is not provided or the bookmark ID is not found, show `"—"` for all four fields
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8_

  - [~] 8.4 Write property test for bookmark BPM formatting (Property 9)
    - **Property 9: Bookmark BPM formatting**
    - Generate random `suggestedBpm` (positive float, 0, null)
    - Assert output matches `"${Math.round(bpm)} BPM"` when non-null, `"— BPM"` when null
    - **Validates: Requirements 5.1**

  - [~] 8.5 Write property test for dominant level title-casing (Property 10)
    - **Property 10: Dominant level title-casing**
    - Generate random string (lowercase, uppercase, hyphenated, empty, null)
    - Assert output is title-cased or `"—"` for null/empty
    - **Validates: Requirements 5.2**

  - [ ] 8.6 Write property test for log excerpt truncation (Property 11)
    - **Property 11: Log excerpt truncation**
    - Generate random string of length 0–500
    - Assert `excerpt.length <= 120` and `excerpt === line` when `line.length <= 120`
    - **Validates: Requirements 5.4, 5.5**

- [ ] 9. Property-Based Tests — fast-check setup and all 11 properties
  - [ ] 9.1 Add fast-check as a dev dependency and create the test file
    - Run `npm install --save-dev fast-check` in `desktop/`
    - Create `desktop/src/__tests__/audioSessionImprovements.pbt.test.ts`
    - Configure minimum 100 iterations per property (`numRuns: 100`)
    - _Requirements: all_

  - [ ] 9.2 Implement Property 1 — crossfade scheduling overlap
    - **Property 1: Crossfade scheduling overlap**
    - `fc.float({ min: 1.0, max: 8.0 })` for `segmentDuration`, `fc.float({ min: 0, max: 3600 })` for `currentTime`, derive `previousEndTime` in range `[currentTime, currentTime + 10]`
    - Assert `incomingStartTime <= previousEndTime - 0.020`
    - **Validates: Requirements 1.1**

  - [ ] 9.3 Implement Property 2 — crossfade ramp correctness
    - **Property 2: Crossfade ramp correctness**
    - `fc.float({ min: 0, max: 1 })` for `volume`, `fc.float({ min: 0, max: 3600 })` for `currentTime`
    - Use a mock `GainNode` that records `setValueAtTime` and `linearRampToValueAtTime` calls
    - Assert outgoing ramp to `0` at `currentTime + 0.12`; incoming `setValueAtTime(0, startTime)` and `linearRampToValueAtTime(volume, startTime + 0.12)`
    - **Validates: Requirements 1.2, 1.4, 1.5**

  - [ ] 9.4 Implement Property 3 — template values forwarded on every poll
    - **Property 3: Template values forwarded on every poll**
    - `fc.constantFrom(...SOURCE_TEMPLATES)` for template
    - Mock `renderSynthFallback` and scene resolver; assert `bpm`, `styleProfileId`, `mutationProfileId` match `activeTemplate` on each poll
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.7**

  - [ ] 9.5 Implement Property 4 — mid-session template switch
    - **Property 4: Mid-session template switch takes effect on next poll**
    - `fc.tuple(fc.constantFrom(...SOURCE_TEMPLATES), fc.constantFrom(...SOURCE_TEMPLATES)).filter(([a, b]) => a.id !== b.id)`
    - Assert poll N uses A's values; after `setActiveTemplate(B.id)`, poll N+1 uses B's values
    - **Validates: Requirements 2.5**

  - [ ] 9.6 Implement Property 5 — session creation round-trip
    - **Property 5: Session creation round-trip preserves sourceTemplateId**
    - `fc.option(fc.oneof(fc.constantFrom(...SOURCE_TEMPLATES.map(t => t.id)), fc.string()))` for `sourceTemplateId`
    - Use in-memory SQLite; assert read-back value equals written value
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ] 9.7 Implement Property 6 — session card BPM formatting
    - **Property 6: Session card BPM formatting**
    - `fc.option(fc.float({ min: 0, max: 300 }))` for `lastBpm`
    - Assert `formatBpm(null) === "— BPM"` and `formatBpm(v) === \`${Math.round(v)} BPM\``
    - **Validates: Requirements 3.4**

  - [ ] 9.8 Implement Property 7 — session card template label resolution
    - **Property 7: Session card template label resolution**
    - `fc.option(fc.oneof(fc.constantFrom(...SOURCE_TEMPLATES.map(t => t.id)), fc.string()))` for `sourceTemplateId`
    - Assert result is one of `template.label`, `"No template"`, or `"Unknown template"` per the three-way rule
    - **Validates: Requirements 3.5, 3.6**

  - [ ] 9.9 Implement Property 8 — template chip content correctness
    - **Property 8: Template chip content correctness**
    - `fc.option(fc.constantFrom(...SOURCE_TEMPLATES))` for template, `fc.option(fc.float({ min: 60, max: 200 }))` for `liveBpm`
    - Assert chip text rules: icon+genre+bpm present when template non-null; `"Synth Default"` when null; live suffix iff `|liveBpm - template.bpm| > 5`
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ] 9.10 Implement Property 9 — bookmark BPM formatting
    - **Property 9: Bookmark BPM formatting**
    - Same generator as Property 6 applied to `suggestedBpm`
    - Assert same formatting rule
    - **Validates: Requirements 5.1**

  - [ ] 9.11 Implement Property 10 — dominant level title-casing
    - **Property 10: Dominant level title-casing**
    - `fc.option(fc.oneof(fc.string(), fc.constant(""), fc.constantFrom("error", "warn", "info", "debug")))` for `dominantLevel`
    - Assert title-cased output or `"—"` for null/empty
    - **Validates: Requirements 5.2**

  - [ ] 9.12 Implement Property 11 — log excerpt truncation
    - **Property 11: Log excerpt truncation**
    - `fc.string({ maxLength: 500 })` for log line
    - Assert `excerpt.length <= 120` and `excerpt === line` when `line.length <= 120`
    - **Validates: Requirements 5.4, 5.5**

- [ ] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints at tasks 3, 7, and 10 ensure incremental validation
- Property tests use fast-check with a minimum of 100 iterations each
- The `scheduleCrossfade` function replaces `playWavBlobWithContext` only on the guide track path; synth fallback continues using the existing function until tasks 1.4–1.5
- `activeTemplateRef` is a ref (not state) so template reads inside the poll loop closure never cause re-renders
- The DB migration is idempotent via the "duplicate column name" error catch — safe to run on every app startup
