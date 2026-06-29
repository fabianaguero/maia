# Contributing to Maia

Thanks for contributing to Maia.
This repository is a local-first desktop product with three active runtime layers:

- `TypeScript / React` for UI, operator workflows, and Web Audio playback
- `Rust / Tauri` for native commands, SQLite persistence, managed asset storage, and transient stream sessions
- `Python` for deterministic analysis over JSON contracts

Before changing code, read:

- [README.md](README.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/frontend-architecture.md](docs/frontend-architecture.md)
- [docs/open-source-maintainer-guide.md](docs/open-source-maintainer-guide.md)
- [docs/sdd.md](docs/sdd.md)
- [SUPPORT.md](SUPPORT.md)
- [MAINTAINERS.md](MAINTAINERS.md)

## Project Principles

- Keep the analyzer and desktop runtime decoupled through explicit JSON contracts.
- Prefer deterministic heuristics over opaque ML in the core monitoring path.
- Keep analysis local-first.
- Treat the product as a DJ-style auditory monitor, not a generic dashboard.
- Keep Linux as the primary development environment.

## Runtime Ownership

Use the right layer for the right problem.

- `desktop/src/`: UI composition, state wiring, monitor UX, Web Audio, browser fallbacks
- `desktop/src-tauri/src/main.rs`: filesystem, SQLite, native commands, asset snapshotting, stream-session runtime
- `analyzer/src/maia_analyzer/`: audio analysis, repository/log analysis, contract parsing

Do not move native concerns into React.
Do not move persistence into Python.
Do not bypass the JSON contract to couple Rust and Python implicitly.

## Important Current State

- The mounted frontend entrypoint is `desktop/src/main.tsx`.
- `main.tsx` currently renders `desktop/src/App-v0.tsx`.
- `desktop/src/App.tsx` exists, but it is not the mounted shell today.

If you are changing the active desktop product surface, validate that you are editing the mounted path first.

## Open Source Repository Expectations

This repository is intended for public MIT-licensed publication on GitHub.
That means contributors should assume:

- documentation is part of the product surface
- runtime boundaries should be understandable to first-time contributors
- issue templates, support docs, and contributor guidance should stay accurate
- CI checks should remain representative of the active product, not only of dead code paths

If your change materially alters the active shell, monitor flow, or public contributor story, update the relevant docs in the same pull request.

## Development Setup

Prerequisites:

- Node.js 20+
- Rust stable + Cargo
- Python 3.11+
- Linux dev packages: `libasound2-dev` and `libssl-dev`

Install:

```bash
cd desktop
npm install

cd ../site
npm install

cd ..
python3 -m pip install -e ./analyzer
```

Run the desktop app:

```bash
cd desktop
npm run tauri dev
```

Run the analyzer CLI directly:

```bash
PYTHONPATH=analyzer/src python3 -m maia_analyzer.cli health
```

## Tests

Analyzer:

```bash
python3 -m pip install -e './analyzer[dev]'
python3 -m pytest analyzer/tests -v
```

Desktop:

```bash
cd desktop
npm run test:run
```

Coverage:

```bash
cd desktop
npm run coverage

cd ../analyzer
make coverage
```

## Quality Checks

Repository-wide:

```bash
make quality
```

Install local git hooks:

```bash
make hooks-install
```

Strict quality gates:

```bash
make quality-strict
```

Auto-format:

```bash
make format
```

Hook stages:

- `pre-commit` runs `make quality-pre-commit`
- `pre-push` runs `make quality-pre-push`

Per runtime:

```bash
# Python
python3 -m pip install -e './analyzer[dev]'
python3 -m ruff check --config analyzer/pyproject.toml analyzer/src/maia_analyzer/*.py analyzer/tests/*.py scripts/demo/*.py scripts/verification/*.py
python3 -m mypy --config-file analyzer/pyproject.toml analyzer/src/maia_analyzer/*.py
python3 -m black --check --workers 1 --config analyzer/pyproject.toml analyzer/src/maia_analyzer/*.py analyzer/tests/*.py scripts/demo/*.py scripts/verification/*.py

# Desktop
cd desktop
npm run quality
npm run quality:strict
npm run rust:fmt:check
npm run rust:clippy

# Site
cd ../site
npm run quality
npm run quality:strict
```

## Contribution Guidelines

### Contracts

If you change cross-runtime payloads:

- update `contracts/`
- update `desktop/src/contracts.ts`
- update analyzer-side parsing in `analyzer/src/maia_analyzer/contracts.py`
- update tests on both sides when needed

### Frontend

- Maintain strict TypeScript.
- Do not introduce `any` without a strong reason.
- Prefer extracted pure logic for monitor behavior over growing large screens further.
- Preserve the existing product language: deck controls, waveform transport, anomaly-linked monitor UI.

### Rust backend

- Keep native commands explicit and typed.
- Prefer persisting normalized records through one clear path instead of scattering DB writes.
- Be careful with long functions in `main.rs`; if a change grows a domain further, consider extracting helpers or modules.

### Python analyzer

- Keep behavior deterministic and explainable.
- Favor stable heuristics and bounded analysis over implicit magic.
- Treat repository/log analysis and track analysis as pure request/response work, not UI state.

## Pull Requests

Good pull requests usually include:

- a short problem statement
- the runtime layer affected
- contract impact, if any
- persistence impact, if any
- test coverage added or intentionally skipped
- screenshots or short recordings for UI-facing changes

If a change touches more than one runtime, explain the boundary clearly.

## Reporting Bugs

Please use GitHub Issues with enough context to reproduce the problem.
Useful details:

- OS and version
- whether the bug happened in Tauri desktop mode or browser/mock mode
- file type or source adapter involved
- logs, screenshots, or a minimal reproduction path

## Before Opening the Repository Publicly

The repository now includes an MIT `LICENSE`.
Before publishing publicly, still complete the rest of the checklist in `docs/github-publish-checklist.md`.
