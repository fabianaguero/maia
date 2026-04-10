# Design System — Maia

## Product Context

- **What this is:** Local-first desktop app that turns technical data (repositories, logs, streams) into continuous, pleasant audio for passive system monitoring
- **Who it's for:** Technical teams, operators, SREs who need to hear system state without staring at dashboards
- **Space/industry:** Auditory monitoring + music management (hybrid)
- **Project type:** Desktop app (Tauri + React)
- **Unique factor:** Audio is the primary interface, **always accompanied by a waveform visualization**. Supports three listening modes: Full Volume, Low Volume, and Silent (waveform-only for anomaly detection in quiet environments). UI is the control surface, not the entertainment.

## Aesthetic Direction

- **Direction:** Minimalismo Instrumental
- **Decoration level:** Intentional (subtle, purposeful, never gratuitous)
- **Mood:** Professional, focused, calm. Like a well-designed instrument console — everything visible has a reason. Nothing competes for attention unless important.
- **Philosophy:** The UI gets out of the way of the audio. Setup, monitor, glance, inspect only if needed.

## Typography

- **Display/Hero:** Space Grotesk (600, 700 weights) — Headlines, panel titles, key labels
  - Rationale: Strong, distinctive, modern. But only for structural elements, never body copy.
  - Size scale: 32px (largest), 24px, 20px, 16px (titles)
  
- **Body/UI:** IBM Plex Sans (400, 500, 600 weights) — Everything else
  - Rationale: Clean, professional, highly legible at any size. Reduces visual noise 40% vs Space Grotesk everywhere.
  - Size scale: 14px (body), 13px (secondary), 12px (labels), 11px (metadata), 10px (hints)

- **Data/Tables:** IBM Plex Sans with `font-variant-numeric: tabular-nums`
  - BPM values, file counts, timestamps must align vertically

- **Code:** IBM Plex Mono (for logs, error traces)

- **Loading strategy:** Google Fonts (Space Grotesk + IBM Plex Sans) for dev/test. Evaluate self-hosted for production (faster cold start).

- **Size scale (CSS units):**
  ```
  clamp(24px, 8vw, 32px)   → display
  clamp(18px, 6vw, 20px)   → panel title
  clamp(14px, 4vw, 16px)   → section title
  clamp(12px, 3vw, 13px)   → body
  clamp(11px, 2.5vw, 12px) → secondary
  clamp(10px, 2vw, 11px)   → labels/hints
  ```

## Color

- **Approach:** Semáforo inteligente (3 states) + Accent for interactivity
  - Green/Teal = System is calm, normal operation
  - Orange/Yellow = Attention needed, anomalies detected
  - Red = Critical, immediate action required
  - Cyan = Accent for interactive elements and affordances

- **Palette:**
  ```css
  --color-calm: #00c2a8           /* System normal - teal */
  --color-attention: #ff9500      /* Requires review - orange */
  --color-critical: #ff4757       /* Urgent - red */
  --color-accent: #48d7ff         /* Interactive elements - cyan */
  --color-gold: #f7bd4f           /* Highlights - warm accent */

  --bg-dark: #0a0e14              /* Page background */
  --bg-surface: #12171f           /* Panel/card background */
  --bg-surface-alt: #17202b       /* Alternate surface */

  --text-primary: #e8eef7         /* Main text */
  --text-secondary: #a8b3c1       /* Secondary text */
  --text-muted: #7a8297           /* Hints, labels */

  --border-soft: rgba(72, 215, 255, 0.12)   /* Subtle borders */
  --border-strong: rgba(72, 215, 255, 0.24) /* Prominent borders */
  ```

