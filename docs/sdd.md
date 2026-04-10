# SDD (lightweight) - Maia

## Summary
Maia is a local-first desktop app for auditory monitoring. The user chooses a track or playlist as the musical base, then Maia turns repositories, logs, streams, scanned files, and reusable sonic assets into a continuous monitoring mix and audible operational signals by altering that base. It runs as a Tauri + React + TypeScript desktop shell with a Python analyzer, SQLite storage, and JSON contracts over IPC.

## Goals
- Make software behavior listenable (code + logs) with deterministic analysis.
- Let source-derived events alter a known musical base instead of generating abstract cues only.
- Let teams monitor systems mainly by ear, with visuals as support rather than the primary channel.
- Keep the listening experience pleasant enough for long background use.
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

## Source of truth
- Product app: `desktop/`
- Native shell/backend: `desktop/src-tauri/`
- Active analyzer runtime: `analyzer/src/maia_analyzer/`
- Landing only: `site/`

## Core entities
- track_analysis
- repo_analysis
- base_asset
- composition_result

## Key flows
1) Track import
- UI forces music-style selection from local config.
- Tauri snapshots track to managed storage.
- Analyzer returns waveform, beat grid, BPM curve, key signature, energy level, danceability, and lightweight structural cues.

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
- The target user experience is auditory monitoring in background: the team should be able to hear stability, pressure, drift, and anomalies without continuously watching the UI.

4) Base asset import
- Requires category selection and reusable flag.
- Analyzer returns checksum, entry count, preview entries.
- Base assets can be file or directory packs.

5) Composition results
- **Track or playlist (instrumental base, required)**: the selected track, or blended playlist of tracks, provides the rhythmic foundation and beat anchor.
- **Structure (optional)**: repo/log with anomalies drives harmonic/textural variations.
- **Base asset**: reusable sonic vocabulary applied as the foundation.
- Process: the selected base track or playlist anchors composition; if repo/log is also selected, its anomalies (errors, warnings) modulate arrangement and should be heard as changes to that original base.
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
- Session-based stream polling: transient session runtime now lives in Rust `SessionRegistry` inside `main.rs`; file/process/`journald` adapters are owned natively, while WebSocket/HTTP-poll feed chunks into the same runtime via `ingest_stream_chunk`; adapter selector in `LiveLogMonitorPanel`. ✅
- Genre-configured instrumental palette: 8 curated genres in `music-styles.json`, per-severity waveform/pitch/gain profiles in `liveSonificationScene.ts`, genre selector in pre-start toolbar. ✅
- Sequencer presets (sparse / balanced / beat-locked / cascade) and component routes: `COMPONENT_ROUTES` maps log-event patterns to oscillator/sample routes; presets control cue density, gain spread, and scheduling mode. ✅
- Reference anchor: `deriveReferenceAnchor` extracts BPM, energy level, and music-style from one imported track to override genre, auto-suggest preset, and tilt gain in the live scene. ✅
- Reference playlist: `blendAnchors` blends multiple anchor tracks into one composite (BPM median, energy mean, musicStyleId mode); add/remove pill UI with ↑/↓ reorder buttons. ✅
- Beat-phase-aware scheduling: persistent `BeatClock` seeded from anchor BPM (or first live-detected BPM); `nextBeatTime` aligns cue start to the nearest subdivision boundary; gentle ±12% drift re-sync per poll window. ✅
- Monitor prefs persistence: `MonitorPrefs` (`basePlaylist`, `selectedStyleProfileId`, `selectedMutationProfileId`) saved to `localStorage` keyed by `repository.id`; restored on repo switch, with loader-side migration from the older `referencePlaylistIds` / `selectedGenreId` / `selectedPresetId` shape. ✅
- Blend details in scene panel: `LiveSonificationScenePanel` shows a "Blend style" row when the active anchor is a playlist composite. ✅

## Still missing / future work
The most realistic implementation order from this point: (1) push the current app-level monitor into a true background music-server mode for teams; (2) broaden stream adapters beyond the current file / process / WebSocket / HTTP-poll / journald set; (3) deepen the sonification engine with denser sequencing and component-level mapping; (4) add fuller export/bounce beyond `plan.json`, `preview.wav`, and stem WAVs; and (5) expand format support and curated listening profiles.

