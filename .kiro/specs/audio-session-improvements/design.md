# Design Document: Audio Session Improvements

## Overview

This document covers the technical design for five targeted improvements to the MAIA desktop app's audio pipeline and session UX:

1. **Guide Track Crossfade Engine** — eliminate audible gaps between consecutive guide track segments using Web Audio API scheduling and linear GainNode ramps.
2. **Source Template Forwarding** — wire `SourceTemplate` metadata (BPM, styleProfileId, mutationProfileId) into `MonitorContext` so the synth fallback and sonification scene resolver use the correct values from session start.
3. **Past Sessions BPM + Template Display** — persist `source_template_id` in SQLite and surface it alongside `last_bpm` on session cards.
4. **Waveform Bar Template Indicator** — add a template chip to the `MonitorWaveformBar` header showing the active template's genre, BPM, and live signal BPM when they diverge.
5. **Replay Notes Context Enrichment** — enrich `ReplayFeedbackSummaryCard` bookmark cards with per-window BPM, dominant level, anomaly count, and log excerpt resolved from the in-memory `replayEventsRef`.

All work is scoped to the Tauri + React + TypeScript desktop shell and the SQLite local database. No cloud, no auth, no Python analyzer changes.

---

## Architecture

The five improvements touch four layers of the stack:

```
┌─────────────────────────────────────────────────────────────┐
│  React UI Layer                                             │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │ MonitorWaveformBar│  │ SessionScreen / Session Cards    │ │
│  │ (template chip)  │  │ (BPM + template label)           │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ ReplayFeedbackSummaryCard (enriched bookmark context)    ││
│  └──────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  MonitorContext (React Context + Refs)                      │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │ activeTemplateRef│  │ Crossfade Engine                 │ │
│  │ (SourceTemplate) │  │ (GainNode scheduling)            │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  TypeScript API Layer (sessions.ts / library.ts)            │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │ CreateSessionInput│  │ PersistedSession                 │ │
│  │ + sourceTemplateId│  │ + sourceTemplateId: string|null  │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Rust / SQLite Layer                                        │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ sessions table: ALTER TABLE ADD COLUMN source_template_id││
│  │ create_persisted_session / list_persisted_sessions       ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **No new IPC commands for crossfade.** The entire crossfade engine lives in `MonitorContext.tsx` using the existing `AudioContext`. This avoids Tauri round-trips on the hot audio path.
- **`activeTemplateRef` not state.** The resolved `SourceTemplate` is stored in a `useRef` so template reads inside the poll loop closure never cause re-renders and are always current.
- **Memory-only mid-session template switch.** Changing the template mid-session updates `activeTemplateRef` only; `source_template_id` in the DB is written once at session creation and never updated mid-session.
- **DB migration at startup with `IF NOT EXISTS` guard.** The `ALTER TABLE` runs alongside the existing `CREATE TABLE IF NOT EXISTS` schema at Tauri startup. The guard makes it idempotent.
- **Replay notes enrichment from `replayEventsRef`.** The `SessionEvent` list is already loaded into `replayEventsRef` during playback. The `ReplayFeedbackSummaryCard` receives the events array as a prop and does a simple index lookup — no extra IPC.

---

## Components and Interfaces

### 1. Crossfade Engine (MonitorContext.tsx)

A new internal helper `scheduleCrossfade` replaces the direct `playWavBlobWithContext` call for guide track segments. It manages two `GainNode`s — one for the outgoing segment and one for the incoming — and schedules `linearRampToValueAtTime` on both.

```typescript
interface CrossfadeHandle {
  gainNode: GainNode;
  source: AudioBufferSourceNode;
  scheduledEndTime: number; // AudioContext time when segment ends
}
```

The engine maintains a `currentSegmentRef: React.MutableRefObject<CrossfadeHandle | null>` alongside the existing `guideTrackCursorRef`.

**Scheduling flow:**

```
poll fires
  └─ sliceGuideTrackBar() → wav blob
       └─ scheduleCrossfade(ctx, wav, volume)
            ├─ decode wav → AudioBuffer
            ├─ if currentSegmentRef.current exists:
            │    outgoing.gain.linearRampToValueAtTime(0, now + 0.12)
            │    startTime = max(now, currentSegmentRef.current.scheduledEndTime - 0.020)
            └─ incoming.gain: setValueAtTime(0, startTime)
                              linearRampToValueAtTime(volume, startTime + 0.12)
               source.start(startTime)
               currentSegmentRef.current = { gainNode, source, scheduledEndTime: startTime + duration }
