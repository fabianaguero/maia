# SDD (lightweight) - Maia

## Summary
Maia is a local-first desktop app that turns repositories, logs, and reusable sonic assets into music and audible operational signals. It runs as a Tauri + React + TypeScript desktop shell with a Python analyzer, SQLite storage, and JSON contracts over IPC.

## Goals
- Make software behavior listenable (code + logs) with deterministic analysis.
- Provide DJ-like analysis views: waveform, beat grid, BPM curve.
- Keep analysis local, deterministic, and stored in SQLite.
- Use reusable base assets as the sonic vocabulary for sonification.

## Non-goals (MVP)
- Cloud backend, auth, multi-user sync.
- AI-heavy generation.
- VST/plugin architecture.

## Architecture (high level)
- Desktop shell: Tauri + React + TypeScript.
- Analyzer: Python CLI/service with JSON contracts.
- Storage: SQLite + managed local asset snapshots.
- Contracts: JSON schemas in contracts/.

## Core entities
- track_analysis
- repo_analysis
- base_asset
- composition_result

## Key flows
1) Track import
- UI forces music-style selection from local config.
- Tauri snapshots track to managed storage.
- Analyzer returns waveform, beat grid, BPM curve.

2) Repository import (local or URL)
- Local directories are snapshotted to managed storage.
- Analyzer derives deterministic repo metrics and suggested BPM.
- Repo analysis reads the full code snapshot ("tail" of the codebase) to build a musical signal baseline.
- Optional repo parsing filters can narrow analysis by language or file extension.

3) Log import and live monitoring
- Local log file is snapshotted; live tail reads from original path.
- Analyzer derives severity/anomaly metrics and a BPM suggestion.
- Live monitor uses Web Audio to trigger cues.
- Log tailing is the streaming version of the same signal idea: a "tail" of events that drives the musical cues.

4) Base asset import
- Requires category selection and reusable flag.
- Analyzer returns checksum, entry count, preview entries.
- Base assets can be file or directory packs.

5) Composition results
- **Track (instrumental base, required)**: selected track provides the rhythmic foundation and beat anchor.
- **Structure (optional)**: repo/log with anomalies drives harmonic/textural variations.
- **Base asset**: reusable sonic vocabulary applied as the foundation.
- Process: track BPM anchors composition; if repo/log also selected, its anomalies (errors, warnings) modulate arrangement (darker tones on high error density, textural shifts on warnings, etc.).
- Produces plan metadata, preview artifacts, and optional preview audio.

## Data model (SQLite)
- musical_assets (shared metadata)
- track_analyses (artifacts)
- repo_analyses (metrics)
- base_assets (catalog)
- composition_results (planner artifacts)
- analysis_jobs (pipeline status)

## Contracts
- Request/response schemas in contracts/.
- All analysis uses JSON IPC with deterministic responses.

## Shipped since initial draft
- Tree-sitter based repository parsing (Java/Kotlin, structural metrics, deterministic BPM mapping). ✅
- DSP integration via librosa (tempo/onset/beat tracking replacing pure heuristics). ✅
- Session-based stream polling: ring buffer + process adapter in `stream.py`; `SessionRegistry` + 4 Tauri commands in `main.rs`; adapter selector in `LiveLogMonitorPanel`. ✅
- Genre-configured instrumental palette: 8 curated genres in `music-styles.json`, per-severity waveform/pitch/gain profiles in `liveSonificationScene.ts`, genre selector in pre-start toolbar. ✅
- Sequencer presets (sparse / balanced / beat-locked / cascade) and component routes: `COMPONENT_ROUTES` maps log-event patterns to oscillator/sample routes; presets control cue density, gain spread, and scheduling mode. ✅
- Reference anchor: `deriveReferenceAnchor` extracts BPM, energy level, and music-style from one imported track to override genre, auto-suggest preset, and tilt gain in the live scene. ✅
- Reference playlist: `blendAnchors` blends multiple anchor tracks into one composite (BPM median, energy mean, musicStyleId mode); add/remove pill UI with ↑/↓ reorder buttons. ✅
- Beat-phase-aware scheduling: persistent `BeatClock` seeded from anchor BPM (or first live-detected BPM); `nextBeatTime` aligns cue start to the nearest subdivision boundary; gentle ±12% drift re-sync per poll window. ✅
- Reference playlist persistence: `MonitorPrefs` (referencePlaylistIds, selectedGenreId, selectedPresetId) saved to `localStorage` keyed by `repository.id`; restored on repo switch. ✅
- Blend details in scene panel: `LiveSonificationScenePanel` shows a "Blend style" row when the active anchor is a playlist composite. ✅

