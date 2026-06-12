---
name: testing-battleship
description: Test the Battleship game end-to-end in the browser. Use when verifying gameplay features, UI panels, or integration of new game mechanics.
---

# Testing Battleship App

## Dev Server Setup

```bash
cd /home/ubuntu/repos/battleship
npm run dev
# Server runs on http://localhost:5175/ (Vite)
```

## Important: Board Cell Interaction

The game board cells may render at coordinates beyond the 1024px viewport width (e.g., enemy cell A1 at x=1126). This happens because the CSS layout scales content.

**Workaround:** Use browser console JavaScript to click cells:
```javascript
// Click enemy cell by devinid (IDs shift as cells become disabled after hits)
document.querySelector('[devinid="43"]').click();

// Or find by aria-label
document.querySelector('[aria-label="C3, unknown"]').click();
```

Do NOT rely on pixel coordinates for board cells — always use JS `click()` via browser console.

## Game Setup for Testing

1. Navigate to http://localhost:5175/
2. Default settings: 10x10 board, Medium AI
3. For faster testing: change to 6x6 board, Easy AI, Instant speed, Classic mode
4. Click "Start game" to begin
5. Ships are auto-placed; game immediately enters playing phase

## Key Feature Verification Patterns

### Header Panel Buttons
- All feature panels are accessible via header buttons (Crew, Lore, Memorial, Faction, Progress, H2H, Heatmap, Modes, Puzzles, Training, Graveyard, A11y, Skins, Upgrades, Benchmark)
- Click button → modal opens with overlay
- Click outside overlay or close button → modal closes
- Modals have devinids and can be identified in HTML

### Gameplay Integration Features (visible during `phase === "playing"`)
- **Win Probability**: Bar at bottom with percentage (green ≥60%, orange ≥40%, red <40%)
- **Morale**: Emoji + percentage (😄≥80, 😊≥60, 😐≥40, 😟≥20, 😰<20)
- **Combo**: Badge appears top-right after 2+ consecutive hits ("2x COMBO (1x XP)")
- **AI Dialogue**: Glass bubble at bottom-left after sinking enemy ship ("AI Admiral" + text)
- **Seasonal Banner**: Always visible, shows current seasonal event

### Verifying State Changes
- Fire shots and observe Win Probability percentage change
- Hits increase morale; misses decrease it
- Consecutive hits trigger combo counter (resets on miss)
- Sinking a ship triggers AI dialogue bubble (click to dismiss)

## Common Issues & Workarounds

1. **Cells don't respond to pixel clicks**: Use JS `document.querySelector().click()` instead
2. **DevinIDs shift after hits**: Hit cells become disabled and lose their devinid; remaining cells get re-indexed. Always check current HTML before clicking.
3. **Auto-save interferes**: Game may restore from auto-save on reload. Clear localStorage if you need a fresh state: `localStorage.clear()`
4. **Feature components only render during playing phase**: Win Probability, Morale, Combo, AI Dialogue are all guarded by `phase === "playing"`

## Test Assertions Checklist

- [ ] 15+ header buttons visible in nav bar
- [ ] Each modal opens on button click and closes on overlay click
- [ ] Modes panel lists 9 experimental modes
- [ ] A11y panel has 7 toggle controls
- [ ] Skins panel shows 6 board skin options
- [ ] Win Probability shows percentage during gameplay
- [ ] Morale shows emoji + percentage during gameplay
- [ ] Combo badge appears after 2+ consecutive hits
- [ ] AI Dialogue appears after sinking enemy ship
- [ ] Seasonal Banner renders without crash

## Lint & Build Verification

```bash
npm run lint      # ESLint
npx tsc --noEmit  # TypeScript check
npm run build     # Production build
npm test          # Vitest (56 tests)
```
