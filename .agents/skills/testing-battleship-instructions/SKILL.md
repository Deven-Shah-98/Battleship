---
name: testing-battleship-instructions
description: Test the Battleship in-game instructions system end-to-end. Use when verifying Help Guide, InfoTips, Tutorial, or Settings panel changes.
---

# Testing: Battleship In-Game Instructions System

## Overview
This skill covers E2E testing of the in-game help and instructions features in the Battleship app. The app is a React + TypeScript SPA served via Vite.

## Prerequisites
- Node.js 22+ installed
- Playwright installed globally or in home dir (`cd ~ && npm install playwright`)
- Dev server running: `cd /home/ubuntu/repos/battleship && npm run dev`

## Dev Server
```bash
cd /home/ubuntu/repos/battleship
npm install
npm run dev
# Serves on http://localhost:5177/ (check vite output for exact port)
```

## Key Test Areas

### 1. Help Guide Modal
- Click "Help" button in header (accent-colored, has title tooltip)
- Verify 7 category tabs: Getting Started, Game Modes, AI & Difficulty, Power-ups & Abilities, Board & Settings, Progression & XP, Social & Stats (the "Advanced Features" tab was removed in the PR #25 audit — its presence would be a regression)
- Click a tab → section title updates
- Click a Q&A question → answer expands
- Type in search box → results filter across all categories
- Close via × button or Escape key

### 2. InfoTips (ⓘ icons)
- Located next to every setup setting label (Board, Mode, Players, AI difficulty, AI style, Speed, Power-ups, Weather, Narrator, Timer, Game seed, Theme)
- **Important:** The computer tool does NOT support hover actions. Use Playwright via CDP to test tooltips:
```javascript
const pw = require('playwright');
const browser = await pw.chromium.connectOverCDP('http://localhost:29229');
const ctx = browser.contexts()[0];
const page = ctx.pages()[0];
// Click an ⓘ icon to trigger tooltip
const icons = await page.$$('[aria-label="More info"]');
await icons[0].click();
// Read tooltip text from DOM
```
- Each tooltip should contain text specific to that setting (not generic)

### 3. Tutorial (16 Steps)
- Click "Tutorial" button in footer (may be offscreen — use Playwright to click programmatically)
- Verify 16 progress dots at top
- Step titles include emoji icons (e.g., ⚓ Welcome, 📍 Place Your Fleet, 🤖 AI Difficulty)
- Counter format: "X / 16"
- Next/Back/Skip Tutorial buttons work
- Tutorial state persists (reopening remembers last step)

### 4. Settings Panel
- Click "Settings" button in header
- Only ~10 working toggles should be present (reduce motion, color-blind, left-handed, font size, islands, reefs, shrinking board, shields, scout plane, comeback). Removed toggles (voice commands, gamepad, notifications, etc.) appearing would be a regression from the PR #25 audit.
- Toggle a setting (e.g. Reduce Motion), close, reopen — it must persist (localStorage).
- Export/Import buttons should be functional.
- Modal is scrollable (use Playwright to scroll within the modal div)

### 5. 2-Player Hotseat (pass-and-play)
- Enable 2-Player on the setup screen, place ships for P1, then P2 (Random helps speed this up), then Start game.
- A "Pass the device" modal with a Ready button must appear before EACH player's turn.
- After a shot, the turn alternates and the prompt reappears for the other player.
- Fog of war: each player sees only their own ships; the opponent board shows only hits/misses.
- Tip: note ship positions from the DOM aria-labels during placement so you can deliberately fire a hit vs a miss to verify both outcomes.
- Verifying two full turn cycles (P1 shot → P2 shot → back to P1) is usually sufficient to prove the mechanism.

## Common Issues & Workarounds

### Computer tool scroll syntax
The computer tool requires `scroll_direction` as a string ("up", "down"), NOT `delta_x/delta_y`. Example:
```json
{"action": "scroll", "coordinate": [512, 400], "scroll_direction": "down", "scroll_amount": 3}
```

### Footer buttons offscreen
The footer (Tutorial, Help buttons) is often below the fold. Use Playwright to click:
```javascript
await page.evaluate(() => {
  const buttons = document.querySelectorAll('button');
  for (const btn of buttons) {
    if (btn.textContent.trim() === 'Tutorial') { btn.click(); break; }
  }
});
```

### Hover not supported in computer tool
For native browser `title` tooltips, read the `title` attribute from the DOM output instead of trying to hover. The DOM HTML provided with each screenshot includes `title` attributes on interactive elements.

### Playwright installation
If `require('playwright')` fails, install it first:
```bash
cd /home/ubuntu && npm install playwright
```
Then run scripts from `/home/ubuntu` (not from the repo dir where playwright might not be in node_modules).

## Recording Tips
- Maximize browser before recording: `sudo apt-get install -y wmctrl 2>/dev/null; wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`
- Use `annotate_recording` with `type="test_start"` before each test and `type="assertion"` after verification
- Keep assertions concise (<80 chars)

## Post-Audit Gotchas (PR #25+)
- The sidebar should have exactly 3 categories (Play / Progress / Settings) with ~12-13 items. Any of the removed items (Puzzles, Training, Benchmark, Crew, Upgrades, Graveyard, Memorial, Skins, Faction, Lore, H2H, Heatmap, Accessibility, Modes) appearing is a FAIL.
- The service worker caches aggressively; if testing a deployed build, bump the cache version in `public/sw.js` or hard-refresh, otherwise you may be testing stale code.
- Board grid columns are computed from boardSize — verify alignment on a non-10×10 size (e.g. 8×8 Quick Play) since hardcoded-column regressions have happened before.

## Devin Secrets Needed
None — this is a local-only test (no external APIs or auth required).
