# Maia – Auditory Monitoring for Technical Teams

Maia is a local-first desktop app for auditory monitoring. A team chooses a favorite track or playlist as the musical base, then Maia turns repositories, logs, streams, file scans, and reusable sonic assets into a continuous, pleasant monitoring mix that can run in the background and be understood by ear.

The product is not meant to replace dashboards. It adds an audible monitoring layer so operators can hear when a system is calm, tense, drifting, or anomalous without staring at a screen.

Source of truth:

- Product app: `desktop/`
- Active analyzer runtime: `analyzer/src/maia_analyzer/`
- Landing: `site/`

The product app is started from `desktop/` with `npm run tauri dev`.

## Current Product Status

The current desktop app already includes:

- Local library management for tracks, playlists, repositories/log files, base assets, and composition results
- DJ-style analyzer views for waveform, beat grid, BPM curve, key/energy metadata, repository metrics, base asset metrics, and composition structure
- Native Tauri imports with managed local snapshots and SQLite persistence
- Repository parsing with tree-sitter-backed language support for Java, Kotlin, Python, TypeScript/TSX, Rust, and Go
- Local log-file analysis plus live sonification with Web Audio
- Live monitor scenes with genre palettes, sequencer presets, component routing, beat-locked scheduling, and base-track/base-playlist anchoring
- Session persistence, replay, replay bookmarks, and feedback-driven mix suggestions for monitored streams
- Composition planning with `plan.json`, generated `preview.wav`, in-app playback, and WAV stem export
- Track analysis enriched with key signature, energy level, danceability, and basic structural cues

What is still evolving is the longer-running product mode: Maia should ultimately behave like a background music server for a team, where the desktop app is the control surface and the audio layer keeps monitoring systems by ear.

## Architecture

| Component | Technology |
|-----------|-----------|
| Desktop shell | Tauri 2 + React + TypeScript |
| Analyzer | Python |
| Local database | SQLite |
| Repo parsing | tree-sitter |
| Optional optimization | Rust |

## Domain Model

Core entity: `musical_asset`

| Type | Description |
|------|-------------|
| `track_analysis` | Full audio analysis result |
| `repo_analysis` | Code/log repository scan result |
| `base_asset` | Reuseable musical segment |
| `composition_result` | Assembled composition |

## Quick Start

### Prerequisites

- Node.js 20+
- Rust (stable) + Cargo
- Python 3.11+
- System audio libs: `sudo apt install libasound2-dev libssl-dev`

## Project Layout

- `desktop/`: active Tauri + React + TypeScript desktop app
- `analyzer/`: Python package root; active runtime code is in `analyzer/src/maia_analyzer/`
- `contracts/`: JSON schemas for analyzer requests/responses
- `database/`: SQLite schema
- `site/`: landing page

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
python3 -m pytest analyzer/tests -v

# Desktop tests
cd desktop
npm run test:run
```

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
