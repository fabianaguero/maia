# Testing and Quality

This document defines the active quality gates for Maia before changes are merged or released.

It complements:

- [docs/frontend-architecture.md](frontend-architecture.md)
- [docs/open-source-maintainer-guide.md](open-source-maintainer-guide.md)
- [docs/github-publish-checklist.md](github-publish-checklist.md)

## Quality goals

For the public MIT release, Maia should feel stable both as a product and as a contributor codebase.

That means:

- deterministic analyzer behavior
- small, testable frontend runtimes and view-models
- explicit contracts between React, Rust, and Python
- visible coverage on the most failure-prone monitor flows
- consistent translation, loading, and error states

## Active quality gates

The repository currently validates three surfaces in CI:

1. `analyzer/`
2. `desktop/`
3. `site/`

The main workflow is:

- `.github/workflows/quality.yml`

Current CI expectations:

- analyzer: Ruff, mypy, tests, coverage XML
- desktop: typecheck, lint, Vitest coverage, production build
- site: lint, production build

## Current desktop baseline

As of June 26, 2026, the desktop Vitest coverage baseline is:

- statements / lines: `73.92%`
- branches: `70.59%`
- functions: `80.65%`
- suite size: `174` test files, `635` passing tests, `3` skipped

Current hotspots with the largest remaining risk or debt:

- `desktop/src/features/analyzer/components/LiveLogMonitorPanel.tsx`
- `desktop/src/features/monitor/MonitorContext.tsx`
- `desktop/src/hooks/useAppCatalogActions.ts`

Recently reduced hotspots:

- `desktop/src/App-v0.tsx` now delegates screen-model assembly to `useAppV0ContentModel.ts`, so the mounted shell stays thin and easier to regression-test
- `desktop/src/App.tsx` now delegates monitor/session launch behavior to `useAppMonitorActions.ts` and catalog/import maintenance behavior to `useAppCatalogActions.ts`
- `desktop/src/App.tsx` now also delegates selection/inspection/navigation callbacks to `useAppSelectionActions.ts`, reducing inline closures in the legacy shell
- `desktop/src/appMonitorActionsRuntime.ts` now covers replay-session draft recovery, persistence decisions, and monitored-repository resolution with focused runtime tests
- `desktop/src/features/inspect/InspectScreen.tsx` is now a lightweight selector with dedicated `InspectTrackView`, `InspectRepositoryView`, and `InspectBaseAssetView` surfaces
- `desktop/src/features/session/SessionScreen.tsx` now delegates shell rendering to extracted header, notice, and panel components while keeping session orchestration local
- `desktop/src/features/library/LibraryScreen.tsx` now delegates toolbar, drawer, empty-state, and tab content responsibilities to dedicated components
- `desktop/src/features/analyzer/components/TrackPerformancePanel.tsx` now delegates repeated cue and loop editors to extracted components
- `desktop/src/features/analyzer/components/LiveLogMonitorPanel.tsx` has begun moving visual and playlist-editing logic into extracted units such as `LiveWaveformCanvas.tsx` and `liveLogMonitorPlaylistEditorRuntime.ts`
- `desktop/src/features/analyzer/components/liveLogMonitorPlaylistViewState.ts` now covers playlist summary/editor/option derivation with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorInteractionRuntime.ts` now covers replay scrubbing and bookmark/anomaly-focus selection with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorControlRuntime.ts` and `liveLogMonitorAudioCleanupRuntime.ts` now cover start/stop lifecycle decisions and audio-graph teardown with focused tests
- `desktop/src/features/analyzer/components/liveLogMonitorPreferencesRuntime.ts` now covers repo-reset defaults, persisted monitor-preferences payloads, and guide-track playlist seeding with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorBackgroundRuntime.ts` now covers background-deck lifecycle decisions, transition scheduling, and start-plan derivation with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorMutationRuntime.ts` now covers reactive mutation resolution and background automation-plan derivation with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorCuePlaybackRuntime.ts` now covers cue-layer planning, audible-voice filtering, external-layer volume, and playback-engine routing with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorStreamUpdateRuntime.ts` now covers known-component merging, recent-history derivation, tail-window selection, and explanation-selection rules with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorSessionRuntime.ts` now also covers start-reset defaults and beat-clock / beat-looper boot planning with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorActionRuntime.ts` now covers stop-reset defaults, bounce filename derivation, and bookmark/replay-feedback profile selection with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorSequencerRuntime.ts` now covers sequencer preview batching and preview-volume derivation with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorCueExecutionRuntime.ts` now covers external-layer gating, bounce-window accumulation, and beat-aware cue timing with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorCueScheduleRuntime.ts` now covers cue offset/duration/playback-rate derivation for sample and track-slice playback with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorBeatRuntime.ts` now covers beat subdivision timing and downbeat/offbeat pulse shaping with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorUpdateDerivationRuntime.ts` now covers known-component expansion, routed cue derivation, and current-track / explanation selection inputs with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorSampleRuntime.ts` now covers managed sample-source resolution and fetch/decode helpers with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorBackgroundDeckRuntime.ts` now covers deck snapshots plus guide-track URL/cache loading helpers with focused runtime tests
- `desktop/src/features/analyzer/components/LiveLogMonitorDeckSection.tsx` and `LiveLogMonitorLiveDeck.tsx` now have focused composition tests so live monitor UI assembly is covered without invoking the full audio runtime
- `desktop/src/features/monitor/monitorProviderStartRuntime.ts` now also covers the reusable live-start base snapshot used by `MonitorContext`, reducing provider-only wiring risk

Current strengths:

- monitor provider runtimes
- simple monitor runtimes and hooks
- i18n parity checks
- audio/session property-based coverage

## Local commands

### Desktop

```bash
cd desktop
npm run quality
npm run coverage
npm run build
```

### Analyzer

```bash
python3 -m pip install -e './analyzer[dev]'
python3 -m pytest analyzer/tests -v --cov=maia_analyzer --cov-report=term-missing --cov-report=xml
```

## Coverage priorities

Coverage is most valuable where runtime mistakes create broken monitoring behavior, black screens, or misleading audio feedback.

Priority areas:

- `desktop/src/App-v0.tsx` orchestration and section routing
- `desktop/src/features/simple/SimpleMonitorScreen.tsx` and extracted monitor runtimes
- `desktop/src/features/simple/ConnectionsScreen.tsx` and connection state runtimes
- `desktop/src/features/monitor/MonitorContext.tsx` plus provider runtimes
- `desktop/src/features/analyzer/components/LiveLogMonitorPanel.tsx` and extracted pure runtimes

Good coverage in Maia is not just line count. It must also validate:

- starting a session
- attaching a persisted session
- replay activation
- pause/resume/seek behavior
- connection creation and testing
- translation integrity
- active shell rendering without runtime crashes

## Frontend testing strategy

The desktop app now uses a layered testing approach:

- component tests for rendering and interaction
- runtime/view-model tests for pure logic
- hook tests for state wiring
- translation tests for cross-language consistency
- property-based tests for audio/session behavior that benefits from broader input coverage

Preferred direction for new code:

- move logic out of large screens first
- test pure runtimes before component shells
- keep Tauri bridge calls behind typed wrappers and mock those at the edges

## Analyzer testing strategy

The analyzer should stay deterministic and contract-driven.

Preferred tests:

- contract validation
- repository/log chunk analysis behavior
- DSP utility correctness
- action routing in `service.py`

Avoid coupling analyzer tests to desktop state assumptions unless the JSON contract explicitly requires it.

## Open-source contributor rule

Before opening a large PR, contributors should run:

```bash
cd desktop && npm run quality && npm run coverage
cd ../analyzer && python3 -m pytest tests -v
```

If coverage drops in a risky runtime path, the PR should add tests or explain the tradeoff explicitly.