```

**Cursor exhaustion pre-slice:** After `sliceGuideTrackBar` returns `null`, the engine immediately calls `advanceGuideTrack()` synchronously (no timer wait). If no next track is queued, `guideTrackFinishedRef.current = true` and the synth fallback takes over via the existing crossfade path.

**Suspended AudioContext:** If `ctx.state === "suspended"` when `scheduleCrossfade` is called, the decoded `AudioBuffer` is stored in a `pendingSegmentRef`. A `ctx.resume()` call is attempted; on resolution, the pending segment is played immediately.

### 2. Source Template Forwarding (MonitorContext.tsx)

A new ref `activeTemplateRef: React.MutableRefObject<SourceTemplate>` is added to `MonitorProvider`. It is initialized to `resolveSourceTemplate(DEFAULT_SOURCE_TEMPLATE_ID)` and updated in two places:

- **At session start:** `startSession` reads `input.sourceTemplateId`, calls `resolveSourceTemplate(input.sourceTemplateId)`, and stores the result in `activeTemplateRef.current`.
- **Mid-session switch:** A new exported function `setActiveTemplate(id: string)` updates `activeTemplateRef.current` only (no DB write, no session restart).

The poll loop (`emitUpdate`) reads `activeTemplateRef.current` to supply `bpm` to `renderSynthFallback` and `styleProfileId`/`mutationProfileId` to the sonification scene resolver.

`MonitorContextValue` gains:
```typescript
activeTemplate: SourceTemplate;
setActiveTemplate: (id: string) => void;
```

### 3. Type Changes

**`StartSessionInput`** (`desktop/src/types/library.ts`):
```typescript
export interface StartSessionInput {
  // ... existing fields ...
  sourceTemplateId?: string; // new optional field
}
```

**`CreateSessionInput`** (`desktop/src/api/sessions.ts`):
```typescript
export interface CreateSessionInput {
  // ... existing fields ...
  sourceTemplateId?: string; // new optional field
}
```

**`PersistedSession`** (`desktop/src/api/sessions.ts`):
```typescript
export interface PersistedSession {
  // ... existing fields ...
  sourceTemplateId: string | null; // new field
}
```

### 4. Rust Backend Changes (main.rs)

**`PersistedSession` struct** gains:
```rust
pub source_template_id: Option<String>,
```

**`CreateSessionInput` struct** gains:
```rust
pub source_template_id: Option<String>,
```

**`db_create_session`** — INSERT statement extended to include `source_template_id`.

**`row_to_persisted_session`** — reads column index 20 for `source_template_id`.

**`db_get_session` / `db_list_sessions`** — SELECT queries extended with `s.source_template_id`.

### 5. DB Migration

Added to the startup schema execution path (alongside `SCHEMA_SQL`):

```sql
ALTER TABLE sessions ADD COLUMN source_template_id TEXT;
```

Wrapped in a Rust helper that catches the "duplicate column" error (SQLite error code 1 with message containing "duplicate column name") and treats it as a no-op, making the migration idempotent without requiring a separate migration table.

### 6. Session Card UI (SessionScreen.tsx)

Two new display elements added to `session-card-metrics`:

- **BPM chip:** `session.lastBpm != null ? `${Math.round(session.lastBpm)} BPM` : "— BPM"`
- **Template chip:** resolved via `resolveSourceTemplate(session.sourceTemplateId)` — shows `template.label` for known IDs, `"No template"` for null, `"Unknown template"` for unrecognized IDs (when `resolveSourceTemplate` returns the default but the stored ID doesn't match).

A helper `resolveSessionTemplateLabel(sourceTemplateId: string | null): string` encapsulates this logic:
```typescript
function resolveSessionTemplateLabel(id: string | null): string {
  if (id === null) return "No template";
  const found = SOURCE_TEMPLATES.find(t => t.id === id);
  if (!found) return "Unknown template";
  return found.label;
}
```

### 7. MonitorWaveformBar Template Chip (MonitorWaveformBar.tsx)

A new `TemplateIndicatorChip` sub-component rendered inside `monitor-header-controls`, to the left of the LISTENING BED selector:

```tsx
function TemplateIndicatorChip({ template, liveBpm }: {
  template: SourceTemplate | null;
  liveBpm: number | null;
}) {
  if (!template) return <span className="template-chip">Synth Default</span>;
  const bpmDiff = liveBpm != null ? Math.abs(liveBpm - template.bpm) : 0;
  const showLive = liveBpm != null && bpmDiff > 5;
  return (
    <span className="template-chip template-chip--active">
      {template.icon} {template.genre} · {template.bpm} BPM
      {showLive && ` → ${Math.round(liveBpm!)} live`}
    </span>
  );
}
```

`MonitorWaveformBar` reads `monitor.activeTemplate` and the latest `suggestedBpm` from the subscribed update stream.

### 8. Replay Notes Enrichment (ReplayFeedbackSummaryCard.tsx + SessionScreen.tsx)

`SessionScreen` passes the loaded `SessionEvent[]` array down to the bookmark rendering section. A new helper `resolveBookmarkContext` performs the in-memory lookup:

```typescript
function resolveBookmarkContext(
  bookmark: SessionBookmark,
  events: SessionEvent[],
): BookmarkContext {
  if (bookmark.eventIndex == null) {
    return { bpm: null, dominantLevel: null, anomalyCount: null, logExcerpt: null };
  }
  const event = events[bookmark.eventIndex] ?? null;
  if (!event) {
    return { bpm: null, dominantLevel: null, anomalyCount: null, logExcerpt: null };
  }
  const lines: string[] = JSON.parse(event.parsedLinesJson ?? "[]");
  return {
    bpm: event.suggestedBpm,
    dominantLevel: event.dominantLevel || null,
    anomalyCount: event.anomalyCount,
    logExcerpt: lines[0]?.slice(0, 120) ?? null,
  };
}
```

The `ReplayFeedbackSummaryCard` component gains a new optional `bookmarkContexts` prop that maps bookmark IDs to their resolved context, rendered as a sub-row below the existing label/note fields.

---

## Data Models

### SQLite Schema Delta

```sql
-- Run at Tauri startup; idempotent via error-catch in Rust
ALTER TABLE sessions ADD COLUMN source_template_id TEXT;
```

The `sessions` table after migration:

| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | unchanged |
| ... | ... | existing columns unchanged |
| last_bpm | REAL | existing |
| source_template_id | TEXT NULL | **new** — stores `SourceTemplate.id` at session creation |

### TypeScript Interfaces (delta only)

```typescript
// StartSessionInput (library.ts)
sourceTemplateId?: string;

