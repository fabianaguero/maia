# Maia — Collaboration Guidelines

## Design System

All UI decisions must align with `DESIGN.md`.

**Read DESIGN.md before:**
- Modifying any component styling
- Adding new components
- Changing layout or spacing
- Updating colors, typography, or motion

**Key constraints:**
- Typography: Space Grotesk (titles only), IBM Plex Sans (body)
- Colors: Use CSS variables (--color-calm, --color-attention, --color-critical, --color-accent)
- Spacing: Base unit 8px, use --space-* variables
- Responsive: Mobile-first, test at 320px / 768px / 1440px breakpoints
- Motion: Functional only, no decorative animations

Do not deviate without explicit user approval.

## Architecture Notes

- **Desktop app:** Tauri 2 + React 19 + TypeScript
- **State management:** React hooks (useSessions, useLibrary, useRepositories, etc.)
- **Local persistence:** SQLite via Tauri invoke
- **Analyzer integration:** Python analyzer via JSON contract
- **Internationalization:** i18n context (en, es support)

## Code Style

- **Naming:** camelCase for variables/functions, PascalCase for components
- **Imports:** Group by: React, external libs, local types, local components, utils, hooks
- **Comments:** Only when logic is non-obvious
- **Types:** Use strict TypeScript, no `any`

## Key Concepts

### Musical Assets
- **track_analysis:** Audio file with BPM, key, energy, danceability
- **repo_analysis:** Code/log repository with language, metrics
- **base_asset:** Reusable musical segment for composition
- **composition_result:** Assembled sonic output from base assets + tracks

### Workflow
1. **Library:** Import and manage musical assets, repositories, base packs
2. **Inspect:** Deep-dive analysis of selected asset (waveform, metrics, BPM grid)
3. **Compose:** Create compositions from base assets
4. **Session:** Live monitoring — arm a repository, listen to real-time anomalies
5. **Replay:** Playback of past sessions with bookmarks

### Monitor Context
- Active monitor session runs in background
- Emits `MonitorMetrics` (window count, anomaly count, uptime)
- User can pause, seek, toggle playback
- Replay bookmarks track specific anomaly windows

## Common Patterns

### Component Props
```typescript
interface ComponentProps {
  // Data
  item: SomeType;
  
  // Callbacks (verb + noun convention)
  onAction: (id: string) => void;
  onUpdate: (data: UpdateInput) => Promise<void>;
  
  // UI state
  loading?: boolean;
  error?: string | null;
  busy?: boolean;
}
```

### Hook Conventions
- `use*()` prefix for all hooks
- Return object with `{data, loading, error, mutate/set*}`
- Avoid prop drilling; use context for global state (I18nContext, MonitorContext)

### Error Handling
- Use `NotificationSystem` (notify function) for user-facing errors
- Console only for dev/debugging
- Never throw uncaught errors in React components

## Debugging Tips

- **Analyzer connection:** Check `App.tsx` bootstrap logic (loads health, manifest)
- **State sync issues:** Trace through hook effects in `useSessions`, `useLibrary`
- **Tauri invoke:** Check `src-tauri/src/main.rs` for available commands
- **Styling regressions:** Check current breakpoint in DevTools, compare to DESIGN.md
- **Performance:** React DevTools Profiler, check for unnecessary re-renders
