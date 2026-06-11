/** Gamepad support — navigate board and fire with controller */

import type { Coord } from "./types";

export interface GamepadState {
  connected: boolean;
  cursor: Coord;
}

export function createGamepadState(): GamepadState {
  return { connected: false, cursor: { row: 0, col: 0 } };
}

export function pollGamepad(
  state: GamepadState,
  boardSize: number,
  onFire: (coord: Coord) => void,
): GamepadState {
  const gamepads = navigator.getGamepads();
  const gp = gamepads[0];
  if (!gp) return { ...state, connected: false };

  const newState = { ...state, connected: true };
  const threshold = 0.5;

  // Left stick / D-pad for movement
  const axes = gp.axes;
  const buttons = gp.buttons;

  let dr = 0;
  let dc = 0;

  // Analog stick
  if (axes[1] < -threshold) dr = -1;
  if (axes[1] > threshold) dr = 1;
  if (axes[0] < -threshold) dc = -1;
  if (axes[0] > threshold) dc = 1;

  // D-pad (buttons 12-15)
  if (buttons[12]?.pressed) dr = -1; // Up
  if (buttons[13]?.pressed) dr = 1;  // Down
  if (buttons[14]?.pressed) dc = -1; // Left
  if (buttons[15]?.pressed) dc = 1;  // Right

  if (dr !== 0 || dc !== 0) {
    newState.cursor = {
      row: Math.max(0, Math.min(boardSize - 1, state.cursor.row + dr)),
      col: Math.max(0, Math.min(boardSize - 1, state.cursor.col + dc)),
    };
  }

  // A button (button 0) to fire
  if (buttons[0]?.pressed) {
    onFire(newState.cursor);
  }

  return newState;
}