- **Usage:**
  - **Text:** Primary on dark backgrounds (always passes WCAG AA contrast)
  - **Accents:** Cyan (#48d7ff) for buttons, hover states, active indicators
  - **Status:** Only use color + icon + label (never color alone)
  - **Backgrounds:** Never use color as background except status cards (with opacity)
  - **Dark mode only:** No light mode planned (local monitoring app, dark environment assumption)

- **Semantic colors:**
  - Success/Calm → --color-calm
  - Warning/Attention → --color-attention
  - Error/Critical → --color-critical
  - Action/Links → --color-accent

## Spacing

- **Base unit:** 8px
- **Density:** Comfortable (breathing room, not cramped)
- **Scale:**
  ```css
  --space-xs: 4px    /* smallest gaps, badge padding */
  --space-sm: 8px    /* button gaps, tight spacing */
  --space-md: 12px   /* element spacing, card padding sm *)
  --space-lg: 16px   /* standard padding, main gaps */
  --space-xl: 24px   /* section spacing, header padding *)
  --space-2xl: 32px  /* large section gaps *)
  ```

- **Application:**
  - **Panels:** 16px padding on desktop, 12px on tablet, 8px on mobile
  - **Cards:** 12px padding (asset cards, status cards)
  - **Header:** 16px padding (top/bottom), 24px (left/right on desktop)
  - **Gaps between sections:** 16px (desktop), 12px (tablet), 8px (mobile)
  - **Input fields:** 12px padding internal
  - **Buttons:** 8px vertical, 14px horizontal

## Layout

- **Approach:** Responsive grid, sidebar + content
  - **Mobile (<640px):** Sidebar collapses to horizontal nav, content full-width, single column grids
  - **Tablet (641–1024px):** Sidebar 200px, content flex, 2-column status bar
  - **Desktop (1025px+):** Sidebar 240px, content flex, 3-column status bar, 4-column grids
  - **Large desktop (1440px+):** Max-width container (1600px), 4-column status bar

- **Grid system:**
  - **Sidebar:** Fixed width (240px desktop, 200px tablet, horizontal scroll mobile)
  - **Content:** Flex, grows to fill available space
  - **Status bar:** `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`
  - **Asset grids:** `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`
  - **Tab strip:** Horizontal scroll on mobile, no wrap on larger screens

- **Max content width:** No hard max (full width), but consider sidebar width
  - Desktop practical max: ~1600px

- **Border radius (hierarchy):**
  ```css
  --radius-sm: 6px    /* small buttons, badges *)
  --radius-md: 8px    /* form inputs, cards *)
  --radius-lg: 12px   /* panels, modals *)
  --radius-xl: 16px   /* large containers *)
  ```

- **Safe areas:** Respect mobile safe areas (notches, rounded corners)
  - Padding: `max(16px, env(safe-area-inset-left))`

## Motion

- **Approach:** Minimal functional (aids comprehension, never gratuitous)
  - Transitions for state changes (hover, active, selected)
  - No entrance animations on load
  - No scroll-triggered animations
  - No decorative motion

- **Easing:**
  - **Enter (appear, expand):** `ease-out` (200ms)
  - **Exit (disappear, collapse):** `ease-in` (150ms)
  - **Move (position changes, hover):** `ease-in-out` (200ms)

- **Specific timings:**
  ```css
  --duration-micro: 50-100ms   /* button hover, state change *)
  --duration-short: 150-250ms  /* collapse/expand, fade *)
  --duration-medium: 250-400ms /* navigation, modals *)
  ```

- **Practices:**
  - Buttons: `all 0.2s ease` (background, color, border changes)
  - Card hover: `transform: translateY(-2px); all 0.2s ease`
  - Tabs underline: `border-color 0.2s ease, color 0.2s ease`
  - Modal entry: `opacity 0.3s ease-out`

## Waveform Display (First-Class Component - Rekordbox-Style)

The waveform is **not optional decoration** — it's a core feedback interface that must always be visible and synchronized with audio. Inspired by Rekordbox's proven DJ-software design.

### Three-Band Visualization (Like Rekordbox)

Instead of single-bar waveforms, use **3-band frequency separation** to give visual/tactile feedback:

- **Bass Band (Red #ff4444):** Low frequencies (sub-bass, kick fundamentals)
- **Mid Band (Orange #ffaa00):** Midrange frequencies (vocals, bass body, instruments)
- **High Band (White #ffffff):** High frequencies (cymbals, hats, shimmer)

**Why 3 bands?**
- Professional DJs instantly understand frequency mix just by looking
- Color-coding helps identify where energy is in the track
- Separates what you hear (frequency balance) from what you see (visual representation)
- Rekordbox proven this works for years

### Display Layout

```
┌─────────────────────────────────────┐
│ Now Playing: Track Title | BPM       │
├─────────────────────────────────────┤
│ [Mini Waveform - overview]           │  ← Quick scan of whole track
├─────────────────────────────────────┤
│ [Main 3-Band Waveform]               │  ← Animated in real-time
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Bass (Red)
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Mids (Orange)
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Highs (White)
├─────────────────────────────────────┤
│ [Legend: Bass | Mids | Highs]        │
└─────────────────────────────────────┘
```

### Three Listening Modes

1. **Full Volume** (Default)
   - Audio at normal level
   - 3-band waveform animated in real-time
   - Height/intensity matches audio output
   - Perfect for: Active monitoring, development

2. **Low Volume** (Background)
   - Audio subtle/background
   - 3-band waveform still visible
   - Less intense animation
   - Perfect for: Office, shared environments

3. **Silent Mode** (Waveform-Primary)
   - Audio muted
   - **Waveform ENLARGES** (60-70% of viewport)
   - Color shifts more pronounced (still 3 bands)
   - Anomalies detected via waveform shape changes + color pulses
   - Perfect for: Meetings, quiet environments, accessibility

### Visual Semantic (System State via Waveform)

When monitoring system state, the waveform's **character** changes:

| System State | Waveform Character | Visual Change |
|-------------|------------------|---------------|
| **Calm (Normal)** | Smooth, rhythmic | Steady bands, consistent peaks |
| **Attention (Anomalies)** | Irregular, spiky | Unexpected peaks, color shift to warmer |
| **Critical** | Chaotic, intense | Extreme peaks, color saturation up |

**Rule:** The waveform shows **both musical content AND system state** simultaneously. This is the key insight: one waveform communicates two pieces of information.

### Layout Position

**Option A (Recommended for Maia):** Dedicated Waveform Row

```
┌─────────────────────────────────────────────┐
│ [Header: Logo, Nav, Mode Toggle]            │
├─────────────────────────────────────────────┤
│ [Waveform Display - 25% of viewport height] │  ← Always visible
│ [Real-time animated, semantic colors]       │
├─────────────────────────────────────────────┤
│ [Status Cards: System, Loaded, Session]     │
├─────────────────────────────────────────────┤
│ [Sidebar] │ [Main Content Area]             │
│           │ (Library, Inspect, Compose)     │
└─────────────────────────────────────────────┘
```

**Rationale:** Waveform visible without scrolling. Status bar below it (supporting info). Main content flexible.

### Responsive Waveform

- **Mobile (<640px):** 20% of screen height, tall and narrow (single column)
- **Tablet (641-1024px):** 25% of screen height, fills width
- **Desktop (1025px+):** 25-30% of screen height, prominent and clear

### Silent Mode Expansion

When user switches to Silent mode, waveform grows:

```
┌─────────────────────────────────────────────┐
│ [Header + Mode Toggle: SILENT MODE]         │
├─────────────────────────────────────────────┤
│                                             │
│   [Large Waveform Display]                  │  ← 60-70% of height
│   (Very prominent, easy to scan)            │
│                                             │
├─────────────────────────────────────────────┤
│ [Status Cards - compact]                    │
├─────────────────────────────────────────────┤
│ [Sidebar] │ [Minimal Content]               │
└─────────────────────────────────────────────┘
```

### Waveform Interactions

- **Pause audio** → Waveform pauses (frozen)
- **Anomaly detected** → Color shift + optional subtle pulse
- **Mode toggle** → Smooth size/color transition
- **Click on waveform** → Maybe shows history or analytics (future)

### Technical Notes

- **Update frequency:** 60fps if possible (smooth real-time animation)
- **Data source:** MonitorMetrics or live analyzer data
- **Color mapping:** Driven by system state (calm/attention/critical)
- **Sizing:** Use SVG or Canvas for crisp, scalable rendering
- **Performance:** Optimize animation to not block main thread

## Components

### Header
- Height: 56px (mobile), 64px (desktop)
- Padding: 16px
- Brand icon: 32×32px, gradient background
- Controls right-aligned, horizontal gap 12px
- Buttons: 30-32px tall, padding 6px 10px

### Sidebar
- Width: 240px (desktop), 200px (tablet), horizontal scroll (mobile)
- Padding: 16px (desktop), 12px (tablet/mobile)
- Sections with 12px gaps, borders between sections
- Navigation buttons: full width, padding 12px 16px
- Stats: 12px font, line-height 1.6

### Status Bar
- Grid layout, `auto-fit` columns
- Cards: 16px padding, 1px border, rounded corners
- Label: uppercase, 10px, muted color
- Value: 18px bold, primary color
- Meta: 12px, secondary color
- Indicator dot: 8px, inline with label

### Panel
- Padding: 16px (desktop), 12px (tablet)
- Border: 1px solid border-soft
- Rounded: 12px
- Header with title + description + controls
- Content area flex, grows to fill
- Footer (hints, actions) sticky at bottom

### Tabs
- Padding: 12px 16px per tab
- Border bottom: 2px transparent (inactive), accent color (active)
- Scroll horizontally on narrow screens
- Gap: 8px between tabs

### Cards (Asset/Repo/Source)
- Padding: 12px
- Border: 1px border-soft
- Rounded: 8px
- Icon 40×40px with background
- Title: 12px bold, primary color
- Meta: 11px, muted color
- Badge: inline, small

### Buttons
- Padding: 8px 14px (standard), can vary
- Border radius: 6-8px
- Font: 12px bold
- States: default, hover (+10% brightness), active (shadow), disabled (opacity 50%)
- Primary (accent bg): cyan background, dark text
- Secondary (outline): border outline, transparent bg, secondary text

### Input fields
- Padding: 12px 14px
- Border: 1px rgba(255, 255, 255, 0.1)
- Rounded: 14px
- Focus: outline 1px accent color, border outline
- Placeholder: text-muted

## Responsive Breakpoints

```css
/* Mobile: < 640px */
@media (max-width: 640px) {
  - Sidebar horizontal scroll
  - Single column grids
  - Full-width panels
  - Smaller padding (8px)
}

/* Tablet: 641px - 1024px */
@media (min-width: 641px) and (max-width: 1024px) {
  - Sidebar fixed (200px)
  - 2-column layouts
  - Standard padding (12px)
  - 2-column status bar
}

/* Desktop: 1025px - 1439px */
@media (min-width: 1025px) {
  - Sidebar fixed (240px)
  - Multi-column layouts (3+)
  - Comfortable padding (16px)
  - 3-column status bar
}

/* Large: 1440px+ */
@media (min-width: 1440px) {
  - Centered layout (max 1600px)
  - 4-column layouts
  - Extra space around
  - 4-column status bar
}
```

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-10 | Minimize decoration, single accent color for interactivity | Maia's UI must not compete with the audio. Clean, focused interface lets the listening experience dominate. |
| 2026-04-10 | Space Grotesk titles only, IBM Plex Sans body | 40% reduction in visual noise. Space Grotesk is powerful but dense; reserve for structural hierarchy. |
| 2026-04-10 | Semáforo (3 states: calm/attention/critical) for status | SRE/monitoring best practice: single decision per visual signal. Color alone never indicates state — always pair with icon + text. |
| 2026-04-10 | Sidebar minimal navigation only, status cards in header | All critical info up front where user looks first. Sidebar for navigation, top status bar for system state. |
| 2026-04-10 | Responsive by default with clamp() typography | Works equally well on 320px phone, 768px tablet, 1440px desktop. Fluid sizing, no jumps at breakpoints. |
| 2026-04-10 | Dark mode only, no light mode | Local monitoring app. Users run in dark environments. No accessibility loss. |
| 2026-04-10 | Minimal motion (ease-in-out, 150-250ms) | Functional only. Avoid decorative animations that distract from the core audio experience. |

## Implementation Notes

- **CSS variables:** Use `:root` scope for all tokens (colors, spacing, radii, durations)
- **Accessibility:** 
  - All interactive elements keyboard-accessible and touch-friendly (min 44px tap target)
  - Color contrast WCAG AA (primary/secondary text on dark backgrounds pass)
  - Status never indicated by color alone (+ icon/text)
  - Focus indicators visible
- **Dark mode:** Only mode. No light variant.
- **Responsive:** Mobile-first. Use `clamp()` for fluid sizing, `grid auto-fit/auto-fill` for layouts.
- **Component library:** Keep components small and focused. Reuse via composition, not base bloat.
