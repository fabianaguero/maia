# Maia UI Refactor — Implementation Plan

## Objective
Improve Maia's UI to be **minimal, adaptive, and intuitive** across all devices (mobile, tablet, desktop) while maintaining full functionality. UI should support, not compete with, the audio experience.

## Key Changes

### 1. CSS System Refactor
- **File:** `desktop/src/styles.css`
- **Changes:**
  - Add comprehensive CSS variable system (colors, spacing, radii, durations)
  - Simplify panel styling (remove pseudo-elements, reduce gradients)
  - Add responsive typography using `clamp()`
  - Remove unused/excessive decoration
  - Add mobile-first media queries

**Effort:** 2-3 hours
**Complexity:** Medium (maintain all existing features, just simplify visually)

### 2. Layout Architecture
- **Files:** `App.tsx`, `AppSidebar.tsx`, individual screen components
- **Changes:**
  - Refactor `.app-shell` grid to be truly responsive
  - Move status information from sidebar to top status bar
  - Collapse sidebar to horizontal nav on mobile
  - Simplify topbar: only essential controls
  - Use `gap: var(--space-lg)` consistently
  - Implement fluid padding with `clamp()`

**Effort:** 3-4 hours
**Complexity:** High (touches many components, requires careful testing)

### 3. Component Updates

#### Header/TopBar
- Keep brand + icon (32×32)
- Reduce control button sizes
- Use `clamp()` for responsive sizing
- Add proper padding with safe-area-inset

#### Sidebar
- **Desktop:** Fixed 240px, navigation only
- **Tablet:** Fixed 200px
- **Mobile:** Horizontal scroll, inline buttons
- Remove monitor session status (move to top bar)
- Remove stats detail (move to top bar)

#### Status Bar (New Layout)
- **Desktop:** 3 cards (System, Loaded, Session)
- **Tablet:** 2 cards
- **Mobile:** 1 card (swipeable/scrollable)
- Use semáforo colors (calm/attention/critical)
- Always visible at top of content area

#### Panels
- Reduce padding: 16px (desktop) → 12px on media queries
- Remove inset shadow, gradient overlays
- Keep simple 1px border + subtle background
- Make header flex/wrap for mobile

#### Cards (Asset, Repository, etc.)
- Smaller icons (40×40)
- Reduce badge size
- Title truncation with ellipsis
- Touch-friendly tap targets (44×44 min)

### 4. Typography Refactor
- **Files:** All component styles
- **Changes:**
  - Replace all `font-family` refs with CSS variables or defaults
  - Use `clamp()` for all font sizes
  - Remove Space Grotesk from body text
  - Keep Space Grotesk only in titles (h1, h2, .panel-title)
  - Ensure tabular-nums on numeric displays

**Effort:** 2 hours
**Complexity:** Medium

### 5. Color System
- **File:** `styles.css` `:root`
- **Changes:**
  - Replace inline color values with CSS variables
  - Add semáforo colors (calm/attention/critical)
  - Simplify gradient usage (remove ambient layer decorations)
  - Update all `rgba()` colors to use consistent opacity scale

**Effort:** 1.5 hours
**Complexity:** Low

### 6. Responsive Patterns
- **Files:** All component styles
- **Changes:**
  - Add mobile-first media queries (640px, 1024px, 1440px breakpoints)
  - Use `grid auto-fit/auto-fill` for layouts
  - Implement safe-area-inset for notch devices
  - Test on real devices (or browser DevTools)

**Effort:** 3-4 hours
**Complexity:** High (requires thorough testing)

## Implementation Order

**Phase 1: Foundation (4-5 hours)**
1. Update `styles.css` with CSS variables + typography system
2. Add responsive media queries
3. Simplify panel/card styling
4. Test header, sidebar, basic layout

**Phase 2: Layout (3-4 hours)**
1. Refactor `App.tsx` grid layout
2. Move status bar to top
3. Simplify sidebar (navigation only, responsive)
4. Update `AppSidebar.tsx` component
5. Test responsive behavior at breakpoints

**Phase 3: Components (3-4 hours)**
1. Update all card components (asset, repo, base)
2. Update form inputs and buttons
3. Update modals/panels
4. Fix typography across all components
5. Ensure touch targets are 44×44 min

**Phase 4: Testing & Polish (2-3 hours)**
1. Mobile device testing (real or DevTools)
2. Tablet testing (iPad, large phone)
3. Desktop testing (verify no regressions)
4. Accessibility review (focus indicators, contrast)
5. Performance check (no layout thrashing)

**Total Effort:** ~13-16 hours (1-2 work days for experienced developer)

## Files to Modify (Priority Order)

### Critical
1. `desktop/src/styles.css` — Foundation
2. `desktop/src/App.tsx` — Layout grid
3. `desktop/src/components/AppSidebar.tsx` — Sidebar architecture

### High Priority
4. `desktop/src/components/AppSidebar.tsx` — Status card layout
5. `desktop/src/features/library/LibraryScreen.tsx` — Panel layout
6. `desktop/src/features/inspect/InspectScreen.tsx` — Layout
7. `desktop/src/features/compose/ComposeScreen.tsx` — Layout

### Medium Priority
8. `desktop/src/features/library/components/*.tsx` — Card components
9. `desktop/src/features/analyzer/components/*.tsx` — Analyzer panels
10. `desktop/src/features/session/SessionScreen.tsx` — Layout

### Low Priority
11. All other component files (refactor as encountered, focus on consistency)

## Testing Checklist

- [ ] **Mobile (320px-640px)**
  - Header fits without truncation
  - Sidebar horizontal scroll readable
  - Cards stack properly
  - Buttons touch-friendly (44×44)
  - No horizontal overflow

- [ ] **Tablet (768px-1024px)**
  - Sidebar 200px fixed
  - Status bar 2 columns
  - Cards in 2-3 column grid
  - All content readable

- [ ] **Desktop (1440px+)**
  - Sidebar 240px fixed
  - Status bar 3-4 columns
  - Cards in 4-column grid
  - Max-width respected (~1600px)

- [ ] **Responsive Typography**
  - Clamp() sizing works (no jumps)
  - Text readable at all sizes
  - Hierarchy clear (Space Grotesk vs IBM Plex)

- [ ] **Functionality**
  - All buttons functional
  - All modals/panels open/close
  - Tabs switch properly
  - Navigation works mobile/tablet/desktop
  - No console errors

- [ ] **Accessibility**
  - Focus indicators visible
  - Color contrast WCAG AA
  - Touch targets 44×44 min
  - Keyboard navigation works

- [ ] **Performance**
  - No layout thrashing on resize
  - Smooth scrolling on cards
  - Animations <16ms (60fps)
  - No excessive repaints

## Success Criteria

✅ **Visual:** Clean, minimal interface that doesn't compete with audio
✅ **Responsive:** Works identically on mobile, tablet, desktop
✅ **Functional:** All features preserved, no regression
✅ **Accessible:** WCAG AA, keyboard-navigable, touch-friendly
✅ **Performance:** Smooth, no jank, fast load time
✅ **Maintained:** Design documented in DESIGN.md, easy to extend

## Notes

- **No breaking changes:** This is a visual refactor. API, logic, state management stay the same.
- **Tauri/backend untouched:** Only frontend React + CSS changes.
- **Git strategy:** Single feature branch (e.g., `feat/ui-redesign`), atomic commits for each component type.
- **Rollback:** Easy to revert if issues discovered — CSS changes are isolated, layout changes are localized.
