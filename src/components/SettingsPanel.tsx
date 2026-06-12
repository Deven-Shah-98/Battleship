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
          <label className="settings-toggle" title="Every 3 turns, a scout plane automatically reveals whether a random row or column contains any ships. The result appears briefly as an announcement in the battle log.">
            <input type="checkbox" checked={settings.enableScoutPlane} onChange={() => toggle("enableScoutPlane")} />
            <span>Scout Plane</span>
            <span className="settings-desc">Every 3 turns, reveal if a row/col has ships</span>
          </label>
          <label className="settings-toggle" title="When you're down to your last ship, Last Stand activates and grants a free Radar scan — a comeback mechanic that keeps close games exciting.">
            <input type="checkbox" checked={settings.enableComebackMechanic} onChange={() => toggle("enableComebackMechanic")} />
            <span>Comeback Mechanic</span>
            <span className="settings-desc">Free Radar scan when down to your final ship</span>
          </label>
        </div>
      </div>
    </div>
  );
}