- **Always-on app-level monitoring** ✅ (shipped: `MonitorContext` lifts poll loop to root, sidebar live badge, session survives navigation) — resolved.
- **Background music-server mode / headless runtime** ⏳ pending.
- **Broader stream adapters** ✅ (shipped: WebSocket adapter manages JS `WebSocket` and feeds chunks into Rust `SessionRegistry`; HTTP-poll adapter fetches URL on each interval through the same path; `ingest_stream_chunk` Rust command; panel URL inputs; `journald` adapter via native `journalctl -f -o json` follow mode with optional unit filter in `LiveLogMonitorPanel`).
- **Test coverage** ✅ (shipped: `test_schema_validation.py` — 11 tests validating request/response JSON schemas with `jsonschema`; `test_golden_analysis.py` — 18 tests pinning stable metric values, mock vs native gate for health/analyze/error shapes; `jsonschema[format-nongpl]` added to requirements-dev.txt; contract schema synced: `healthPayload.supportedTrackFormats` added)
- **Dense multi-track arrangement** ✅ (shipped: per-component gain/mute routing panel, `ComponentRoutingPanel`, arrangement-lane display with foundation/motion/accent tracks; `PadSequencerPanel` — 16-step × 3-track authoring grid with BPM playhead, Fill-from-scene seed, clear, per-track colour coding)
- **Export/bounce pipeline** ✅ (shipped: `write_stem_wavs()` renders one WAV per stem; `export-stems` CLI; Rust `export_composition_stems` + `pick_stems_export_directory`; stems button in `ExportCompositionPanel`; 10 dedicated tests passing)
- **Additional audio formats** ✅ (shipped: `_decode_librosa_audio` fallback covers m4a/aac/aiff/mp4 via audioread/FFmpeg; `get_supported_track_formats` now returns dynamic format list)
- **Tree-sitter beyond Java/Kotlin** ✅ (shipped: Python, TypeScript/TSX, Go, Rust fully wired + 32 passing tests)

## Implementation plan (summary)
1) Always-on app-level monitoring ✅
- `MonitorContext` at app root holds the poll loop; `AppSidebar` shows live status badge; `LiveLogMonitorPanel` is now a pure subscriber.

2) Background music-server mode ⏳
- Lift the runtime from app-scoped monitoring into a long-running background service mode where the desktop app is the control surface.

3) Broader stream adapters ✅
- WebSocket adapter: JS `WebSocket`, line buffer, `ingest_stream_chunk` into Rust `SessionRegistry`.
- HTTP-poll adapter: fetch on each interval, same ingest path.
- `process` and `journald` adapters: native child-process follow mode owned by Rust, feeding the same transient session runtime.

4) Consolidation and test coverage ✅
- `test_schema_validation.py`: 11 tests validate request/response JSON schemas via jsonschema Draft 2020-12.
- `test_golden_analysis.py`: 18 tests pin BPM, level counts, anomaly ratio, top components, mock vs native gate.
- Contract schema (`analyzer-response.schema.json`) synced: `healthPayload.supportedTrackFormats` added, `supportedActions` enum relaxed.

5) Repo parsing with tree-sitter ✅ (shipped: Java/Kotlin/Python/TypeScript/Go/Rust — 32 dedicated tests passing)
- All major languages covered. `build_repo_waveform_bins` uses all 6 parsers.

6) DSP integration ✅ (shipped: librosa tempo/onset; m4a/aac/aiff via librosa/audioread fallback ✅)
- Replace heuristics with real tempo/onset/beat tracking.
- All compressed formats now covered; wma fallback available if audioread present.

7) Stream adapters + session monitoring ✅ (shipped: file + process + WebSocket + HTTP-poll + journald adapters, Rust-owned transient ring buffer, SessionRegistry)
- Always-on app-level monitoring ✅ shipped. Broader external adapters such as Kafka/Loki are still pending, plus background service mode.

8) Sonification engine ✅ (shipped: genre palette ✅, sequencer presets ✅, reference anchor ✅, reference playlist ✅, beat-phase scheduling ✅, persistence ✅, per-component routing panel ✅, arrangement-lane display ✅)
- `PadSequencerPanel` ✅: 16-step × 3-track grid (foundation/motion/accent), BPM-driven playhead, Fill-from-scene seed, manual toggle, colour-coded per track. Rendered in `LiveLogMonitorPanel`.