## Still missing / future work
The most realistic implementation order from this point: (1) always-on background monitoring so sonification keeps running when the user navigates away from the analyzer screen; (2) broader stream adapters beyond local files and spawned processes; (3) consolidation and test coverage for the shipped workflow; (4) a richer sonification engine with denser sequencing and component-level mapping; (5) a full export and bounce pipeline beyond `plan.json` and `preview.wav`; and (6) additional format support and broader curated palette coverage.

- **Always-on background monitoring** ✅ (shipped: `MonitorContext` lifts poll loop to root, sidebar live badge, session survives navigation) — resolved.
- **Broader stream adapters** ✅ (shipped: WebSocket adapter manages JS `WebSocket` + ring buffer ingest; HTTP-poll adapter fetches URL on each interval; `ingest_stream_chunk` Rust command; panel URL inputs).
- **Test coverage** ✅ (shipped: `test_schema_validation.py` — 11 tests validating request/response JSON schemas with `jsonschema`; `test_golden_analysis.py` — 18 tests pinning stable metric values, mock vs native gate for health/analyze/error shapes; `jsonschema[format-nongpl]` added to requirements-dev.txt; contract schema synced: `healthPayload.supportedTrackFormats` added)
- **Dense multi-track arrangement** ✅ (shipped: per-component gain/mute routing panel, `ComponentRoutingPanel`, arrangement-lane display with foundation/motion/accent tracks; `PadSequencerPanel` — 16-step × 3-track authoring grid with BPM playhead, Fill-from-scene seed, clear, per-track colour coding)
- **Export/bounce pipeline** ✅ (shipped: `write_stem_wavs()` renders one WAV per stem; `export-stems` CLI; Rust `export_composition_stems` + `pick_stems_export_directory`; stems button in `ExportCompositionPanel`; 10 dedicated tests passing)
- **Additional audio formats** ✅ (shipped: `_decode_librosa_audio` fallback covers m4a/aac/aiff/mp4 via audioread/FFmpeg; `get_supported_track_formats` now returns dynamic format list)
- **Tree-sitter beyond Java/Kotlin** ✅ (shipped: Python, TypeScript/TSX, Go, Rust fully wired + 32 passing tests)

## Implementation plan (summary)
1) Always-on background monitoring ✅
- `MonitorContext` at app root holds the poll loop; `AppSidebar` shows live status badge; `LiveLogMonitorPanel` is now a pure subscriber.

2) Broader stream adapters ✅
- WebSocket adapter: JS `WebSocket`, line buffer, `ingest_stream_chunk` Rust cmd, Python ring buffer.
- HTTP-poll adapter: fetch on each interval, same ingest path.

3) Consolidation and test coverage ✅
- `test_schema_validation.py`: 11 tests validate request/response JSON schemas via jsonschema Draft 2020-12.
- `test_golden_analysis.py`: 18 tests pin BPM, level counts, anomaly ratio, top components, mock vs native gate.
- Contract schema (`analyzer-response.schema.json`) synced: `healthPayload.supportedTrackFormats` added, `supportedActions` enum relaxed.

4) Repo parsing with tree-sitter ✅ (shipped: Java/Kotlin/Python/TypeScript/Go/Rust — 32 dedicated tests passing)
- All major languages covered. `build_repo_waveform_bins` uses all 6 parsers.

5) DSP integration ✅ (shipped: librosa tempo/onset; m4a/aac/aiff via librosa/audioread fallback ✅)
- Replace heuristics with real tempo/onset/beat tracking.
- All compressed formats now covered; wma fallback available if audioread present.

6) Stream adapters + session monitoring ✅ (shipped: file + process adapters, ring buffer, SessionRegistry)
- Always-on background monitoring ✅ shipped. Broader platform adapters still pending.

7) Sonification engine ✅ (shipped: genre palette ✅, sequencer presets ✅, reference anchor ✅, reference playlist ✅, beat-phase scheduling ✅, persistence ✅, per-component routing panel ✅, arrangement-lane display ✅)
- `PadSequencerPanel` ✅: 16-step × 3-track grid (foundation/motion/accent), BPM-driven playhead, Fill-from-scene seed, manual toggle, colour-coded per track. Rendered in `LiveLogMonitorPanel`.

8) Reference anchor + playlist ✅ (fully shipped: single anchor, playlist blend, beat clock, persistence, reorder, blend details)

9) Composition export ✅ (shipped: `write_stem_wavs()` per-stem WAV render, `export-stems` CLI subcommand, Rust `export_composition_stems` + `pick_stems_export_directory`, TypeScript API, stems export button in `ExportCompositionPanel`; 10 passing tests)
- Heavy DSP dependencies: deterministic fallback in place.
- Cross-platform file access: managed via native file picker + Tauri asset protocol.

## Open questions
- Priority between tree-sitter parsing vs DSP upgrades.
- Supported stream sources for the first non-file adapter.
- Export format targets (wav, stems, project files).
