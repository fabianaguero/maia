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

As of June 29, 2026, the desktop Vitest coverage baseline is:

- statements / lines: `95.23%`
- branches: `77.47%`
- functions: `90.78%`
- suite size: `374` test files, `1144` passing tests, `3` skipped

Current hotspots with the largest remaining risk or debt:

- `desktop/src/features/analyzer/components/WaveformPlaceholder.tsx`

Recently reduced hotspots:
- `desktop/src/hooks/useLibraryBootstrap.ts` now has direct hook coverage for sorted hydration, selection resolver callbacks, bootstrap failure normalization, and late success/error cancellation after unmount
- `desktop/src/features/library/components/LibraryTabContent.tsx` now has full direct component coverage for loading, empty-state, and populated tab branches across tracks, sources, connections, and base assets
- `desktop/src/api/mockLibrary.ts` now has direct API coverage for legacy track snapshot normalization, playlist storage recovery, malformed browser-storage fallbacks, fallback title derivation, cue/loop sorting, and source relink edge cases, bringing the focused file coverage to `93.73%` statements / lines, `82.95%` branches, and `100%` functions
- `desktop/src/api/mockCompositionResults.ts` now has direct API coverage for manual, track, playlist, repo, and repository-only composition imports plus legacy-record normalization and invalid playlist-BPM rejection, bringing the focused file coverage to `96.97%` statements / lines, `83.15%` branches, and `100%` functions
- `desktop/src/features/analyzer/components/ExportCompositionPanel.tsx` now has direct component coverage for desktop export success, browser-download fallback, dialog cancellation reset, preview WAV export, and surfaced non-Tauri stem/file failures, bringing the focused file coverage to `100%` statements / lines, `87.8%` branches, and `100%` functions
- `desktop/src/features/simple/connectionsProbeRuntime.ts`, `connectionsScreenStateRuntime.ts`, and `useConnectionsScreenState.ts` now have direct focused coverage for waiting vs ready cloud probes, file-tail idle summaries, startup/delete/save failures, ephemeral cleanup behavior, and live-tail polling assembly, bringing the focused coverage to `97.5%` statements / lines and `91.89%` branches for `connectionsProbeRuntime.ts`, `100%` statements / lines and `91.3%` branches for `connectionsScreenStateRuntime.ts`, and `100%` statements / lines / branches / functions for `useConnectionsScreenState.ts`
- `desktop/src/features/simple/useConnectionTailController.ts` and `useConnectionTestController.ts` now have direct hook coverage for live-tail polling, start/poll failures, per-connection probe success/error feedback, and ephemeral session cleanup, bringing `useConnectionTailController.ts` to `96.94%` statements / lines and `88.23%` branches in the focused run
- `desktop/src/features/simple/useSimpleMonitorLaunchState.ts`, `useSimpleMonitorSourceSelector.ts`, `simpleMonitorViewModel.ts`, and `src/utils/monitorLabels.ts` now have direct focused coverage for launch failure logging, source-connection fallback loading, deck/track fallback derivation, and monitor label formatting contracts, bringing the focused coverage to `100%` statements / lines / branches / functions for `useSimpleMonitorLaunchState.ts`, `97.8%` statements / lines and `100%` branches for `useSimpleMonitorSourceSelector.ts`, `100%` statements / lines / functions and `85.71%` branches for `simpleMonitorViewModel.ts`, and `100%` statements / lines / branches / functions for `monitorLabels.ts`

