# Maia Desktop

This directory contains the active desktop product:

- Tauri 2 shell
- React 19 UI
- TypeScript application state and monitor UX
- Web Audio monitor playback and mutation behavior

## Important current note

The mounted frontend entrypoint is:

- `src/main.tsx`
- which currently renders `src/App-v0.tsx`

`src/App.tsx` exists as an alternate shell, but it is not the mounted surface today.

## Commands

```bash
npm install
npm run tauri dev
npm run build
npm run test:run
npm run coverage
npm run quality
npm run quality:strict
```

## Useful files

- `src/App-v0.tsx`: active shell
- `src/features/monitor/MonitorContext.tsx`: monitor runtime context
- `src/features/simple/`: active simple-mode product surface
- `src/appV0MonitorRuntime.ts`: monitor launch orchestration helpers
- `src/appV0MonitorOrchestration.ts`: shared monitor orchestration boundary
- `src/appV0Preferences.ts`: shell preference persistence helpers
- `src/appV0ShellViewModel.ts`: shell-derived view state

## Contributor map

If you are new to the desktop codebase, start in this order:

1. `src/main.tsx`
2. `src/App-v0.tsx`
3. `src/hooks/useAppV0ContentModel.ts`
4. `src/hooks/useAppV0ScreenModel.ts`
5. `src/appV0MonitorOrchestration.ts`
6. `src/appV0MonitorRuntime.ts`
7. `src/features/monitor/MonitorContext.tsx`
8. `src/features/simple/SimpleMonitorScreen.tsx`

Then branch into one area:

- monitor launch and sessions
- simple monitor deck and live visuals
- connections and persisted sources
- library and imported assets
- setup/preferences and skins

## Quality gates

Before opening or updating a PR, run:

```bash
npm run test:run
npm run coverage
npm run typecheck
npm run quality
```

Repository hooks also enforce the tracked quality gates described in the root `AGENTS.md`.

## Related docs

- [../README.md](../README.md)
- [../docs/architecture.md](../docs/architecture.md)
- [../docs/frontend-architecture.md](../docs/frontend-architecture.md)
- [../docs/open-source-maintainer-guide.md](../docs/open-source-maintainer-guide.md)
