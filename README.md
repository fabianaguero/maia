# Maia – Auditory Monitoring for Technical Teams

Maia is a local-first desktop app for auditory monitoring. A team chooses a favorite track or playlist as the musical base, then Maia turns signal streams such as logs, repositories, static-analysis findings, process output, cloud events, metrics, and reusable sonic assets into a continuous, pleasant monitoring mix that can run in the background and be understood by ear.

The product is not meant to replace dashboards. It adds an audible monitoring layer so operators can hear when a system is calm, tense, drifting, or anomalous without staring at a screen.

Source of truth:

- Product app: `desktop/`
- Active analyzer runtime: `analyzer/src/maia_analyzer/`
- Landing: `site/`

The product app is started from `desktop/` with `npm run tauri dev`.

## Open Source Readiness

Maia is intended to be published as an MIT-licensed GitHub project.
The repository already includes the baseline community files expected for a public project:

- [LICENSE](LICENSE)
- [README.md](README.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SECURITY.md](SECURITY.md)
- [SUPPORT.md](SUPPORT.md)
- [MAINTAINERS.md](MAINTAINERS.md)
- [.github/CODEOWNERS](.github/CODEOWNERS)
- [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md)

If you are preparing a public release, also review:

- [docs/github-publish-checklist.md](docs/github-publish-checklist.md)
- [docs/frontend-architecture.md](docs/frontend-architecture.md)
- [docs/open-source-maintainer-guide.md](docs/open-source-maintainer-guide.md)
- [docs/testing-and-quality.md](docs/testing-and-quality.md)
- [docs/pre-release-manual-test-plan.md](docs/pre-release-manual-test-plan.md)

## Documentation Map

- `docs/architecture.md`: product and runtime architecture overview
- `docs/frontend-architecture.md`: active desktop/frontend structure, monitor startup flow, and current refactor direction
- `docs/sdd.md`: lightweight functional spec and shipped/future scope
- `docs/open-source-maintainer-guide.md`: codebase tour, runtime boundaries, and architecture analysis for contributors
- `docs/testing-and-quality.md`: quality gates, coverage commands, and testing priorities for contributors
- `docs/pre-release-manual-test-plan.md`: manual QA flow to validate Maia as a desktop product before publishing or tagging a release
- `docs/ai-roadmap.md`: staged plan for ML and AI adoption across analyzer, prep workflows, and hybrid mixing
- `docs/signal-streams-roadmap.md`: product and architecture plan for evolving Maia beyond log-centric monitoring into generic signal streams
- `docs/github-publish-checklist.md`: pre-publication checklist before making the repository public
- `docs/demo-assets-and-fixtures.md`: explanation of demo audio, curated fixtures, and non-runtime helper artifacts
- `docs/archive/`: archived implementation plans and historical verification notes that are no longer active source-of-truth docs
- `CONTRIBUTING.md`: contributor workflow and runtime ownership rules
- `CODE_OF_CONDUCT.md`: collaboration expectations for the repository
- `SECURITY.md`: vulnerability reporting policy and security scope
- `SUPPORT.md`: support expectations and where to ask for help
- `MAINTAINERS.md`: maintainer responsibilities and runtime ownership
- `LICENSE`: MIT license for the repository
- `contracts/`: cross-runtime JSON contracts
- `database/schema.sql`: SQLite storage model

Current maintainer note:

- `desktop/src/main.tsx` currently mounts `desktop/src/App-v0.tsx`
- `desktop/src/App.tsx` exists as an alternate shell under development, but it is not the mounted entrypoint today
- desktop locales are now composed from `desktop/src/i18n/locales/*` domain slices rather than one monolithic translation file per language

Publication note:

- the repository is licensed under MIT
- review `docs/github-publish-checklist.md` before switching visibility to public on GitHub

## Current Product Status (Updated June 2026)

The current desktop app already includes:

