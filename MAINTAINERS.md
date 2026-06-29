# Maintainers

This repository is intended to be published as an MIT-licensed open source project.
This file describes the maintainer responsibilities and ownership model expected around that publication.

## Maintainer responsibilities

Maintainers are expected to:

- protect the runtime boundaries between `desktop`, `desktop/src-tauri`, and `analyzer`
- review changes for product coherence, not only code correctness
- keep `README.md`, `CONTRIBUTING.md`, and architecture docs aligned with the active runtime
- ensure contract changes are reflected in `contracts/`, frontend parsing, analyzer parsing, and tests
- keep public-facing issues and pull requests triaged
- reject changes that add unnecessary cross-runtime coupling

## Runtime ownership

- Frontend and operator UX:
  - `desktop/src/`
- Native runtime, persistence, and transient stream session layer:
  - `desktop/src-tauri/src/main.rs`
- Deterministic analysis engine:
  - `analyzer/src/maia_analyzer/`
- Public docs and contributor onboarding:
  - `README.md`
  - `CONTRIBUTING.md`
  - `docs/`

## Release readiness responsibilities

Before tagging or promoting a release, maintainers should verify:

- the active entrypoint described in docs is still accurate
- demo assets and fixtures are safe to keep public
- CI is green for quality, tests, and build checks
- `.github/CODEOWNERS` reflects the actual reviewer/owner map for the public repository
- any contract or persistence changes are explicitly called out
- monitoring behavior remains understandable for first-time contributors and users

## Decision principles

When in doubt, prefer:

- deterministic behavior over opaque magic
- small typed boundaries over convenience shortcuts
- extracted pure logic over larger stateful screens
- local-first behavior over hidden online dependencies
- accurate docs over aspirational docs

## Current note

At the time of writing:

- `desktop/src/App-v0.tsx` remains the mounted desktop shell
- `desktop/src/App.tsx` exists but is not the mounted entrypoint

Any maintainer review touching the desktop shell should validate that contributors are still being guided toward the active surface.
