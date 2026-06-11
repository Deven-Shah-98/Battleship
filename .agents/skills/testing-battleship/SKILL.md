---
name: testing-battleship
description: End-to-end UI testing of the Battleship game app. Use when verifying gameplay, settings, progression, or visual features.
---

# Testing the Battleship App

## Setup

1. `cd /home/ubuntu/repos/battleship && npm install && npm run dev`
2. Dev server runs on localhost:5173 (or next available port like 5174/5175 if occupied)
3. Clear localStorage before testing: `localStorage.clear()` in browser console, then refresh

## Key Testing Tips

### Automating Gameplay
- Direct GUI clicks on board cells may not register reliably via computer tool coordinates
- **Use browser console automation instead:**
  ```js
  // Fire at all unknown enemy cells rapidly
  async function fireAll() {
    const delay = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < 225; i++) { // max cells on 15x15
      const cell = document.querySelector('[aria-label$=", unknown"][tabindex]:not([disabled])');
      if (!cell) break;
      cell.click();
      await delay(200);
    }
  }
  fireAll();
  ```
- For smaller boards (6x6 Blitz), games complete in ~8 seconds with Instant speed

### Recommended Test Setup
- Board: **6x6 (Blitz)** for fast game completion
- AI: **Easy** (random firing = fewer player ships sunk = guaranteed win)
- Speed: **Instant** (no AI thinking delay)
- Mode: **Classic** for basic tests, **Salvo** for multi-shot testing

### What to Verify After a Game
1. **GameOverOverlay**: "You win!" label, shots/hits/accuracy/time stats, +XP (positive, per-game), Play Again/Analysis/Share/Replay buttons
2. **Profile**: Level number, title (Ensign/Lieutenant/etc), XP bar, lifetime stats
3. **Match History**: Game entry with W/L, mode, difficulty, shots, accuracy, time, date
4. **Achievements**: 6 categories (Gameplay, Skill, Challenge, Collection, Social + hidden). Check unlocked items have dates.

### Panel Navigation
- All panels accessible via header buttons: Profile, Achievements, Stats, Campaign, Replays, Prestige, Loadouts, Milestones, Save, Settings, Notes
- Panels are modals with × close button
- Settings persist in localStorage across modal open/close

### Known Quirks
- Port conflicts: Vite auto-increments port if 5173 is in use
- After firing via keyboard Enter, focus drops to `<body>` (minor accessibility issue)
- Game uses `aria-label` attributes extensively — useful for querying cells programmatically
- Cell states in aria-label: "unknown", "miss", "hit", "hit, [Ship] sunk"

## No Secrets Needed

This is a fully client-side app with no authentication or API keys required.
