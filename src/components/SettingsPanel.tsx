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

        <div className="settings-section">
          <h3>Accessibility</h3>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.reduceMotion} onChange={() => toggle("reduceMotion")} />
            <span>Reduce Motion</span>
            <span className="settings-desc">Disable animations for motion sensitivity</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.colorBlindMode} onChange={() => toggle("colorBlindMode")} />
            <span>Color-Blind Mode</span>
            <span className="settings-desc">Use patterns + shapes instead of color alone</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.leftHanded} onChange={() => toggle("leftHanded")} />
            <span>Left-Handed Layout</span>
            <span className="settings-desc">Swap board positions (enemy on left)</span>
          </label>
          <div className="settings-slider">
            <label>Font Size: {settings.fontSize}%</label>
            <input
              type="range"
              min={80}
              max={150}
              step={5}
              value={settings.fontSize}
              onChange={(e) => onChange({ ...settings, fontSize: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="settings-section">
          <h3>Gameplay Assists</h3>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.smartAssist} onChange={() => toggle("smartAssist")} />
            <span>Smart Assist</span>
            <span className="settings-desc">Highlight cells that are guaranteed misses</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.showProbability} onChange={() => toggle("showProbability")} />
            <span>Probability Overlay</span>
            <span className="settings-desc">Show hit probability per cell (uses AI heatmap)</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.boardAnnotations} onChange={() => toggle("boardAnnotations")} />
            <span>Board Annotations</span>
            <span className="settings-desc">Right-click cells to mark as "maybe" or "unlikely"</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.screenShake} onChange={() => toggle("screenShake")} />
            <span>Screen Shake</span>
            <span className="settings-desc">Shake screen on critical hits</span>
          </label>
        </div>

        <div className="settings-section">
          <h3>Notifications</h3>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.desktopNotifications} onChange={() => toggle("desktopNotifications")} />
            <span>Desktop Notifications</span>
            <span className="settings-desc">Notify when AI finishes its turn (background tab)</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.countdownTick} onChange={() => toggle("countdownTick")} />
            <span>Countdown Tick</span>
            <span className="settings-desc">Audible tick when timer is below 5 seconds</span>
          </label>
        </div>

        <div className="settings-section">
          <h3>Board Variants</h3>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.enableIslands} onChange={() => toggle("enableIslands")} />
            <span>Islands</span>
            <span className="settings-desc">Random impassable island cells on the board</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.enableReefs} onChange={() => toggle("enableReefs")} />
            <span>Hidden Reefs</span>
            <span className="settings-desc">Some cells always miss (revealed when shot)</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.enableShrinking} onChange={() => toggle("enableShrinking")} />
            <span>Shrinking Board</span>
            <span className="settings-desc">Outer ring becomes blocked every 10 turns</span>
          </label>
        </div>

        <div className="settings-section">
          <h3>Advanced Mechanics</h3>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.enableShields} onChange={() => toggle("enableShields")} />
            <span>Ship Shields</span>
            <span className="settings-desc">Each ship absorbs its first hit</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.enableMines} onChange={() => toggle("enableMines")} />
            <span>Minefields</span>
            <span className="settings-desc">Place defensive mines during setup</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.enableMovingShips} onChange={() => toggle("enableMovingShips")} />
            <span>Moving Ships</span>
            <span className="settings-desc">Move one un-hit ship 1 cell per turn</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.enableFogDecay} onChange={() => toggle("enableFogDecay")} />
            <span>Fog of War Decay</span>
            <span className="settings-desc">Hits/misses fade after 8 turns</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.enableChainReaction} onChange={() => toggle("enableChainReaction")} />
            <span>Chain Reaction</span>
            <span className="settings-desc">Sinking a ship damages adjacent cells</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.enableScoutPlane} onChange={() => toggle("enableScoutPlane")} />
            <span>Scout Plane</span>
            <span className="settings-desc">Every 3 turns, reveal if a row/col has ships</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.nightMode} onChange={() => toggle("nightMode")} />
            <span>Night Mode Battle</span>
            <span className="settings-desc">Limited visibility around last shot</span>
          </label>
        </div>

        <div className="settings-section">
          <h3>Platform</h3>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.gamepadEnabled} onChange={() => toggle("gamepadEnabled")} />
            <span>Gamepad Support</span>
            <span className="settings-desc">Play with controller via Gamepad API</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.voiceCommands} onChange={() => toggle("voiceCommands")} />
            <span>Voice Commands</span>
            <span className="settings-desc">&quot;Fire B4&quot; via Speech API</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.pipEnabled} onChange={() => toggle("pipEnabled")} />
            <span>Picture-in-Picture</span>
            <span className="settings-desc">Pop out enemy board into PiP window</span>
          </label>
        </div>
      </div>
    </div>
  );
}
