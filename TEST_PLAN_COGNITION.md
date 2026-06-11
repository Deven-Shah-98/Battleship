# Test Plan: Cognition-Themed Premium UI/UX Redesign (PR #8)

## Test Environment
- URL: https://dist-iqfiorvc.devinapps.com
- Browser: Chrome (desktop)

## Test 1: Cognition Theme — Default Appearance
**Goal:** Verify the new Cognition theme is applied by default with correct branding.
1. Load the deployed URL fresh (clear localStorage if needed)
2. **Assert:** Background is deep dark (#0B0E14 range), NOT the old blue (#0b1d2a)
3. **Assert:** "Cognition" chip in Theme row is visually active (red/coral fill)
4. **Assert:** The title "Battleship" renders with a gradient text effect (not flat white)
5. **Assert:** Subtitle "HUMAN VS AI" is red/coral colored
6. **Assert:** Font is Inter (check computed font-family on body)
7. **Assert:** Board panels have glass-morphism appearance (subtle translucency, visible borders)

## Test 2: Theme Switching — Arctic (Light) Theme
**Goal:** Prove theme switching works by switching to a visually opposite theme.
1. Click the "Arctic" theme chip
2. **Assert:** Body background changes to light/white (#F0F4F8 range) — the entire page goes light
3. **Assert:** "Arctic" chip is now active (red accent fill), "Cognition" chip is inactive
4. **Assert:** Text color changes to dark (#1A2030 range) — headings and labels are dark on light
5. Click "Cognition" to switch back
6. **Assert:** Background returns to deep dark, text returns to light

## Test 3: Full Game Playthrough — Hit/Miss Animations + Game Over Overlay
**Goal:** Verify gameplay still works end-to-end and the new GameOverOverlay appears on win.
1. Click "Random" to auto-place ships
2. Select "Easy" difficulty (fastest path to win)
3. Click "Start game"
4. Fire at enemy grid cells systematically (row by row)
5. **Assert:** Hit cells show red fill with visible glow/explosion effect
6. **Assert:** Miss cells show muted dark fill with dot marker
7. **Assert:** Battle log updates with each shot
8. Continue firing until all 5 enemy ships are sunk
9. **Assert:** A full-screen blurred overlay appears (GameOverOverlay) — NOT just inline text
10. **Assert:** Overlay shows "You win!" text in green/teal color
11. **Assert:** Overlay shows stats: Shots count, Hits count, Accuracy percentage
12. **Assert:** "Play Again" button is visible and functional in the overlay
13. Click "Play Again" — game resets to setup phase

## Test 4: Ember Theme + Visual Consistency
**Goal:** Verify a third theme applies correctly (proves theme system works broadly).
1. Click "Ember" theme chip
2. **Assert:** Background changes to warm dark (#120A08 range)
3. **Assert:** Accent color changes to orange (#FF9800) — active chips, buttons become orange
4. **Assert:** "Ember" chip is active, others are not