// CreateSessionInput (sessions.ts)
sourceTemplateId?: string;

// PersistedSession (sessions.ts)
sourceTemplateId: string | null;

// MonitorContextValue (MonitorContext.tsx)
activeTemplate: SourceTemplate;
setActiveTemplate: (id: string) => void;

// New internal type (MonitorContext.tsx)
interface CrossfadeHandle {
  gainNode: GainNode;
  source: AudioBufferSourceNode;
  scheduledEndTime: number;
}

// New internal type (SessionScreen.tsx / ReplayFeedbackSummaryCard.tsx)
interface BookmarkContext {
  bpm: number | null;
  dominantLevel: string | null;
  anomalyCount: number | null;
  logExcerpt: string | null;
}
```

### Rust Struct Delta

```rust
// PersistedSession
pub source_template_id: Option<String>,

// CreateSessionInput
pub source_template_id: Option<String>,
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Crossfade scheduling overlap

*For any* segment duration and AudioContext `currentTime`, when `scheduleCrossfade` is called while a previous segment is still playing, the incoming segment's scheduled start time SHALL be no later than `previousSegment.scheduledEndTime - 0.020` seconds.

**Validates: Requirements 1.1**

---

### Property 2: Crossfade ramp correctness

*For any* target volume `v` and AudioContext `currentTime` `t`, when `scheduleCrossfade` is called with an outgoing segment and an incoming segment:
- The outgoing `GainNode` SHALL have `linearRampToValueAtTime(0, t + 0.12)` scheduled.
- The incoming `GainNode` SHALL have `setValueAtTime(0, startTime)` and `linearRampToValueAtTime(v, startTime + 0.12)` scheduled.

**Validates: Requirements 1.2, 1.4, 1.5**

---

### Property 3: Template values forwarded on every poll

*For any* `SourceTemplate` stored in `activeTemplateRef`, on every poll cycle:
- `renderSynthFallback` SHALL receive `bpm === activeTemplate.bpm`.
- The sonification scene resolver SHALL receive `styleProfileId === activeTemplate.styleProfileId` and `mutationProfileId === activeTemplate.mutationProfileId`.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.7**