- `desktop/src/features/inspect/InspectContextBar.tsx` now has full direct component coverage
- `desktop/src/features/inspect/InspectTrackView.tsx` now has direct coverage for compare audition wiring, cue updates, performance updates, metadata rendering, compose delegation, and active-track resets
- `desktop/src/features/analyzer/components/useLiveLogMonitorSampleBank.ts` now has direct hook coverage for unavailable, missing-audio-context, successful decode, cancellation, and error-reporting branches
- `desktop/src/providers/hooks/usePlaylistSources.ts` now has stable injected dependencies for bootstrap/OAuth/local-directory/disconnect flows, and both the hook plus `playlistSourcesRuntime.ts` now have direct focused coverage across success and failure branches
- `desktop/src/features/analyzer/components/WaveformPlaceholder.tsx` plus `waveformPlaceholderRuntime.ts` now have additional direct coverage for partial-analysis markers, pending/empty phrase summaries, unclamped loop previews, and boundary-drag rendering branches
- `desktop/src/features/analyzer/components/WaveformPlaceholder.tsx` plus `waveformPlaceholderRuntime.ts` now also cover direct beat-grid anchor drag, editable cue drag suppression, non-seekable overlays, and residual pointer-defense branches, bringing the focused file coverage to `90.73%` statements / lines and `87.05%` branches for `WaveformPlaceholder.tsx`, while `waveformPlaceholderRuntime.ts` remains at `100%` statements / lines / functions and `97.56%` branches
- `desktop/src/features/library/components/LibraryEmptyState.tsx` now has direct component coverage for icon, copy, and primary action rendering
- `desktop/src/features/library/components/ImportBaseAssetForm.tsx`, `ImportCompositionForm.tsx`, `ImportRepositoryForm.tsx`, and `ImportTrackForm.tsx` now have direct form coverage for validation, native browse flows, reset behavior, and the Cloud Run connection branch
- `desktop/src/hooks/useAppCatalogImportActions.ts` now has direct hook coverage for track/base/composition imports plus directory-based repository rescue flows and import-failure branches
- `desktop/src/features/library/useLibraryScreenToolbarActions.tsx` now has direct hook coverage for toggle, seed, playlist, relink, and orphan-cleanup actions across both track and source tabs
- `desktop/src/features/simple/OnboardingWizard.tsx` now has direct wizard coverage for source-type switching, preset selection, validation gating, and completion callbacks
- `desktop/src/features/compose/ComposeScreen.tsx` now has direct coverage for empty-state routing, composition selection, tab switching, and render-preview callback wiring
- `desktop/src/features/inspect/InspectScreen.tsx` now has direct coverage for empty, track, repository, and base-asset screen selection paths
- `desktop/src/features/simple/useSimpleModeLibraryPreview.ts` now has direct hook coverage for missing-path bailouts, track switching, `ended` cleanup, and `play()` failure reset behavior
- `desktop/src/hooks/useAppCatalogLibraryActions.ts` now has direct hook coverage for success, null-result, and thrown-error branches across track, repository, and playlist maintenance actions
- `desktop/src/features/simple/monitorDeckCanvasPalette.ts` now has direct coverage for `withAlpha`, document/skin fallback, and per-skin preset palette branches
- `desktop/src/features/simple/ModeTransition.tsx` now has direct hook coverage for transition timing and mode-change reentry behavior
- `desktop/src/features/simple/ProMonitorScreen.tsx` now has direct component coverage for playback toggle and bookmark growth interactions
- `desktop/src/features/simple/monitorDeckCanvasDrawRuntime.ts` now has direct branch coverage for phrase bands, log quantization, anomaly wash, marker beams, and burst overlays
- `desktop/src/features/simple/monitorDeckOverviewCanvas.ts` now has direct orchestration coverage for null-context bailouts, density rendering, anomaly markers, and active playhead selection
- `desktop/src/features/library/components/TracksTable.tsx`, `RepositoriesTable.tsx`, `BaseAssetsTable.tsx`, and `CompositionResultsTable.tsx` now have direct UI coverage for selection, labels, action isolation, and state badges
- `desktop/src/features/session/sessionDisplaySourceRuntime.ts` now has direct coverage for source lookup, path fallback, label fallback, and Tauri-vs-browser bed URL resolution
- `desktop/src/api/tauri.ts` now has direct bridge helper coverage for fallback, retry, and rethrow behavior
- `desktop/src/hooks/useLibraryTrackMutationActions.ts` now has direct hook coverage for track import, background analyzer refresh, missing-file reanalyze failures, and directory relink flows
- `desktop/src/api/library.ts`, `desktop/src/api/repositories.ts`, and `desktop/src/api/sessions.ts` now have direct native-pass-through and fallback coverage, and `sessions.ts` no longer drops async invoke failures inside guarded calls
- `desktop/src/App-v0.tsx` now delegates screen-model assembly to `useAppV0ContentModel.ts`, so the mounted shell stays thin and easier to regression-test
- `desktop/src/App-v0.tsx` now has direct coverage for both `AppContentV0` and the provider-wrapped default export, so the compatibility shell no longer depends only on indirect content-model tests
- `desktop/src/hooks/useAppV0ScreenModel.ts` now has direct hook coverage for final App-v0 shell/content model assembly, reducing reliance on the mounted component test alone
- `desktop/src/App.tsx` now delegates monitor/session launch behavior to `useAppMonitorActions.ts` and catalog/import maintenance behavior to `useAppCatalogActions.ts`
- `desktop/src/hooks/useAppMonitorActions.ts` is now a thin composition layer over `useAppMonitorGuideActions.ts` and `useAppMonitorSessionActions.ts`, and both split hooks now have direct tests
- `desktop/src/App.tsx` now also delegates selection/inspection/navigation callbacks to `useAppSelectionActions.ts`, reducing inline closures in the legacy shell
- `desktop/src/App.tsx` now also delegates topbar/now-playing shell rendering to `AppTopbar.tsx`, `AppMonitorOverview.tsx`, and `appShellRuntime.ts`
- `desktop/src/AppSectionContent.tsx` now delegates curate/session screen wiring to `AppCurateSection.tsx` and `AppSessionSection.tsx`, so the compatibility router stays focused on section selection
- `desktop/src/AppCurateSection.tsx` and `AppSessionSection.tsx` now have direct wrapper coverage for simple/expert surface routing, wizard callback delegation, and monitor-session prop mapping into the session screen
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
- `desktop/src/features/analyzer/components/useLiveLogMonitorReplayState.ts` now has direct hook coverage for replay bookmark wiring and feedback recommendation derivation
- `desktop/src/features/analyzer/components/useLiveLogMonitorDeckModel.tsx` now has direct hook coverage for deck presentation assembly and live-deck prop composition
- `desktop/src/features/analyzer/components/useLiveLogMonitorLifecycle.ts` now has direct hook coverage for repo-reset, seeded-playlist, stream-subscription, replay cleanup, and owned-audio teardown behavior
- `desktop/src/features/analyzer/components/useLiveLogMonitorSessionActions.ts` now has direct hook coverage for live start behavior and failure normalization
- `desktop/src/features/analyzer/components/useLiveLogMonitorSessionActions.ts` now also covers stop-session reset behavior, `/tmp` file-start warnings, and bounce-export browser download wiring
- `desktop/src/features/analyzer/components/useLiveLogMonitorOperatorActions.ts` now has direct hook coverage for mute restore, replay feedback application, bookmark jumps, and trace selection
- `desktop/src/features/analyzer/components/useLiveLogMonitorSurfaceState.ts` now centralizes the live monitor local state/refs scaffold so future refactors can cut the panel without re-threading every declaration
- `desktop/src/features/analyzer/components/useLiveLogMonitorAuxPlayback.ts` now has direct hook coverage for WebAudio blob playback, WAV fallback routing, and the panel test-tone path
- `desktop/src/features/analyzer/components/useLiveLogMonitorOrchestrator.ts` now has direct hook coverage for repo-mismatch bailouts and live stream update orchestration
- `desktop/src/features/analyzer/components/ManagedAudioPlayer.tsx` now has direct component coverage for desktop byte loading, cue jumps, transport UI, browser-fallback messaging, and load/play failure surfacing
- `desktop/src/features/analyzer/components/LiveMonitorMutationTracePanel.tsx` now has direct component coverage for mapped-track rendering, replay-linked mutation cards, anomaly styling, and empty-state fallback
- `desktop/src/features/analyzer/components/LiveSonificationScenePanel.tsx` now has direct component coverage for synth fallback states, managed-source routing, anchor/base/composition metadata, and live scene master-chain presentation
- `desktop/src/features/analyzer/components/CompositionRenderPreviewPanel.tsx` now has direct component coverage for derived render metrics, preview playback states, stem layout, automation moves, and export-target presentation
- `desktop/src/features/analyzer/components/CompositionOverviewPanel.tsx` and `CompositionMetricsPanel.tsx` now have direct component coverage for analyzer-plan metadata, fallback materialization states, and nested metric derivation
- `desktop/src/features/analyzer/components/ExportCompositionPanel.tsx` now has direct component coverage for managed export success, hidden-action states, stem export confirmation, and browser fallback download behavior
- `desktop/src/features/analyzer/components/BaseAssetOverviewPanel.tsx` and `BaseAssetMetricsPanel.tsx` now have direct component coverage for inspector hero metadata, tag rendering, storage/size formatting, and analyzer status fallbacks
- `desktop/src/features/analyzer/components/RepositoryOverviewPanel.tsx` and `RepositoryMetricsPanel.tsx` now have direct component coverage for intake copy, snapshot fallbacks, file-vs-repository metric branches, AST counters, and analyzer bridge/status rendering
- `desktop/src/features/analyzer/components/SongMetadataPanel.tsx` now has direct component coverage for loading, metadata success, fetch failure, no-result messaging, and filename-based title/artist fallback
- `desktop/src/features/analyzer/components/BpmCurvePanel.tsx`, `CompositionTimelinePanel.tsx`, `LogSignalPanel.tsx`, and `RepoStatusPanel.tsx` now have direct component coverage for empty-state fallbacks plus derived SVG/section/cue/log-marker presentation
- `desktop/src/utils/audioPreview.ts` now has direct utility coverage for browser passthrough, Tauri asset URL resolution, byte-read blob fallback, and blob URL cleanup behavior
- `desktop/src/api/musicMetadata.ts` now has direct API coverage for MusicBrainz, Last.fm, and Genius fetch contracts plus merged metadata fallback behavior
- `desktop/src/providers/hooks/usePlaylistSources.ts` now delegates routing/filtering to `playlistSourcesRuntime.ts`, and both hook and runtime now have direct coverage for bootstrap, missing-source errors, local/OAuth helpers, playlist filtering, provider routing, and disconnect state shaping
- `desktop/src/providers/runtime/types.ts` now has direct coverage for provider error detection and end-user error copy across all runtime error variants
- `desktop/src/components/MonitorWaveformBar.tsx` now has direct component coverage for active-vs-idle shell rendering, listening-bed selection, audio resume CTA, HUD line ingestion, duplicate-offset suppression, and subscription teardown
- `desktop/src/components/MonitorWaveformBar.tsx` now delegates canvas sizing and Rekordbox-style frame drawing to `monitorWaveformBarRuntime.ts`, which also has direct runtime coverage for empty frames, waveform/anomaly rendering, scanline/playhead drawing, and canvas resize sync
- `desktop/src/features/analyzer/components/LiveWaveformCanvas.tsx` now has direct component coverage for inactive rendering, active frame scheduling, runtime draw delegation, and animation cleanup
- `desktop/src/features/monitor/useMonitorProviderGuideTrack.ts` now has direct hook coverage for guide-track template, loader, playlist, and deferred reload wiring
- `desktop/src/features/monitor/useMonitorProviderPlaybackControls.ts` now has direct hook coverage for replay seek, pause/resume, and step controls
- `desktop/src/features/analyzer/components/liveLogMonitorSequencerRuntime.ts` now covers sequencer preview batching and preview-volume derivation with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorCueExecutionRuntime.ts` now covers external-layer gating, bounce-window accumulation, and beat-aware cue timing with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorCueScheduleRuntime.ts` now covers cue offset/duration/playback-rate derivation for sample and track-slice playback with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorCueScheduleRuntime.ts` now also covers synth/sample/track-slice WebAudio scheduling, stereo-panner fallback, anomaly detune, and deck-entry fallback behavior
- `desktop/src/features/analyzer/components/liveLogMonitorBeatRuntime.ts` now covers beat subdivision timing and downbeat/offbeat pulse shaping with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorUpdateDerivationRuntime.ts` now covers known-component expansion, routed cue derivation, and current-track / explanation selection inputs with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorSampleRuntime.ts` now covers managed sample-source resolution and fetch/decode helpers with focused runtime tests
- `desktop/src/features/analyzer/components/liveLogMonitorBackgroundDeckRuntime.ts` now covers deck snapshots plus guide-track URL/cache loading helpers with focused runtime tests
- `desktop/src/features/analyzer/components/LiveLogMonitorDeckSection.tsx` and `LiveLogMonitorLiveDeck.tsx` now have focused composition tests so live monitor UI assembly is covered without invoking the full audio runtime
- `desktop/src/features/monitor/monitorProviderStartRuntime.ts` now also covers the reusable live-start base snapshot used by `MonitorContext`, reducing provider-only wiring risk
- `desktop/src/features/analyzer/components/useLiveLogMonitorPanelController.tsx` and `useLiveLogMonitorPanelRuntime.tsx` now have direct tests for live/replay derivation and orchestration wiring, so the monitor shell no longer depends only on indirect panel coverage
- `desktop/src/features/analyzer/components/useLiveLogMonitorPanelAudioRuntime.ts` is now a thin facade over `useLiveLogMonitorPanelAudioCore.ts` and `useLiveLogMonitorPanelAudioEffects.ts`, while `liveLogMonitorPanelAudioFeedbackRuntime.ts` keeps warning capping pure and directly testable
- `desktop/src/features/library/LibraryScreen.tsx` now delegates orchestration to `useLibraryScreenController.tsx`, and both the screen shell and controller now have direct tests
- `desktop/src/features/library/useLibraryScreenState.ts` now has direct hook coverage for initial log-connection refresh, retry/error normalization, playlist editor sync, and post-save reset behavior
- `desktop/src/features/library/components/LibraryToolbar.tsx` and `LibraryTabContent.tsx` now have direct component coverage, so library shell refactors no longer depend only on the top-level screen test
- `desktop/src/features/library/components/LibraryFormDrawer.tsx`, `LibraryPlaylistsPanel.tsx`, `LibrarySourcesListPanel.tsx`, `LibraryTracksListPanel.tsx`, `LibraryBaseAssetsListPanel.tsx`, and `LibraryConnectionsListPanel.tsx` now have direct component coverage, reducing blind spots across the full library interaction surface
- `desktop/src/features/simple/ProLibraryScreen.tsx` now has a direct smoke test for tab switching and deck data rendering, reducing blind spots in the alternate library surface
- `desktop/src/features/session/SessionSetupSelectionGrid.tsx` and `SessionSavedSessionsPanel.tsx` now have direct branch coverage for empty, alternate-mode, summary, selection, and replay-list states
- `desktop/src/features/session/SessionCreateFooter.tsx`, `SessionSetupPanel.tsx`, `SessionBoothPanel.tsx`, and `SessionTemplatePresetStrip.tsx` now have direct component coverage for launch readiness, booth actions, replay/live branching, and preset selection fallback states
- `desktop/src/features/session/SessionBoothActionBar.tsx`, `SessionBoothSignalCard.tsx`, and `SessionBoothWatchCard.tsx` now isolate booth controls plus signal/watchout detail cards from `SessionBoothPanel.tsx`, while `sessionScreenRuntime.ts` also centralizes active-session derivation, bookmark context mapping, and booth placeholder/readiness state behind focused runtime coverage
- `desktop/src/features/session/sessionBookmarkRuntime.ts`, `sessionStartPlanRuntime.ts`, and `sessionControllerDerivedRuntime.ts` now split bookmark parsing, start/replay planning, and controller-derived booth state away from the `sessionScreenRuntime.ts` barrel, preserving the public contract while reducing mixed responsibilities inside the session flow
- `desktop/src/types/library.ts` is now a barrel over `libraryAppTypes.ts`, `libraryTrackTypes.ts`, `libraryAssetTypes.ts`, and `libraryRepositoryTypes.ts`, reducing domain mixing between app navigation, track analysis/performance, composition/base assets, and repository intake contracts without forcing a broad import rewrite
- `desktop/src/features/simple/LiveTailPanel.tsx` now has direct component coverage for connecting empty states, anomaly-row linking, and header control interactions without relying only on its view-model runtime
- `desktop/src/features/simple/monitorDeckMainCanvas.ts` now has direct orchestration coverage for canvas sizing, null-context bailout, and draw-runtime delegation without snapshotting the rendered pixels
- `desktop/src/features/library/useLibraryScreenImportActions.ts` and `libraryScreenToolbarRuntime.ts` now isolate import/refresh/delete flows plus orphan-cleanup derivation from the controller, each with direct focused tests
- `desktop/src/features/library/LibraryTabStrip.tsx` now isolates tab rendering, reducing visual branching inside `LibraryScreen.tsx`
- `desktop/src/features/library/libraryScreenStateRuntime.ts` now isolates playlist editor transitions, selection sync, and connection error normalization from `useLibraryScreenState.ts`
- `desktop/src/hooks/useLibrary.ts` now delegates startup hydration to `useLibraryBootstrap.ts` and user mutations to `useLibraryMutationActions.ts`, leaving the public hook mostly as state composition
- `desktop/src/hooks/useLibraryMutationActions.ts` is now a thin facade over `useLibraryTrackMutationActions.ts` and `useLibraryPlaylistMutationActions.ts`, with direct hook coverage for the composition boundary
- `desktop/src/hooks/useAppContentBootstrap.ts`, `useAppContentShellState.ts`, `useAppContentNavigationActions.ts`, and `useAppContentSessionEffects.ts` now isolate analyzer startup hydration, local shell state, navigation/background actions, and session-bookmark refresh side effects from `useAppContentController.ts`, all with direct hook coverage
- `desktop/src/features/session/useSessionScreenController.ts` now delegates command handlers to `useSessionScreenActions.ts` and monitor/audio/event effects to `useSessionScreenEffects.ts`
- `desktop/src/features/session/SessionScreen.tsx` now delegates screen-surface prop composition to `sessionScreenViewModel.ts`, which also has direct tests
- `desktop/src/features/session/SessionSetupPanel.tsx` and `SessionSavedSessionsPanel.tsx` now delegate setup/replay sections to focused subcomponents, and both panels now have direct component tests
- `desktop/src/features/analyzer/components/LiveWaveformCanvas.tsx` now delegates canvas sizing, analyser sampling, and frame drawing to `liveWaveformCanvasRuntime.ts`, which also has direct tests
- `desktop/src/features/simple/monitorDeckCanvas.ts` is now a stable facade while overview and main-deck rendering moved into focused runtime files with existing deck-state tests still covering the public entrypoints
- `desktop/src/features/session/sessionDisplay.ts` is now a facade over formatting, base-resolution, and source/bed-url runtimes, and its tests now also cover session bed path/url behavior
- `desktop/src/features/simple/useConnectionTailController.ts` and `useConnectionTestController.ts` now have direct hook coverage, reducing risk in connection tail/probe behavior without pushing more responsibility back into `useConnectionsScreenState.ts`
- `desktop/src/features/simple/useConnectionsFormController.ts` now isolates connection draft hydration, CRUD refresh cycles, and file-browse behavior from `useConnectionsScreenState.ts`, and has direct hook coverage
- `desktop/src/features/simple/ConnectionsScreen.tsx` now stays closer to a composition shell while `ConnectionsHeroPanel.tsx` owns the headline/stats block already exercised by the screen tests
- `desktop/src/features/monitor/useMonitorProviderState.ts` now centralizes provider state/ref bootstrap so future `MonitorContext.tsx` refactors can change orchestration without reworking initialization scaffolding
- `desktop/src/features/monitor/useMonitorProviderContextValue.ts` now isolates public context-value assembly and subscription wiring from `MonitorContext.tsx`, with direct hook coverage
- `desktop/src/features/monitor/useMonitorProviderController.ts` now consolidates provider composition so `MonitorContext.tsx` is mostly context plumbing plus the provider shell
- `desktop/src/features/analyzer/components/liveLogMonitorPanelAudioInputRuntime.ts` and `liveLogMonitorPanelRuntimeBridge.ts` now cover the pure input-shaping layer for the live panel, so monitor hook tests no longer need to prove every wiring branch indirectly
- `desktop/src/features/analyzer/components/liveLogMonitorPanelRuntimeStateBridge.ts`, `liveLogMonitorPanelDeckRuntimeBridge.ts`, and `liveLogMonitorPanelDeckCallbacksRuntime.ts` now cover the pure wiring layer between live monitor hooks, deck model assembly, interactive deck callbacks, and render-state composition
- `desktop/src/features/analyzer/components/useLiveLogMonitorPanelRuntimeState.tsx` now has direct hook coverage for detached-session normalization and rerender/memoization boundaries, so the live monitor runtime state no longer depends only on one mounted happy-path test
- `desktop/src/features/analyzer/components/useLiveLogMonitorPanelAudioRuntime.ts` now has direct facade coverage for core/effects composition, return-contract stability, and repository-bound effect wiring
- `desktop/src/features/analyzer/components/useLiveLogMonitorPanelAudioEffects.ts` now has direct hook coverage for sample-bank, surface-sync, and background-lifecycle composition, reducing risk across the live audio-effects seam
- `desktop/src/features/analyzer/components/useLiveLogMonitorSurfaceSync.ts` now has direct hook coverage for persisted monitor prefs, master-volume propagation, synchronized tail scrolling, and background-node sync behavior
- `desktop/src/features/analyzer/components/useLiveLogMonitorBackgroundLifecycle.ts` now has direct hook coverage for suspend/start/restart/sync deck transitions and AudioContext resume/suspend behavior
- `desktop/src/features/analyzer/components/liveLogMonitorDeckModelBridge.ts` now covers the pure deck-presentation input shaping layer, while `useLiveLogMonitorDeckModel.tsx` keeps direct hook coverage for the assembled result
- `desktop/src/features/analyzer/components/liveLogMonitorDeckPropsViewModel.tsx` now has direct coverage for deck-section node assembly, scene/routing panel builders, and live-deck prop shaping
- `desktop/src/features/analyzer/components/useLiveLogMonitorPanelDeckRuntime.tsx` now has direct hook coverage for session/operator/deck/render composition, so the live deck shell no longer relies only on bridge tests
- `desktop/src/features/analyzer/components/useLiveLogMonitorPlayback.ts` now has direct hook coverage for empty-window bailouts, cue-layer orchestration, bounce-window accumulation, graph scheduling, and deferred sequencer preview playback
- `desktop/src/features/analyzer/components/useLiveLogMonitorBackgroundAudioEngine.ts` now has direct hook coverage for shared bus creation plus live/forced mutation automation against the active guide deck
- `desktop/src/features/analyzer/components/useLiveLogMonitorBackgroundDeckControl.ts` now has direct hook coverage for stop/start/schedule lifecycle behavior, cached buffer loading, and transition timer orchestration
- `desktop/src/features/analyzer/components/useLiveLogMonitorAudioBootstrap.ts` now has direct hook coverage for shared/local AudioContext bootstrap, analyser/master bus initialization, and unsupported/error fallback states
- `desktop/src/features/analyzer/components/useLiveLogMonitorSurfaceState.ts` now has direct hook coverage for persisted-preference hydration, scene defaults, and the mutable monitor surface scaffold returned to the panel runtime
- `desktop/src/features/analyzer/components/liveLogMonitorPanelViewModelRuntime.ts` and `liveLogMonitorPanelRenderStateRuntime.ts` now isolate status/playlist derivation plus header/setup prop assembly from the live panel deck shell
- `desktop/src/features/analyzer/components/liveLogMonitorViewModelRuntime.ts` now isolates track-selection, explanation-selection, adapter-label, and cue-preview derivation from the main live monitor view-model
- `desktop/src/features/simple/simpleMonitorScreenSectionsRuntime.ts` now isolates active/idle prop assembly from `simpleMonitorScreenRuntime.ts`, keeping the simple monitor shell closer to orchestration and less to view plumbing
- `desktop/src/features/simple/simpleMonitorScreenHookArgsRuntime.ts` now isolates active/idle hook-arg assembly from `simpleMonitorScreenStateRuntime.ts`, reducing one more large cross-surface object builder in the simple monitor flow
- `desktop/src/features/simple/useSimpleMonitorAnomalyFilterState.ts` and `simpleMonitorScreenSlicesRuntime.ts` now isolate anomaly-filter state plus explicit launch/deck slice shaping from `useSimpleMonitorScreenState.ts`, both with direct focused tests
- `desktop/src/features/simple/useSimpleMonitorScreenController.ts` now has direct hook coverage for the orchestration layer between launch state, deck runtime, anomaly filters, and final simple-monitor hook args
- `desktop/src/features/simple/useSimpleMonitorDeckController.ts` now has direct hook coverage for the composition layer beneath the simple deck runtime facade
- `desktop/src/features/simple/useSimpleMonitorDeckLiveController.ts` now isolates the reactive-audio, track-audio, and live-stream composition seam beneath the simple deck controller
- `desktop/src/features/simple/useMonitorSetupProfile.ts`, `monitorSetupProfileRuntime.ts`, `useMonitorDeckControls.ts`, and `monitorDeckControlsRuntime.ts` now have direct coverage for unified setup-profile assembly plus persisted deck-control IO and mutations
- the deck-control persistence tests now cover legacy-storage fallback plus skin-scoped profile recovery, which reduces the risk of Setup and live Monitoring drifting when operators swap booth skins
- `desktop/test/components/MonitorSetupScreen.test.tsx` now covers per-skin deck-profile persistence plus runtime-default edits from the real Setup surface, giving the refactor one UI-level guard instead of only hook/runtime checks
- `desktop/test/hooks/useAppV0MonitorLaunchFlow.test.tsx` now covers the real `useAppV0MonitorScreenState` launch bridge so successful connection and repository starts push the shell into the live monitor section
- `desktop/src/features/simple/monitorSetupSectionsRuntime.ts` now centralizes runtime-default group fallback and input sanitization for the Setup form, with focused coverage protecting empty/out-of-range edits before they hit persisted preferences
- `desktop/src/features/simple/useMonitorDeckScrub.ts` now has direct hook coverage for overview/deck scrubbing, focus-threshold gating, pointer lifecycle cleanup, and non-playable audio guards
- `desktop/src/features/analyzer/components/managedAudioPlayerRuntime.ts` now centralizes local playback state, note, scrubber, mime-type, and duration derivation for `ManagedAudioPlayer.tsx`, with focused runtime coverage protecting desktop-only audio behavior
- `desktop/src/features/analyzer/components/ManagedAudioPlayerControls.tsx` now isolates transport status, timing, and volume HUD rendering from `ManagedAudioPlayer.tsx`, keeping the player surface closer to lifecycle/audio wiring while the existing direct component coverage still guards playback interactions
- `desktop/src/features/inspect/inspectTrackViewRuntime.ts` and `InspectTrackSidebarTabs.tsx` now isolate inspect-tab metadata and sidebar composition from `InspectTrackView.tsx`, reducing repeated tab markup while keeping direct screen coverage
- `desktop/src/features/inspect/inspectTrackViewRuntime.ts` now also centralizes waveform editing models plus cue/loop/beat-grid patch derivation for `InspectTrackView.tsx`, reducing inline editor callback logic while focused runtime tests cover the patch contracts
- `desktop/src/features/analyzer/components/waveformPlaceholderRuntime.ts` now also centralizes interaction hints, summary-pill derivation, and playhead/analysis-overlay state for `WaveformPlaceholder.tsx`, reducing render-time branching while keeping the waveform screen coverage direct
- `desktop/src/features/analyzer/components/WaveformCueOverlay.tsx` and `WaveformRegionOverlay.tsx` now isolate cue/loop interaction layers from `WaveformPlaceholder.tsx`, so waveform editing remains covered through the existing direct component tests while the placeholder shell carries less inline interaction markup
- `desktop/src/features/analyzer/components/useWaveformPlaceholderInteractions.ts` now isolates drag, click-arm, phrase-select, and anchor-edit lifecycle state from `WaveformPlaceholder.tsx`, reducing effect density in the waveform surface while preserving direct interaction coverage
- `desktop/src/features/simple/useMonitorSetupScreenModel.ts` and `monitorSetupScreenRuntime.tsx` now isolate setup-screen preset partitioning and summary-icon composition from `MonitorSetupScreen.tsx`
- `desktop/src/features/simple/monitorSetupViewModelRuntime.ts` now centralizes setup summary cards, signal banks, booth identity options, preset chips, and preview-meter derivation behind a thin `monitorSetupViewModel.ts` facade, with direct runtime coverage protecting Setup screen presentation contracts
- `desktop/src/features/simple/MonitorSetupSections.tsx` is now only a barrel over smaller setup-bank components, so the Setup surface is split across focused identity, summary, preset, preview, signal, and runtime-default modules while the existing screen coverage stays intact
- `desktop/src/features/simple/MonitorSetupPanel.tsx` now delegates its selector shell to `MonitorSetupModernSelector.tsx`, its ambient waveform fallback to `MonitorSetupMiniWave.tsx`, and filter chip copy to `monitorSetupPanelRuntime.ts`, with direct panel coverage guarding source selection, preview toggles, and launch CTA wiring
- `desktop/src/features/analyzer/components/TrackPerformancePanel.tsx` now delegates its summary grid to `TrackPerformanceSummaryGrid.tsx`, while `trackPerformancePanelRuntime.ts` also covers the derived metric rows shown by the performance surface
- `desktop/src/features/analyzer/components/TrackPerformanceControlStrip.tsx` and `TrackPerformanceCueLoopSection.tsx` now isolate global performance controls plus cue/loop editing racks from `TrackPerformancePanel.tsx`, keeping the panel closer to orchestration while its direct component tests continue covering real update flows
- `desktop/src/features/analyzer/components/padSequencerPanelRuntime.ts` now centralizes sequencer seed patterns, probability cycling, BPM timing helpers, and ruler/track-row view models for `PadSequencerPanel.tsx`, keeping the live sequencing UI thinner while preserving direct panel coverage
- `desktop/src/features/simple/MonitorSetupScreen.tsx` now delegates hero and rack composition to `MonitorSetupHeroPanel.tsx` and `MonitorSetupRackSection.tsx`, keeping the screen closer to a shell
- `desktop/src/features/simple/useSimpleModeLibraryPreview.ts` now isolates simple-library preview playback and cleanup from `SimpleModeLibraryView.tsx`
- `desktop/src/features/simple/monitorDeckMainCanvasRuntime.ts` now isolates palette, size, layout, and log-sample derivation from the main deck canvas renderer
- `desktop/src/features/simple/connectionsProbeRuntime.ts` and `connectionsScreenHookRuntime.ts` now isolate connection probe/test decisions and hook-snapshot assembly from `connectionsRuntime.ts`
- `desktop/src/appSectionContentPropsRuntime.ts` now centralizes per-section prop assembly for curate, inspect, compose, and perform surfaces, reducing prop-plumbing density inside `AppSectionContent.tsx` while focused runtime tests keep the shell-routing contracts explicit
- `desktop/src/features/monitor/monitorReplayTickRuntime.ts` and `monitorReplayHydrationRuntime.ts` now isolate replay stepping/timer control and replay-source hydration from the playback facade
- `desktop/src/hooks/useAppCatalogImportActions.ts`, `useAppCatalogLibraryActions.ts`, and `appCatalogActionsRuntime.ts` now isolate catalog import flows, maintenance flows, and import/relink messaging from the old monolithic catalog-actions hook
- `desktop/src/features/simple/monitorLiveStreamSignalRuntime.ts` and `monitorLiveStreamStateRuntime.ts` now isolate cue-accent/signal-buffer behavior and live-log visual-state derivation from the live-stream facade used by the simple monitor deck
- `desktop/src/features/simple/useUnifiedLibraryState.ts` now has direct hook coverage for simple/expert adapter shaping and mode-agnostic callback delegation across select/import/start-monitor actions
- `desktop/src/api/library.ts` now has direct native-pass-through and fallback coverage for playlist CRUD, source relinking, and track mutation wrappers
- `desktop/src/api/repositories.ts` now has direct native-pass-through and native-required failure coverage for log connections, stream sessions, chunk ingestion, export helpers, and audio byte reads
- `desktop/src/api/sessions.ts` now has direct native-pass-through and fallback coverage for persisted sessions, session-event writes, and bookmark flows, and its async bridge-fallback bug is fixed by awaiting `invoke(...)` inside guarded calls

Current strengths:

- monitor provider runtimes
- simple monitor runtimes and hooks
- library screen orchestration
- live monitor controller/runtime composition
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
