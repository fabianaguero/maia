# Requirements Document

## Introduction

This feature covers five targeted improvements to the MAIA desktop app's audio pipeline and session UX. The changes address a guide track playback gap caused by cursor/poll timing mismatch, wire source template metadata (BPM, styleProfileId, mutationProfileId) into the sonification engine, surface BPM and template data on past session cards, add a source template indicator to the MonitorWaveformBar header, and enrich session bookmark/replay-notes cards with per-window context (BPM, dominant level, anomaly count, log excerpt).

All work is scoped to the Tauri + React + TypeScript desktop shell and the SQLite local database. No cloud, no auth, no Python analyzer changes required.

---

## Glossary

- **Guide_Track_Engine**: The subsystem in `MonitorContext.tsx` that decodes audio PCM, slices bar-length WAV segments, and schedules them for playback via the Web Audio API.
- **PCM_Cursor**: The sample-offset pointer (`guideTrackCursorRef`) that tracks the current read position inside the decoded guide track.
- **Poll_Interval**: The 600 ms timer that drives the live monitoring loop.
- **Segment_Duration**: The fixed 4.0 s length of each guide track WAV slice.
- **Crossfade_Engine**: The new component responsible for overlapping two consecutive guide track segments with a linear amplitude ramp to eliminate audible gaps.
- **Synth_Fallback**: The `renderSynthFallback` function that generates a minimal kick/bass/melody WAV when no guide track is loaded.
- **Source_Template**: A record in `sourceTemplates.ts` that bundles `bpm`, `styleProfileId`, `mutationProfileId`, `genre`, and display metadata into a named preset (e.g. "Deep House", "Peak Techno").
- **Sonification_Scene_Resolver**: The live scene logic in `liveSonificationScene.ts` that selects style and mutation profiles to shape real-time cue generation.
- **Session_Card**: A UI card in `SessionScreen.tsx` that represents one row in the `sessions` SQLite table.
- **MonitorWaveformBar**: The `MonitorWaveformBar.tsx` component that renders the dual-channel waveform canvas and the HUD tail.
- **Session_Bookmark**: A row in the `session_bookmarks` table, surfaced as a replay-notes card in the session detail view.
- **Replay_Notes_Card**: The `ReplayFeedbackSummaryCard` component that renders bookmark metadata in the session detail panel.
- **BPM_At_Window**: The `suggestedBpm` value stored on the `session_events` row that corresponds to the bookmark's `event_index`.
- **Dominant_Level**: The `dominant_level` field on `session_events` (e.g. "error", "warn", "info").
- **PersistedSession**: A row in the `sessions` SQLite table, mapped to the `PersistedSession` TypeScript interface in `sessions.ts`.
- **source_template_id**: A new TEXT column to be added to the `sessions` table to record which Source_Template was active when the session started.

---

## Requirements

---

### Requirement 1: Guide Track Cursor Advance and Crossfade

**User Story:** As a MAIA user monitoring a live log stream, I want the guide track audio to play continuously without audible gaps or abrupt switches, so that the listening experience remains immersive even when the PCM cursor advances faster than the poll interval.

#### Acceptance Criteria

1. WHEN the Guide_Track_Engine slices a new segment, THE Guide_Track_Engine SHALL schedule the segment to begin playback no later than 20 ms before the previous segment ends, eliminating silence gaps between consecutive slices.

2. WHEN a new guide track segment is ready and a previous segment is still playing, THE Crossfade_Engine SHALL apply a linear amplitude ramp: the outgoing segment ramps from its current volume to 0 over a 120 ms window, and the incoming segment ramps from 0 to the target volume over the same 120 ms window.

3. WHEN the PCM_Cursor reaches the end of the decoded audio before the next poll fires, THE Guide_Track_Engine SHALL pre-slice the next segment immediately upon cursor exhaustion rather than waiting for the next poll tick.

4. WHEN the Synth_Fallback is playing and a guide track finishes loading, THE Crossfade_Engine SHALL crossfade from the Synth_Fallback output to the first guide track segment using the same 120 ms linear ramp defined in criterion 2.

5. WHEN the guide track is cleared (set to null) while a segment is playing, THE Crossfade_Engine SHALL fade out the current segment over 120 ms before switching to the Synth_Fallback, rather than cutting abruptly.

6. IF the Web Audio API `AudioContext` is in a suspended state when a segment is scheduled, THEN THE Guide_Track_Engine SHALL queue the segment and attempt to resume the context, playing the queued segment immediately upon successful resume.

7. THE Crossfade_Engine SHALL not introduce more than 5 ms of additional scheduling latency relative to the existing poll-driven playback path.

---

### Requirement 2: Source Template Values Forwarded to Sonification Engine

**User Story:** As a MAIA user, I want the source template I select before starting a session to actually influence the synth fallback tempo and the live sonification style, so that the music matches the genre and energy level I chose.

#### Acceptance Criteria

1. WHEN a session starts with a selected Source_Template, THE MonitorContext SHALL pass the template's `bpm` value to `renderSynthFallback` as the `bpm` parameter for every poll cycle in that session.

2. WHEN a session starts with a selected Source_Template, THE MonitorContext SHALL pass the template's `styleProfileId` to the Sonification_Scene_Resolver so that the correct `StyleProfileOption` is active from the first poll onward.

3. WHEN a session starts with a selected Source_Template, THE MonitorContext SHALL pass the template's `mutationProfileId` to the Sonification_Scene_Resolver so that the correct `MutationProfileOption` is active from the first poll onward.

4. WHEN no Source_Template is explicitly selected, THE MonitorContext SHALL use the `DEFAULT_SOURCE_TEMPLATE_ID` template's `bpm`, `styleProfileId`, and `mutationProfileId` as fallback values.