- Local library management for tracks, playlists, repositories/log files, base assets, and composition results
- DJ-style analyzer views for waveform, beat grid, BPM curve, key/energy metadata, repository metrics, base asset metrics, and composition structure
- Native Tauri imports with managed local snapshots and SQLite persistence
- Repository parsing with tree-sitter-backed language support for Java, Kotlin, Python, TypeScript/TSX, Rust, and Go
- Local log-file analysis plus live signal sonification with Web Audio
- OpenTelemetry-friendly passive log monitoring with `trace_id` / `span_id` compatible intake and correlated anomaly views
- Stream-input direction for non-log sources such as SonarQube, CI/CD, incident feeds, metrics, security findings, and business-process events
- CodeProjects groundwork for SonarQube-backed code quality signal sources; monitor integration and secure token storage are still in progress
- Live monitor scenes with genre palettes, sequencer presets, component routing, beat-locked scheduling, and base-track/base-playlist anchoring
- Session persistence, replay, replay bookmarks, and feedback-driven mix suggestions for monitored streams
- Composition planning with `plan.json`, generated `preview.wav`, in-app playback, and WAV stem export
- Track analysis enriched with key signature, energy level, danceability, and basic structural cues
- **Session metadata enrichment (April 2026):** Source template ID persistence, BPM + template quick-view chips on session cards
- **Template indicator chip (April 2026):** Live template and BPM sync display in monitor header with >5% drift detection
- **Property-based testing (April 2026):** 11 properties validated for audio session improvements
- **V0 design system (April 2026):** Full integration of minimalismo instrumental aesthetic across AppShell, Monitor, Library, and Wizard components
- **OpenTelemetry-friendly monitoring (June 2026):** Passive monitoring flow now treats trace-context-bearing logs as first-class input so anomaly markers can stay visually linked to the live log stream while the selected track remains the listening bed
- **Codex Web iteration note (June 2026):** Part of the recent monitoring feature definition was first iterated through Codex Web, then reflected back into the desktop product documentation here

What is still evolving is the longer-running product mode: Maia should ultimately behave like a background music server for a team, where the desktop app is the control surface and the audio layer keeps monitoring systems by ear.

## Architecture

| Component | Technology |
|-----------|-----------|
| Desktop shell | Tauri 2 + React + TypeScript |
| Analyzer | Python |
| Local database | SQLite |
| Repo parsing | tree-sitter |
| Optional optimization | Rust |

## Active Frontend Path

For contributors, the current desktop UI path is:

```text
desktop/src/main.tsx
  -> MonitorProvider
  -> desktop/src/App-v0.tsx
```

`desktop/src/App.tsx` exists in-repo, but it is not the mounted entrypoint today.
If you are changing user-facing desktop behavior, start from the active path above unless the maintainer docs say otherwise.

## Domain Model

Core entity: `musical_asset`

| Type | Description |
|------|-------------|
| `track_analysis` | Full audio analysis result |
| `repo_analysis` | Current compatibility type for code, log, and source-signal analysis baselines |
| `base_asset` | Reuseable musical segment |
| `composition_result` | Assembled composition |

## Quick Start

### Prerequisites

- Node.js 20+
- Rust (stable) + Cargo
- Python 3.11+
- System audio libs: `sudo apt install libasound2-dev libssl-dev`

### First 10 Minutes

If you want to understand Maia quickly without reading the whole codebase first:

1. Install dependencies.
2. Start the desktop app with `cd desktop && npm run tauri dev`.
3. Use a real track from your machine or one already present in your local library.
4. Use one of the bundled log fixtures under `desktop/test/logs/`.
5. Start passive monitoring and verify the evidence tail, deck, anomalies, and audio bed together.

The highest-value local fixtures for a first run are:

- `desktop/test/logs/maia_spring_logs/customers-service.log`
- `desktop/test/logs/maia_spring_logs/vets-service.log`
- `desktop/test/logs/maia-log-sources-loghub-jvm/Zookeeper_2k.log`

If you want a release-style manual pass instead of a quick demo, use:

- `docs/pre-release-manual-test-plan.md`

## Project Layout

- `desktop/`: active Tauri + React + TypeScript desktop app
- `analyzer/`: Python package root; active runtime code is in `analyzer/src/maia_analyzer/`
- `contracts/`: JSON schemas for analyzer requests/responses
- `database/`: SQLite schema
- `demo/`: non-runtime demo renders kept for validation and storytelling
- `scripts/dev/`: local development helpers
- `scripts/demo/`: local demo signal generators
- `site/`: landing page
- `scripts/verification/`: optional demo and verification helpers for analyzer and sonification experiments

### Install dependencies

```bash
# Desktop app
cd desktop
npm install

# Python analyzer runtime
cd ..
python3 -m pip install -e ./analyzer
```

