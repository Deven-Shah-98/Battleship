import type { GameSettings } from "../game/settings";

interface Props {
  settings: GameSettings;
  onChange: (s: GameSettings) => void;
  onClose: () => void;
}

export function SettingsPanel({ settings, onChange, onClose }: Props) {
  const toggle = (key: keyof GameSettings) => {
    onChange({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>&times;</button>
        <h2>Settings</h2>
        <p className="settings-intro">Customize your gameplay experience. Changes take effect on the next game. Hover over any setting for more details.</p>

        <div className="settings-section">
          <h3>Accessibility</h3>
          <p className="settings-section-desc">Make the game comfortable for everyone. These settings adapt the visuals and layout to your needs.</p>
          <label className="settings-toggle" title="Stops all CSS animations and transitions — recommended for users sensitive to motion or vestibular disorders.">
            <input type="checkbox" checked={settings.reduceMotion} onChange={() => toggle("reduceMotion")} />
            <span>Reduce Motion</span>
            <span className="settings-desc">Disable animations for motion sensitivity</span>
          </label>
          <label className="settings-toggle" title="Adds patterns (stripes, dots, crosshatch) to cells in addition to colors, so you can distinguish hit/miss/ship without relying on color alone.">
            <input type="checkbox" checked={settings.colorBlindMode} onChange={() => toggle("colorBlindMode")} />
            <span>Color-Blind Mode</span>
            <span className="settings-desc">Use patterns + shapes instead of color alone</span>
          </label>
          <label className="settings-toggle" title="Mirrors the board layout so the enemy board is on the left and your board is on the right — more natural for left-handed players.">
            <input type="checkbox" checked={settings.leftHanded} onChange={() => toggle("leftHanded")} />
            <span>Left-Handed Layout</span>
            <span className="settings-desc">Swap board positions (enemy on left)</span>
          </label>
          <div className="settings-slider" title="Scale all text in the game. Useful if the default text is too small or too large for your screen.">
            <label>Font Size: {settings.fontSize}%</label>
            <input
              type="range"
              min={80}
              max={150}
              step={5}
              value={settings.fontSize}
              onChange={(e) => onChange({ ...settings, fontSize: Number(e.target.value) })}
            />
            <span className="settings-desc">Adjust text size across the entire game (80%–150%)</span>
          </div>
        </div>

        <div className="settings-section">
          <h3>Gameplay Assists</h3>
          <p className="settings-section-desc">Tools to help you play smarter. Great for learning or when you want a more guided experience.</p>
          <label className="settings-toggle" title="Dims cells that cannot possibly contain a ship based on sunk ship positions and board constraints. Reduces wasted shots, especially helpful for newer players.">
            <input type="checkbox" checked={settings.smartAssist} onChange={() => toggle("smartAssist")} />
            <span>Smart Assist</span>
            <span className="settings-desc">Highlight cells that are guaranteed misses</span>
          </label>
          <label className="settings-toggle" title="Shows a color-coded overlay on each enemy cell indicating the AI-computed probability of a ship being there. Brighter = more likely. Uses the same logic as the Hard AI difficulty.">
            <input type="checkbox" checked={settings.showProbability} onChange={() => toggle("showProbability")} />
            <span>Probability Overlay</span>
            <span className="settings-desc">Show hit probability per cell (uses AI heatmap)</span>
          </label>
          <label className="settings-toggle" title="Right-click any cell to mark it with a colored tag: yellow for 'maybe ship here' or grey for 'unlikely'. Helps you track your deductions visually during gameplay.">
            <input type="checkbox" checked={settings.boardAnnotations} onChange={() => toggle("boardAnnotations")} />
            <span>Board Annotations</span>
            <span className="settings-desc">Right-click cells to mark as &quot;maybe&quot; or &quot;unlikely&quot;</span>
          </label>
          <label className="settings-toggle" title="Adds a brief screen shake effect when you land a critical hit (sinking a ship). Purely cosmetic — creates dramatic emphasis.">
            <input type="checkbox" checked={settings.screenShake} onChange={() => toggle("screenShake")} />
            <span>Screen Shake</span>
            <span className="settings-desc">Shake screen on critical hits (ship sinks)</span>
          </label>
        </div>

        <div className="settings-section">
          <h3>Notifications</h3>
          <p className="settings-section-desc">Stay informed when the game needs your attention, even in a background tab.</p>
          <label className="settings-toggle" title="Sends a browser notification when the AI finishes its turn, useful when you've tabbed away. Requires browser notification permission.">
            <input type="checkbox" checked={settings.desktopNotifications} onChange={() => toggle("desktopNotifications")} />
            <span>Desktop Notifications</span>
            <span className="settings-desc">Notify when AI finishes its turn (background tab)</span>
          </label>
          <label className="settings-toggle" title="Plays an audible tick-tick-tick sound when your turn timer drops below 5 seconds. Helps you notice when time is running out.">
            <input type="checkbox" checked={settings.countdownTick} onChange={() => toggle("countdownTick")} />
            <span>Countdown Tick</span>
            <span className="settings-desc">Audible tick when timer is below 5 seconds</span>
          </label>
        </div>

        <div className="settings-section">
          <h3>Board Variants</h3>
          <p className="settings-section-desc">Modify the game board with terrain and environmental hazards. These add strategic depth and variety to every match.</p>
          <label className="settings-toggle" title="Places random impassable island cells on both boards. Ships cannot be placed on islands, and shots fired at them always miss. Visible to both players.">
            <input type="checkbox" checked={settings.enableIslands} onChange={() => toggle("enableIslands")} />
            <span>Islands</span>
            <span className="settings-desc">Random impassable island cells on the board</span>
          </label>
          <label className="settings-toggle" title="Scatters hidden reef cells across the board. Shots landing on reefs always miss. You won't know where reefs are until you fire at them — they're revealed on impact.">
            <input type="checkbox" checked={settings.enableReefs} onChange={() => toggle("enableReefs")} />
            <span>Hidden Reefs</span>
            <span className="settings-desc">Some cells always miss (revealed when shot)</span>
          </label>
          <label className="settings-toggle" title="Every 10 turns, the outermost ring of the board becomes blocked. Ships in the blocked zone are destroyed. Forces action toward the center — battle royale style!">
            <input type="checkbox" checked={settings.enableShrinking} onChange={() => toggle("enableShrinking")} />
            <span>Shrinking Board</span>
            <span className="settings-desc">Outer ring becomes blocked every 10 turns</span>
          </label>
        </div>

        <div className="settings-section">
          <h3>Advanced Mechanics</h3>
          <p className="settings-section-desc">Extra rules that transform gameplay. Enable one or combine several for unique game experiences.</p>
          <label className="settings-toggle" title="Each ship starts with one energy shield that absorbs the first incoming hit. The shot registers as a miss, but the shield is consumed. Ships still sink normally after the shield is gone.">
            <input type="checkbox" checked={settings.enableShields} onChange={() => toggle("enableShields")} />
            <span>Ship Shields</span>
            <span className="settings-desc">Each ship absorbs its first hit with a shield</span>
          </label>
          <label className="settings-toggle" title="During setup, place 2-3 defensive mines on your board. If the enemy fires at a mined cell, the shot is negated and they lose their next turn. Strategic area denial!">
            <input type="checkbox" checked={settings.enableMines} onChange={() => toggle("enableMines")} />
            <span>Minefields</span>
            <span className="settings-desc">Place defensive mines during setup</span>
          </label>
          <label className="settings-toggle" title="After each turn, you can optionally move one un-hit ship one cell in any direction (up/down/left/right). Adds a whole new evasion and positioning strategy layer.">
            <input type="checkbox" checked={settings.enableMovingShips} onChange={() => toggle("enableMovingShips")} />
            <span>Moving Ships</span>
            <span className="settings-desc">Move one un-hit ship 1 cell per turn</span>
          </label>
          <label className="settings-toggle" title="Your hit and miss markers fade from the tracking board after 8 turns unless the area is re-scouted (by firing near it again). Tests your memory and map awareness!">
            <input type="checkbox" checked={settings.enableFogDecay} onChange={() => toggle("enableFogDecay")} />
            <span>Fog of War Decay</span>
            <span className="settings-desc">Hits/misses fade after 8 turns</span>
          </label>
          <label className="settings-toggle" title="When a ship sinks, all cells immediately adjacent to it (8 surrounding cells) are automatically hit. Can trigger chain sinks if another ship is nearby — devastating!">
            <input type="checkbox" checked={settings.enableChainReaction} onChange={() => toggle("enableChainReaction")} />
            <span>Chain Reaction</span>
            <span className="settings-desc">Sinking a ship damages adjacent cells</span>
          </label>
          <label className="settings-toggle" title="Every 3 turns, a scout plane automatically reveals whether a random row or column contains any ships. The result appears briefly as an announcement in the battle log.">
            <input type="checkbox" checked={settings.enableScoutPlane} onChange={() => toggle("enableScoutPlane")} />
            <span>Scout Plane</span>
            <span className="settings-desc">Every 3 turns, reveal if a row/col has ships</span>
          </label>
          <label className="settings-toggle" title="The board is darkened and you can only see a 3-cell radius around your last shot. Everything else is hidden in darkness. Tests memory and spatial awareness!">
            <input type="checkbox" checked={settings.nightMode} onChange={() => toggle("nightMode")} />
            <span>Night Mode Battle</span>
            <span className="settings-desc">Limited visibility — 3-cell radius around last shot</span>
          </label>
        </div>

        <div className="settings-section">
          <h3>Platform</h3>
          <p className="settings-section-desc">Alternative input methods and display options. Enable based on your hardware and preferences.</p>
          <label className="settings-toggle" title="Play using an Xbox or PlayStation controller via the browser's Gamepad API. D-pad navigates cells, A/X button fires, triggers for power-ups.">
            <input type="checkbox" checked={settings.gamepadEnabled} onChange={() => toggle("gamepadEnabled")} />
            <span>Gamepad Support</span>
            <span className="settings-desc">Play with Xbox/PlayStation controller</span>
          </label>
          <label className="settings-toggle" title="Say 'Fire B4' or any coordinate to fire using your microphone (Web Speech API). The game listens for 'Fire' followed by a column letter and row number.">
            <input type="checkbox" checked={settings.voiceCommands} onChange={() => toggle("voiceCommands")} />
            <span>Voice Commands</span>
            <span className="settings-desc">&quot;Fire B4&quot; — speak coordinates to fire</span>
          </label>
          <label className="settings-toggle" title="Opens the enemy board in a Picture-in-Picture floating window. Useful for keeping the enemy board visible while scrolling your own board on smaller screens.">
            <input type="checkbox" checked={settings.pipEnabled} onChange={() => toggle("pipEnabled")} />
            <span>Picture-in-Picture</span>
            <span className="settings-desc">Pop out enemy board into floating window</span>
          </label>
        </div>
      </div>
    </div>
  );
}