5. WHEN the active Source_Template changes during a session (user switches template mid-session), THE MonitorContext SHALL apply the new template's `bpm`, `styleProfileId`, and `mutationProfileId` starting from the next poll cycle without restarting the session.

6. THE `StartSessionInput` type SHALL include an optional `sourceTemplateId` field so that callers can declare the template at session-start time.

7. WHEN `sourceTemplateId` is present in `StartSessionInput`, THE MonitorContext SHALL resolve the full `SourceTemplate` record via `resolveSourceTemplate` and store it in the active session ref for use throughout the session lifecycle.

---

### Requirement 3: Past Sessions BPM and Template Display

**User Story:** As a MAIA user reviewing past sessions, I want each session card to show the last captured BPM and the source template that was used, so that I can quickly identify the musical context of a session without opening it.

#### Acceptance Criteria

1. THE `sessions` SQLite table SHALL include a `source_template_id` TEXT column (nullable) that stores the `SourceTemplate.id` value recorded at session-start time.

2. THE `PersistedSession` TypeScript interface SHALL include a `sourceTemplateId: string | null` field that maps to the `source_template_id` column.

3. WHEN a new session is created, THE Session_Manager SHALL write the selected `sourceTemplateId` into the `source_template_id` column of the `sessions` row.

4. WHEN the `sessions` list is rendered, THE Session_Card SHALL display the `lastBpm` value (already stored in the `last_bpm` column) formatted as `"NNN BPM"` when the value is non-null, or `"— BPM"` when null.

5. WHEN the `sessions` list is rendered, THE Session_Card SHALL display the resolved Source_Template label (e.g. "Deep House 🏠") when `sourceTemplateId` is non-null, or `"No template"` when null.

6. WHEN `sourceTemplateId` stored in the database does not match any entry in `SOURCE_TEMPLATES`, THE Session_Card SHALL display `"Unknown template"` rather than crashing or showing a blank.

7. THE Session_Card display of BPM and template SHALL be visible without expanding or opening the session detail panel.

---

### Requirement 4: Waveform Bar Source Template Indicator

**User Story:** As a MAIA user monitoring a live session, I want the MonitorWaveformBar header to show the active source template's genre, BPM, and style so that I can confirm the correct musical context is active at a glance.

#### Acceptance Criteria

1. WHEN a session is active and a Source_Template is associated with it, THE MonitorWaveformBar SHALL render a template indicator chip in the header row showing the template's `icon`, `genre`, and `bpm` (e.g. "🏠 Deep House · 120 BPM").

2. WHEN no Source_Template is associated with the active session, THE MonitorWaveformBar SHALL render the chip with the text "Synth Default" and no icon.

3. WHEN the active session's `suggestedBpm` from the latest poll update differs from the template's static `bpm` by more than 5 BPM, THE MonitorWaveformBar SHALL display the live signal BPM alongside the template BPM in the format "🏠 Deep House · 120 BPM → 134 live".

4. WHEN no session is active, THE MonitorWaveformBar SHALL not render the template indicator chip.

5. THE template indicator chip SHALL be positioned in the `monitor-header-controls` row, to the left of the LISTENING BED selector, and SHALL not cause the header to wrap to a second line at viewport widths ≥ 900 px.

6. THE template indicator chip SHALL use a distinct visual style (e.g. a bordered pill) that differentiates it from the LISTENING BED label and the session title.

---

### Requirement 5: Replay Notes Context Enrichment

**User Story:** As a MAIA user reviewing session bookmarks, I want each replay-notes card to show the BPM at that window, the dominant log level, the anomaly count, and a short excerpt from the captured log lines, so that I can understand what was happening in the system at that moment without replaying the full session.

#### Acceptance Criteria

1. WHEN a Session_Bookmark is rendered in the Replay_Notes_Card, THE Replay_Notes_Card SHALL display the `BPM_At_Window` value formatted as `"NNN BPM"` when available, or `"— BPM"` when the corresponding `session_events` row has a null `suggested_bpm`.

2. WHEN a Session_Bookmark is rendered in the Replay_Notes_Card, THE Replay_Notes_Card SHALL display the `Dominant_Level` value from the corresponding `session_events` row, formatted with title-case (e.g. "Error", "Warn", "Info"), or `"—"` when unavailable.

3. WHEN a Session_Bookmark is rendered in the Replay_Notes_Card, THE Replay_Notes_Card SHALL display the `anomaly_count` from the corresponding `session_events` row as a numeric badge (e.g. "3 anomalies"), or `"0 anomalies"` when the count is zero.

4. WHEN a Session_Bookmark is rendered in the Replay_Notes_Card and the corresponding `session_events` row has a non-empty `parsed_lines_json` array, THE Replay_Notes_Card SHALL display the first parsed log line truncated to 120 characters as a log excerpt.

5. WHEN the `parsed_lines_json` array is empty or null for a bookmark's event, THE Replay_Notes_Card SHALL display `"No log excerpt available"` in place of the excerpt field.

6. WHEN a Session_Bookmark has a null `event_index`, THE Replay_Notes_Card SHALL display `"—"` for all four context fields (BPM, dominant level, anomaly count, log excerpt) rather than attempting a lookup.

7. THE Replay_Notes_Card SHALL resolve the enrichment data from the in-memory `SessionEvent` list already loaded for the session, without issuing additional IPC calls to the Tauri backend per bookmark render.

8. WHEN the enrichment data is displayed, THE Replay_Notes_Card SHALL render the four context fields (BPM, dominant level, anomaly count, log excerpt) in a visually distinct sub-row below the existing bookmark label and note fields, maintaining the current card layout for the label and note.