---

### Property 4: Mid-session template switch takes effect on next poll

*For any* two templates A and B, if `setActiveTemplate(B.id)` is called between poll N and poll N+1, then poll N+1 SHALL use B's `bpm`, `styleProfileId`, and `mutationProfileId`, and poll N SHALL have used A's values.

**Validates: Requirements 2.5**

---

### Property 5: Session creation round-trip preserves sourceTemplateId

*For any* `sourceTemplateId` value (including `null`), creating a session via `createPersistedSession` and then reading it back via `getPersistedSession` or `listPersistedSessions` SHALL return a `PersistedSession` where `sourceTemplateId` equals the value that was written.

**Validates: Requirements 3.1, 3.2, 3.3**

---

### Property 6: Session card BPM formatting

*For any* `lastBpm` value (numeric or null), the session card BPM display SHALL produce `"${Math.round(lastBpm)} BPM"` when non-null, and `"— BPM"` when null.

**Validates: Requirements 3.4**

---

### Property 7: Session card template label resolution

*For any* `sourceTemplateId` value, the session card template label SHALL be:
- The matching `SourceTemplate.label` when the ID exists in `SOURCE_TEMPLATES`.
- `"No template"` when the ID is `null`.
- `"Unknown template"` when the ID is a non-null string not found in `SOURCE_TEMPLATES`.

**Validates: Requirements 3.5, 3.6**

---

### Property 8: Template chip content correctness

*For any* `SourceTemplate` and any `liveBpm` value, the template chip text SHALL:
- Contain `template.icon`, `template.genre`, and `template.bpm` when a template is active.
- Show `"Synth Default"` when no template is associated.
- Append `"→ N live"` (where N is `Math.round(liveBpm)`) when `|liveBpm - template.bpm| > 5`.
- Not append the live BPM suffix when `|liveBpm - template.bpm| <= 5` or when `liveBpm` is null.

**Validates: Requirements 4.1, 4.2, 4.3**

---

### Property 9: Bookmark BPM formatting

*For any* `suggestedBpm` value (numeric or null) on a `SessionEvent`, the replay notes card BPM display SHALL produce `"${Math.round(bpm)} BPM"` when non-null, and `"— BPM"` when null.

**Validates: Requirements 5.1**

---

### Property 10: Dominant level title-casing

*For any* `dominantLevel` string (including empty string and null), the replay notes card level display SHALL produce the title-cased form of the string (e.g. `"error"` → `"Error"`, `"warn"` → `"Warn"`), or `"—"` when the value is null or empty.

**Validates: Requirements 5.2**

---

### Property 11: Log excerpt truncation

*For any* log line string of length N, the displayed excerpt SHALL be `line.slice(0, 120)` — i.e., at most 120 characters — and SHALL equal the full string when `N <= 120`.

**Validates: Requirements 5.4, 5.5**

---

## Error Handling

### Crossfade Engine

- **`decodeAudioData` failure on incoming segment:** Log the error, skip the crossfade, fall back to `renderSynthFallback` for the current poll. Do not crash the poll loop.
- **`AudioContext` suspended at schedule time:** Store the decoded `AudioBuffer` in `pendingSegmentRef`. Call `ctx.resume()`. On resolution, play the pending segment immediately. If resume fails, discard the pending segment and log a warning.
- **`sliceGuideTrackBar` returns null (cursor exhausted):** Call `advanceGuideTrack()` synchronously. If no next track, set `guideTrackFinishedRef.current = true` and let the synth fallback take over via the normal crossfade path.

### Source Template Forwarding

- **Unknown `sourceTemplateId` in `StartSessionInput`:** `resolveSourceTemplate` already falls back to `DEFAULT_SOURCE_TEMPLATE_ID` for unknown IDs. No additional error handling needed.
- **`activeTemplateRef` read during poll before session start:** Initialized to `resolveSourceTemplate(DEFAULT_SOURCE_TEMPLATE_ID)` at provider mount, so it is always valid.

### DB Migration

- **`ALTER TABLE` on existing column:** The Rust migration helper catches `rusqlite::Error::SqliteFailure` where the message contains `"duplicate column name"` and treats it as success. All other errors are propagated and will prevent app startup.

### Session Card Rendering

- **`sourceTemplateId` in DB not found in `SOURCE_TEMPLATES`:** `resolveSessionTemplateLabel` returns `"Unknown template"` — no crash, no blank.

### Replay Notes Enrichment