9) Reference anchor + playlist ✅ (fully shipped: single anchor, playlist blend, beat clock, persistence, reorder, blend details)

10) Replay feedback loop ✅
- Replay windows can now be bookmarked, tagged, annotated, and turned into recommended style/mutation mixes for later sessions. Applying the recommendation now persists the selected style/mutation mix back into per-repo `MonitorPrefs`.

11) Composition export ✅ (shipped: `write_stem_wavs()` per-stem WAV render, `export-stems` CLI subcommand, Rust `export_composition_stems` + `pick_stems_export_directory`, TypeScript API, stems export button in `ExportCompositionPanel`; 10 passing tests)
- Heavy DSP dependencies: deterministic fallback in place.
- Cross-platform file access: managed via native file picker + Tauri asset protocol.

## Open questions
- Should replay feedback remain an explicit operator action, or should Maia offer an opt-in mode that auto-applies the latest recommendation as the repo default?
- Priority between tree-sitter parsing vs DSP upgrades.
- Supported stream sources for the first non-file adapter.
- Export format targets (wav, stems, project files).

## Session update (2026-04-09)
- Critical cleanup in `LiveLogMonitorPanel.tsx`: removed the duplicate `_unusedRenderCuesToWavStub` helper and the stale inline bounce WAV renderer left behind by the previous refactor. TypeScript compile returns exit code 0 again.
- WAV rendering coverage expanded in `desktop/test/utils/wavRenderer.test.ts` (17 tests): `renderCuesToWav` now has checks for empty input, RIFF header, PCM sizing, `masterGain=0`, non-zero gain output, all four waveform shapes, and `audio/wav` MIME type; `renderBounceWav` is covered for empty input, linear growth with additional windows, stable RIFF structure, and the constants `MAX_BOUNCE_WINDOWS=180` and `BOUNCE_WINDOW_S=0.6`. Tests use `FileReader` because jsdom does not implement `Blob.arrayBuffer()`.
- `PadSequencerPanel` coverage was repaired in `desktop/test/components/PadSequencerPanel.test.tsx` by restoring explicit `cleanup()` inside `afterEach`, alongside `vi.restoreAllMocks()`. Suite returns to 17/17 passing. Matching sequencer CSS landed in `desktop/src/styles.css` for `.pad-seq-step-prob`, `.pad-seq-hint`, `.pad-seq-humanize-label`, `.pad-seq-humanize-range`, and `.pad-seq-humanize-value`.
- Python stream coverage gained 3 journald-specific tests in `analyzer/tests/test_stream.py`: JSON journal lines ingest into the analyzer-side ring buffer, `session_poll` returns `hasData=True` for seeded journald sessions, and the stored adapter metadata still reflects the underlying process command (`journalctl ...`) even when the UI adapter kind is `journald`.
- Replay-feedback recommendations now persist immediately into `MonitorPrefs` via a shared `monitorPrefs` utility, with dedicated desktop tests covering current-shape load/save, legacy migration, and immediate persistence of an applied recommendation.
- Python test execution now forces `analyzer/src` to the front of `sys.path` via `analyzer/tests/conftest.py`, so pytest always exercises the active runtime instead of any stale installed wheel in the venv.
- Live session state no longer depends on analyzer process memory: `desktop/src-tauri/src/main.rs` now owns transient session buffers and spawned `process` / `journald` followers in Rust `SessionRegistry`, while `poll_stream_session` and `ingest_stream_chunk` invoke the Python analyzer statelessly per chunk. `MonitorContext` now starts native sessions for file/process/`journald` and reserves direct mode only as the browser/demo fallback for local files.
- Current suite status from this session: Desktop build passing, `cargo check` passing, desktop tests 128/128 passing, and analyzer Python suite 150/150 passing.

## Next session
- Add `kafka` and `loki` stream adapters end-to-end: enum/plumbing in the UI, configuration fields (`bootstrap server`, `topic`, `Loki URL`, `query`), and Rust `main.rs` branches wrapping `kcat`/`kafkacat` and `logcli tail`.
- Design the background music-server / headless runtime boundary so monitoring can continue outside the foreground desktop screen lifecycle.
- Decide whether the future background runtime should reuse the in-process Rust `SessionRegistry` directly or extract it into a longer-lived native service boundary with the same session contract.
