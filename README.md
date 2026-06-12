# ⚓ Battleship

A feature-rich, web-based [Battleship](https://en.wikipedia.org/wiki/Battleship_(game))
game playable in the browser against an AI opponent. Built with **React**, **TypeScript**,
and **Vite**.

## 🎮 Play Now

**[Play Battleship →](https://dist-iqfiorvc.devinapps.com)**

No install, no signup — just open the link and play.

## 🐛 Bug Report

See **[DEBUGGING.md](./DEBUGGING.md)** for a detailed log of every bug found
during development and how each was resolved (61 bugs documented).

## 📖 Source Code

This repository: **[github.com/Deven-Shah-98/Battleship](https://github.com/Deven-Shah-98/Battleship)**

---

## Features

### Core Gameplay
- **Ship placement** — click to place, press `R` to rotate, or use **Random** for instant setup
- **Turn-based combat** — fire on the enemy grid, see hits (✶) and misses (•)
- **Salvo mode** — fire multiple shots per turn equal to your surviving ships
- **Custom board sizes** — 6×6 (Blitz) through 15×15 (Epic)
- **Hotseat 2-player** — pass-and-play local multiplayer

### AI Opponents
- **Easy** — fires at random
- **Medium** — hunt & target with checkerboard parity
- **Hard** — probability-density heatmap solver (plays fair — never reads ship positions)
- **Admiral** — enhanced heatmap with extension scoring for wounded ships
- **5 AI personalities** — Aggressive, Methodical, Chaotic, Balanced, Defensive

### Power-ups & Abilities
- **Radar scan** — reveal a 3×3 area
- **Sonar ping** — reveal ships in a column
- **Airstrike** — bomb an entire row
- **EMP blast** — disable AI targeting for 3 turns
- **Scout plane** — periodic reconnaissance
- **Ship shields** — absorb one hit per ship

### Weather System
- **Storm** — disables power-ups, adds shot scatter
- **Fog** — reduces visibility
- **Calm** — grants bonus shot (skip AI turn)
- Dynamic weather changes throughout the game

### Campaign Mode
- **10 story missions** with increasing difficulty
- Custom fleet compositions, board sizes, and weather per mission
- Campaign-specific briefings and objectives

### Board Variants
- **Islands** — impassable terrain blocks shots and placement
- **Hidden reefs** — shots landing on reefs always miss (revealed on fire)
- **Minefields** — place mines during setup; enemy hits lose their turn
- **Shrinking board** — outer ring becomes impassable every N turns

### Progression & Meta
- **XP & leveling** — earn XP for shots, sinks, and victories
- **45+ achievements** — from "First Blood" to "Perfectionist"
- **Prestige system** — reset for permanent XP multipliers
- **Battle Pass** — weekly missions for bonus XP
- **Mastery tiers** — Bronze through Platinum per difficulty
- **Commander perks** — passive bonuses unlocked at level milestones
- **Loadout presets** — save fleet + settings combos

### Analytics & Social
- **Post-game heatmap** — shot accuracy analysis
- **Win probability** — live prediction during gameplay
- **Strategy fingerprint** — categorises your playstyle
- **Match history** — detailed per-game records
- **Share card** — screenshot your results
- **Replay system** — record and replay matches

### Accessibility
- **Keyboard navigation** — full game playable without mouse
- **Screen reader support** — ARIA labels on all interactive elements
- **Reduce motion** — respects `prefers-reduced-motion`
- **Color-blind mode** — patterns in addition to colors
- **Font size controls** — adjustable text sizing
- **One-switch mode** — auto-scanning grid with single-button confirm

### Technical
- **PWA / offline support** — service worker caches assets
- **Auto-save** — game state persists across browser sessions
- **Procedural audio** — Web Audio API synthesis, no asset files
- **5 themes** — Midnight, Arctic, Ember, Ocean, Neon
- **Gamepad support** — play with a controller via Gamepad API
- **Voice commands** — "Fire B4" via Web Speech API
- **IndexedDB storage** — replays and match history
- **Lazy-loaded panels** — code-split for fast initial load

---

## Getting Started

```bash
git clone https://github.com/Deven-Shah-98/Battleship.git
cd Battleship
npm install
npm run dev        # start dev server (http://localhost:5173)
```

### Other Scripts

```bash
npm run build      # type-check + production build → dist/
npm run preview    # preview the production build locally
npm run test       # run unit tests (Vitest)
npm run lint       # run ESLint
```

---

## How to Play

1. **Choose your settings** — pick a board size, difficulty, and mode using the
   setup presets (Quick Play / Standard / Advanced) or customise individually
2. **Place your ships** — click cells to place each ship, press `R` to rotate,
   or hit **Random** for auto-placement
3. **Start the game** — click "Start game" once all ships are placed
4. **Fire** — click a cell on the Enemy Waters grid. Hits show ✶, misses show •
5. **Win** — sink the enemy's entire fleet before they sink yours

**Keyboard shortcuts:** `R` to rotate ships, `U` to undo placement,
`N` for new game, `?` for help.

---

## Project Structure

```
src/
  App.tsx                  # Game state machine and main UI
  sound.ts                 # Web Audio sound engine
  main.tsx                 # React entry point
  styles.css               # Global styles and theme system
  components/
    BoardGrid.tsx           # Renders NxN game board
    FleetStatus.tsx         # Ship status panels
    Sidebar.tsx             # Navigation sidebar
    CampaignPanel.tsx       # Campaign mission selector
    HelpGuide.tsx           # In-game help system
    Tutorial.tsx            # 16-step interactive tutorial
    SettingsPanel.tsx        # Full settings with toggles
    GameOverOverlay.tsx     # End-game stats and actions
    PostGameAnalysis.tsx    # Shot heatmap analysis
    PlayerProfile.tsx       # Level, rank, lifetime stats
    ReplayViewer.tsx        # Match replay player
    ... (30+ component files)
  game/
    types.ts               # Shared types (Board, Ship, Coord)
    constants.ts           # Board sizes, fleet definitions
    board.ts               # Placement, attacks, win detection
    ai.ts                  # AI logic (Easy → Admiral)
    weather.ts             # Weather effects system
    campaign.ts            # Campaign missions and progress
    achievements.ts        # Achievement definitions and checks
    xp.ts                  # XP and leveling
    powerups.ts            # Power-up mechanics
    ... (25+ logic files)
  utils/
    theme.ts               # Theme switching
    matchHistory.ts        # Match persistence
```

---

## Tech Stack

| Layer       | Technology               |
| ----------- | ------------------------ |
| Framework   | React 18                 |
| Language    | TypeScript 5             |
| Build       | Vite 5                   |
| Testing     | Vitest                   |
| Audio       | Web Audio API            |
| Storage     | localStorage + IndexedDB |
| Offline     | Service Worker (PWA)     |
| Deployment  | Static hosting           |

---

## Notes

- See **[DEBUGGING.md](./DEBUGGING.md)** for the full bug log (61 bugs found and fixed)
- All 56 unit tests pass (`npm test`)
- Zero lint errors (`npm run lint`)
- Zero type errors (`npm run build`)
