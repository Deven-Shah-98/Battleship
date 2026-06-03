# Debugging Log

A record of significant bugs and gotchas encountered while building the game,
and how they were resolved.

## 1. `vite build` failed: `test` is not a valid Vite config property

**Symptom**

```
vite.config.ts(9,3): error TS2769: No overload matches this call.
  Object literal may only specify known properties, and 'test' does not exist in type 'UserConfigExport'.
```

**Cause**

The Vitest configuration (`test: { ... }`) was added to a config created with
`defineConfig` imported from `vite`. Vite's own `defineConfig` typing has no
knowledge of the `test` field, so `tsc -b` (run before `vite build`) rejected it.

**Fix**

Import `defineConfig` from `vitest/config` instead of `vite`. That variant
extends the config type with Vitest's `test` options.

```ts
// before
import { defineConfig } from "vite";
// after
import { defineConfig } from "vitest/config";
```

A first attempt also added a `/// <reference types="vitest/config" />` triple
slash directive, but ESLint's `@typescript-eslint/triple-slash-reference` rule
flagged it. The directive was unnecessary once the import was switched, so it
was removed.

## 2. AI turn double-firing: nested `setState` calls inside an updater

**Symptom (latent bug, caught in review)**

The AI's move was originally computed inside a `setPlayerBoard(board => { ... })`
updater, and that updater *also* called `setAiState`, `setTurn`, `setWinner`,
and `addLog`.

**Cause**

React state updater functions must be pure and can be invoked more than once
(e.g. under `<StrictMode>` in development, or with concurrent rendering).
Calling other setters and `addLog` from inside the updater meant those side
effects could run twice for a single AI turn — producing duplicate battle-log
entries and, worse, advancing the turn twice.

**Fix**

Refactored the AI effect to read the current `playerBoard` and `aiState` from
the closure (added to the effect dependency array), compute the move once, then
call each setter exactly once at the top level of the `setTimeout` callback. The
updater is no longer used for side effects.

## 3. AI could loop forever / re-target fired cells

**Symptom (prevented by design)**

A naive "hunt and target" AI can re-queue cells it has already fired at, wasting
turns or, in the worst case, never terminating.

**Fix**

- `chooseAIMove` filters the target queue against `board.shots` on every call,
  so already-fired cells are skipped.
- `updateAIAfterResult` excludes out-of-bounds neighbours and neighbours that
  have already been fired at or are already queued.
- A regression test (`ai.test.ts`) plays a full game loop and asserts the AI
  sinks a small fleet within a bounded number of turns, and that it never fires
  at the same cell twice.

## 4. Random ship placement could in theory never converge

**Symptom (prevented by design)**

Pure rejection sampling for ship placement can, in pathological RNG sequences,
fail to find a free spot.

**Fix**

`placeShipsRandomly` caps attempts per ship (1000) and throws a clear error if a
ship cannot be placed, rather than hanging. In practice the standard 10×10 board
with the classic fleet places well within that bound. A test verifies the full
fleet is always placed without overlaps and within bounds.