- **`bookmark.eventIndex` out of bounds for `events` array:** `events[bookmark.eventIndex] ?? null` returns null; all four context fields show their null/empty fallback values.
- **`parsedLinesJson` is malformed JSON:** Wrapped in `try/catch`; on parse failure, `logExcerpt` is set to `null` and `"No log excerpt available"` is displayed.

---

## Testing Strategy

### Unit Tests

- `resolveSessionTemplateLabel(id)` — test null, known ID, unknown ID.
- `resolveBookmarkContext(bookmark, events)` — test null `eventIndex`, valid index, out-of-bounds index, empty `parsedLinesJson`, long log line (> 120 chars).
- `formatBpm(value)` — test null, integer, float.
- `formatDominantLevel(value)` — test null, empty string, "error", "warn", "info", hyphenated strings.
- DB migration helper — test idempotency (run twice, verify no error on second run).

### Property-Based Tests

Property-based testing is appropriate here because the feature contains pure formatting functions, scheduling arithmetic, and data round-trips where input variation meaningfully exercises edge cases. The recommended library is **fast-check** (already available in the TypeScript ecosystem; add as a dev dependency if not present).

Each property test runs a minimum of **100 iterations**.

Tag format: `Feature: audio-session-improvements, Property N: <property_text>`

**Property 1 — Crossfade scheduling overlap**
Generate: random `segmentDuration` (1.0–8.0s), random `currentTime` (0–3600s), random `previousEndTime` (currentTime to currentTime + 10s).
Assert: `incomingStartTime <= previousEndTime - 0.020`.

**Property 2 — Crossfade ramp correctness**
Generate: random `volume` (0.0–1.0), random `currentTime` (0–3600s).
Assert: outgoing gain ramp target is 0 at `currentTime + 0.12`; incoming gain starts at 0 and ramps to `volume` at `startTime + 0.12`.
Use a mock `AudioContext` with a spy `GainNode`.

**Property 3 — Template values forwarded on every poll**
Generate: random `SourceTemplate` from `SOURCE_TEMPLATES` (or a generated template with valid fields).
Assert: after calling `startSession` with `sourceTemplateId`, the next `emitUpdate` call passes `activeTemplate.bpm` to `renderSynthFallback` and `activeTemplate.styleProfileId`/`mutationProfileId` to the scene resolver.
Use mocked `renderSynthFallback` and `resolveLiveSonificationScene`.

**Property 4 — Mid-session template switch**
Generate: two random templates A and B (distinct IDs).
Assert: after `setActiveTemplate(B.id)`, the next poll uses B's values; the previous poll used A's values.

**Property 5 — Session creation round-trip**
Generate: random `sourceTemplateId` (valid ID, null, or arbitrary string).
Assert: `createPersistedSession({ ..., sourceTemplateId })` followed by `getPersistedSession(id)` returns `sourceTemplateId` unchanged.
Use an in-memory SQLite database (`:memory:`).

**Property 6 — Session card BPM formatting**
Generate: random `lastBpm` (positive float, 0, null).
Assert: output matches `"${Math.round(lastBpm)} BPM"` or `"— BPM"`.

**Property 7 — Session card template label resolution**
Generate: random string (may or may not be a valid template ID), null.
Assert: output is one of `template.label`, `"No template"`, or `"Unknown template"` per the rules.

**Property 8 — Template chip content correctness**
Generate: random `SourceTemplate`, random `liveBpm` (positive float or null).
Assert: chip text contains expected fields; live BPM suffix present iff `|liveBpm - template.bpm| > 5`.

**Property 9 — Bookmark BPM formatting**
Generate: random `suggestedBpm` (positive float, 0, null).
Assert: same formatting rule as Property 6.

**Property 10 — Dominant level title-casing**
Generate: random string (lowercase, uppercase, hyphenated, empty, null).
Assert: output is title-cased or `"—"` for null/empty.

**Property 11 — Log excerpt truncation**
Generate: random string of length 0–500.
Assert: `excerpt.length <= 120` and `excerpt === line` when `line.length <= 120`.

### Integration Tests

- **DB migration idempotency:** Run the migration SQL twice against a real SQLite file; verify no error and column exists.
- **`create_persisted_session` + `list_persisted_sessions` with `source_template_id`:** End-to-end Tauri command test verifying the column is written and read correctly.
- **AudioContext crossfade in browser:** Manual smoke test — load a guide track, observe no audible gap between segments in the DevTools audio inspector.
