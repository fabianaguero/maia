# AGENTS.md

**Last Updated:** June 2026 (Status as of June 25, 2026)

## Product
Desktop app tipo Rekordbox para Linux, Windows y macOS.
Analiza repositorios, logs y genera arte sonoro en vivo (Live System Performance). 
Grafica waveform/beat grid/BPM curve para inferir BPM sugerido desde código fuente y streams de logs.
Evoluciona código estático y logs en vivo hacia música generativa (Techno, Ambient, Glitch, Heartbeat).
Mezclador Híbrido: Combina stems reales (AI-separated) con síntesis reactiva a datos.
Ideal para 'Team Soundscape Monitoring' en equipos de DevOps/SRE: 'Chill but Alerting'.

## Fixed architecture
- Desktop shell: Tauri + React + TypeScript
- Analyzer: Python
- Local DB: SQLite
- Optional optimization later: Rust
- Repo parsing: tree-sitter
- Audio analysis: librosa + Essentia

Domain model
Core entity: musical_asset
Types:
- track_analysis
- repo_analysis
- base_asset
- composition_result
- live_sonification_preset (Techno, Ambient, Glitch)

## Non-goals for MVP
- No cloud backend
- No auth
- No sync multi-user
- No AI-heavy generation in v1
- No VST/plugin architecture in v1

## UX
Must feel like a desktop DJ analyzer, not a web dashboard.

## Implementation Status (April 2026)

### Shipped Features
- ✅ Tree-sitter based repository parsing (Java/Kotlin/Python/TypeScript/Go/Rust)
- ✅ DSP integration via librosa (tempo, onset, beat tracking)
- ✅ Session-based stream polling (file, process, WebSocket, HTTP-poll, journald adapters)
- ✅ OpenTelemetry-aware log intake with trace-context-friendly passive monitoring (`trace_id` / `span_id` compatible)
- ✅ Feature iteration also captured from Codex Web workflow notes before landing in the desktop product backlog
- ✅ Genre-configured instrumental palette (8 curated genres)
- ✅ Sequencer presets (sparse/balanced/beat-locked/cascade)
- ✅ Reference anchor + multi-track playlist blending
- ✅ Beat-phase-aware scheduling with BeatClock
- ✅ Replay feedback loop with bookmarks and recommendations
- ✅ Composition export (stems + plan.json + preview.wav)
- ✅ V0 design system (minimalismo instrumental aesthetic)
- ✅ Simple mode vs Expert mode (with UserModeContext + localStorage persistence)
- ✅ Audio session enhancements: source template ID, BPM/template chips, template indicator chip
- ✅ Anomaly-to-log linking in passive monitoring, so deck events and highlighted log rows stay correlated
- ✅ Property-based testing for session improvements

### In Progress / Future Work
- ⏳ Deeper track / playlist prep (full-track analysis, stronger cue maps, smarter playlist intelligence)
- ⏳ Background music-server mode / headless runtime
- ⏳ Broader stream adapters (Kafka, Loki)
- ⏳ Richer sonification behavior
- ⏳ Virtual output mode / system-audio passthrough (later roadmap)
- ⏳ Fuller bounce/export beyond WAV stems

## Engineering rules
- Keep analyzer and desktop app decoupled via JSON contracts
- Prefer deterministic heuristics over black-box ML in MVP
- Store all analysis locally
- Make Linux the primary dev environment
- Maintain strict TypeScript (no `any`), proper error handling with NotificationSystem
- All UI changes align with DESIGN.md constraints (typography, colors, spacing, motion)

## Quality gates
- Codex must leave repository hooks green before proposing a commit or publish step.
- `pre-commit` runs `make quality-pre-commit` from `.githooks/pre-commit`.
- `pre-push` runs `make quality-pre-push` from `.githooks/pre-push`.
- Use `make hooks-install` after cloning to activate the tracked hook path with `git config core.hooksPath .githooks`.

## Commit policy
- Codex-authored commits must use Conventional Commits.
- Prefer the narrowest truthful scope, such as `feat(desktop): ...`, `fix(analyzer): ...`, or `chore(repo): ...`.
- Do not create a commit until the corresponding hook stage is green.