### Development

```bash
# Start the active desktop app
cd desktop
npm run tauri dev
```

### First Contributor Map

If you are new to the repository, start from the layer you actually want to change:

- `desktop/src/`: active desktop UX, monitoring flows, Web Audio, React state
- `desktop/src-tauri/src/main.rs`: native commands, filesystem, SQLite, transient stream sessions
- `analyzer/src/maia_analyzer/`: deterministic analysis logic
- `contracts/`: JSON boundary between desktop and analyzer

If you are extending Maia beyond logs, read `docs/signal-streams-roadmap.md` before adding a new adapter. New sources should normalize into source evidence and anomaly/pressure metrics instead of hard-coding source-specific behavior into the UI.

For the active frontend shell, the mounted path is:

```text
desktop/src/main.tsx
  -> MonitorProvider
  -> desktop/src/App-v0.tsx
```

That is the first path to inspect before changing monitor UX or startup behavior.

### Analyzer CLI (optional)

```bash
# Health check
PYTHONPATH=analyzer/src python3 -m maia_analyzer.cli health

# Analyze via JSON contract
echo '{
  "contractVersion": "1.0",
  "requestId": "demo-1",
  "action": "analyze",
  "payload": {
    "assetType": "repo_analysis",
    "source": { "kind": "directory", "path": "/path/to/repo" },
    "options": { "inferCodeSuggestedBpm": true }
  }
}' | PYTHONPATH=analyzer/src python3 -m maia_analyzer.cli analyze
```

### Deploy landing (`/site`) to Cloudflare Pages

The landing uses Vite 5. If you run `wrangler deploy`, Wrangler may try framework auto-detection and fail asking for Vite 6+.
Use Pages deployment instead:

```bash
cd site
npm install
npm run build
CLOUDFLARE_PAGES_PROJECT=maia npm run deploy:pages
```

For Cloudflare build settings, use:
- Build command: `npm run build`
- Build output directory: `dist`
- Deploy command: leave empty (Pages handles publish) or use `npm run deploy:pages` in CI.

### Tests

```bash
# Analyzer tests
python3 -m pip install -e './analyzer[dev]'
python3 -m pytest analyzer/tests -v --cov=maia_analyzer --cov-report=term-missing --cov-report=xml

# Desktop tests
cd desktop
npm run coverage
```

## Contributor Quick Loop

For the active desktop product path, the fastest safe local loop is:

```bash
cd desktop
npm run typecheck
npm run lint
npm run test:run
```

Before proposing a release or a broader refactor pass:

```bash
cd desktop
npm run coverage
```

Before publishing publicly or tagging a release candidate, also run the manual flow in:

- `docs/pre-release-manual-test-plan.md`

Repository hooks are tracked in `.githooks/`. After cloning, install them with:

```bash
make hooks-install
```

## UI Copy and Localization

- Active desktop translations live in `desktop/src/i18n/`
- `desktop/src/i18n/types.ts` is the stable translation contract import for the app
- `desktop/src/i18n/locales/` contains the per-domain locale slices used to compose `en` and `es`
- `desktop/src/i18n/en.ts` and `desktop/src/i18n/es.ts` must stay structurally aligned
- `desktop/test/i18n/translationsShape.test.ts` guards that alignment automatically

If you add or rename UI copy, update both locales in the same change.

## Support

- Use [SUPPORT.md](SUPPORT.md) for triage guidance.
- Use GitHub Issues for bugs, features, and documentation improvements.
- Use [SECURITY.md](SECURITY.md) for private vulnerability reporting.

### Coverage

```bash
cd analyzer
python -m pytest tests --cov=maia_analyzer --cov-report=term-missing --cov-report=xml --cov-report=html
```

Or with the helper target:

```bash
cd analyzer
make coverage
```

Desktop coverage:

```bash
cd desktop
npm run coverage
```

## JSON Contracts

All data flowing between the Python analyzer and the desktop app uses JSON contracts defined in:

- `contracts/analyzer-request.schema.json`
- `contracts/analyzer-response.schema.json`
- `contracts/musical_asset_schema.json`

## Engineering Rules

- Analyzer and desktop app are decoupled via JSON contracts
- Deterministic heuristics over black-box ML in MVP
- All analysis stored locally in SQLite
- Linux is the primary dev environment
