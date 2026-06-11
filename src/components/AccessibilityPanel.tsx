import { useState } from "react";
import {
  loadA11ySettings, saveA11ySettings, applyA11yToDOM,
  type AccessibilitySettings, DEFAULT_A11Y,
} from "../game/accessibility";

export function AccessibilityPanel({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(loadA11ySettings);

  const update = (patch: Partial<AccessibilitySettings>) => {
    const newSettings = { ...settings, ...patch };
    setSettings(newSettings);
    saveA11ySettings(newSettings);
    applyA11yToDOM(newSettings);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "550px" }}>
        <h2>♿ Accessibility Settings</h2>

        <div style={{ display: "grid", gap: "0.75rem", margin: "1rem 0" }}>
          {/* Screen Reader Narration */}
          <label className="glass" style={{ padding: "0.6rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Screen Reader Narration</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>Announce all game events via ARIA live regions</div>
            </div>
            <input type="checkbox" checked={settings.screenReaderNarration} onChange={e => update({ screenReaderNarration: e.target.checked })} />
          </label>

          {/* One-Switch Mode */}
          <label className="glass" style={{ padding: "0.6rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>One-Switch Mode</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>Auto-scanning grid, single button to confirm</div>
            </div>
            <input type="checkbox" checked={settings.oneSwitchMode} onChange={e => update({ oneSwitchMode: e.target.checked })} />
          </label>

          {/* Dyslexia Font */}
          <label className="glass" style={{ padding: "0.6rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Dyslexia-Friendly Font</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>OpenDyslexic font for improved readability</div>
            </div>
            <input type="checkbox" checked={settings.dyslexiaFont} onChange={e => update({ dyslexiaFont: e.target.checked })} />
          </label>

          {/* High Contrast */}
          <label className="glass" style={{ padding: "0.6rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>High Contrast Tactical</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>Pure black/white/red with geometric patterns</div>
            </div>
            <input type="checkbox" checked={settings.highContrastTactical} onChange={e => update({ highContrastTactical: e.target.checked })} />
          </label>

          {/* Reduce Motion */}
          <label className="glass" style={{ padding: "0.6rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Reduce Motion</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>Disable all animations and transitions</div>
            </div>
            <input type="checkbox" checked={settings.reduceMotion} onChange={e => update({ reduceMotion: e.target.checked })} />
          </label>

          {/* Simplified Mode */}
          <label className="glass" style={{ padding: "0.6rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Simplified Mode</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>Hide progression, show only core gameplay</div>
            </div>
            <input type="checkbox" checked={settings.simplifiedMode} onChange={e => update({ simplifiedMode: e.target.checked })} />
          </label>

          {/* Text Size */}
          <div className="glass" style={{ padding: "0.6rem", borderRadius: "8px" }}>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.3rem" }}>Text Size</div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["small", "medium", "large", "xl"] as const).map(size => (
                <button
                  key={size}
                  className={settings.textSize === size ? "btn-sm active" : "btn-sm"}
                  onClick={() => update({ textSize: size })}
                  style={{ textTransform: "capitalize", flex: 1, background: settings.textSize === size ? "var(--accent)" : undefined }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Blind Mode */}
          <div className="glass" style={{ padding: "0.6rem", borderRadius: "8px" }}>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.3rem" }}>Color Blind Mode</div>
            <select
              value={settings.colorBlindMode}
              onChange={e => update({ colorBlindMode: e.target.value as AccessibilitySettings["colorBlindMode"] })}
              style={{ width: "100%", padding: "0.4rem", borderRadius: "4px", background: "var(--bg-secondary)", color: "var(--text)", border: "1px solid var(--glass-border)" }}
            >
              <option value="none">None</option>
              <option value="protanopia">Protanopia (Red-blind)</option>
              <option value="deuteranopia">Deuteranopia (Green-blind)</option>
              <option value="tritanopia">Tritanopia (Blue-blind)</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn" onClick={() => { update(DEFAULT_A11Y); }} style={{ flex: 1 }}>Reset Defaults</button>
          <button className="btn" onClick={onClose} style={{ flex: 1 }}>Close</button>
        </div>
      </div>
    </div>
  );
}
