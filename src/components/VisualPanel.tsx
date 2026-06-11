import { useState } from "react";
import {
  BOARD_SKINS, loadBoardSkin, saveBoardSkin,
  type BoardSkin, type DayNightState,
} from "../game/visual";
import {
  getCurrentSeasonalEvent, DIFFICULTY_PRESETS, loadUpgrades, type ShipUpgrade,
} from "../game/progression2";
import { loadCustomRules, type CustomRuleSet } from "../game/social";

/* ─── Board Skin Selector ─── */
export function BoardSkinSelector({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<BoardSkin>(loadBoardSkin);

  const handleSelect = (skin: BoardSkin) => {
    setSelected(skin);
    saveBoardSkin(skin);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <h2>🎨 Board Skins</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.5rem", margin: "1rem 0" }}>
          {BOARD_SKINS.map(skin => (
            <div
              key={skin.id}
              className="glass"
              onClick={() => handleSelect(skin.id)}
              style={{
                padding: "0.75rem",
                borderRadius: "8px",
                cursor: "pointer",
                border: selected === skin.id ? "2px solid var(--accent)" : "2px solid transparent",
                background: skin.bgGradient,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#fff" }}>{skin.name}</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.7, color: "#fff" }}>{skin.description}</div>
              <div style={{ display: "flex", gap: "4px", marginTop: "0.3rem" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: skin.waterColor }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: skin.hitColor }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: skin.missColor }} />
              </div>
            </div>
          ))}
        </div>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ─── Day/Night Indicator ─── */
export function DayNightIndicator({ state }: { state: DayNightState }) {
  const icons: Record<string, string> = {
    dawn: "🌅", morning: "🌤️", midday: "☀️", afternoon: "🌥️", dusk: "🌇", night: "🌙",
  };
  return (
    <div className="glass" style={{ padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
      <span>{icons[state.currentTime] ?? "☀️"}</span>
      <span style={{ textTransform: "capitalize" }}>{state.currentTime}</span>
    </div>
  );
}

/* ─── Seasonal Event Banner ─── */
export function SeasonalBanner() {
  const event = getCurrentSeasonalEvent();
  const [dismissed, setDismissed] = useState(() => {
    if (!event) return true;
    return sessionStorage.getItem(`banner_dismissed_${event.name}`) === "1";
  });

  if (!event || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(`banner_dismissed_${event.name}`, "1");
    setDismissed(true);
  };

  return (
    <div className="glass" style={{
      padding: "0.5rem 1rem", borderRadius: "8px", margin: "0.5rem 0",
      borderLeft: "3px solid var(--accent)", fontSize: "0.85rem",
      display: "flex", alignItems: "center", gap: "12px",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700 }}>🎉 {event.name}</div>
        <div style={{ opacity: 0.7, fontSize: "0.75rem" }}>{event.description}</div>
        <div style={{ opacity: 0.5, fontSize: "0.65rem" }}>+{event.bonusXP} bonus XP per game</div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss banner"
        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem", padding: "4px" }}
      >
        ×
      </button>
    </div>
  );
}

/* ─── Upgrade Tree Panel ─── */
export function UpgradeTreePanel({ onClose, availableXP }: { onClose: () => void; availableXP: number }) {
  const [upgrades] = useState(loadUpgrades);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "700px" }}>
        <h2>🔧 Ship Upgrade Tree</h2>
        <p style={{ opacity: 0.7, fontSize: "0.85rem" }}>Spend XP to permanently upgrade your ships. Available XP: <strong>{availableXP}</strong></p>
        <div style={{ maxHeight: "500px", overflowY: "auto" }}>
          {Object.entries(upgrades).map(([shipType, tree]) => (
            <div key={shipType} style={{ margin: "0.75rem 0" }}>
              <h4 style={{ margin: "0 0 0.3rem", color: "var(--accent)" }}>{shipType}</h4>
              <div style={{ display: "grid", gap: "0.3rem" }}>
                {tree.map((upgrade: ShipUpgrade) => (
                  <div key={upgrade.id} className="glass" style={{ padding: "0.4rem 0.6rem", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{upgrade.name}</div>
                      <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>{upgrade.description}</div>
                      <div style={{ fontSize: "0.65rem", opacity: 0.4 }}>Level {upgrade.level}/{upgrade.maxLevel} | Cost: {upgrade.cost} XP</div>
                    </div>
                    <div style={{ display: "flex", gap: "2px" }}>
                      {Array.from({ length: upgrade.maxLevel }, (_, i) => (
                        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < upgrade.level ? "var(--accent)" : "var(--glass-border)" }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className="btn" onClick={onClose} style={{ marginTop: "1rem" }}>Close</button>
      </div>
    </div>
  );
}

/* ─── Difficulty Presets ─── */
export function DifficultyPresetsPanel({ onSelect, onClose }: { onSelect: (presetId: string) => void; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "550px" }}>
        <h2>🎮 Difficulty Presets</h2>
        <div style={{ display: "grid", gap: "0.5rem", margin: "1rem 0" }}>
          {DIFFICULTY_PRESETS.map(preset => (
            <div
              key={preset.id}
              className="glass"
              onClick={() => onSelect(preset.id)}
              style={{ padding: "0.75rem", borderRadius: "8px", cursor: "pointer" }}
            >
              <div style={{ fontWeight: 600 }}>{preset.name}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{preset.description}</div>
              <div style={{ fontSize: "0.65rem", opacity: 0.4, marginTop: "0.2rem" }}>
                AI Mod: {preset.aiAccuracyMod > 0 ? "+" : ""}{Math.round(preset.aiAccuracyMod * 100)}% |
                Power-ups: {preset.powerUpsEnabled ? "Yes" : "No"} |
                Weather: {preset.weatherEnabled ? "Yes" : "No"} |
                Hints: {preset.hints ? "Yes" : "No"}
              </div>
            </div>
          ))}
        </div>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ─── Custom Rules Panel ─── */
export function CustomRulesPanel({ onClose, onApply }: { onClose: () => void; onApply: (rules: CustomRuleSet) => void }) {
  const rules = loadCustomRules();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "550px" }}>
        <h2>📝 Custom Rules</h2>
        {rules.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No custom rule sets created yet. Feature coming soon!</p>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem", margin: "1rem 0" }}>
            {rules.map(rule => (
              <div key={rule.id} className="glass" style={{ padding: "0.75rem", borderRadius: "8px", cursor: "pointer" }} onClick={() => onApply(rule)}>
                <div style={{ fontWeight: 600 }}>{rule.name}</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{rule.description}</div>
              </div>
            ))}
          </div>
        )}
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ─── Win Probability Display ─── */
export function WinProbabilityBar({ probability }: { probability: number }) {
  const pct = Math.round(probability * 100);
  const color = pct >= 60 ? "#4caf50" : pct >= 40 ? "#ff9800" : "#f44336";
  return (
    <div className="glass" style={{ padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem" }} title="Your estimated chance of winning based on ships remaining, accuracy, and board state. Green = favorable, orange = even, red = losing.">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
        <span>Win Probability</span>
        <span style={{ fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: "var(--glass-border)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

/* ─── Morale Indicator ─── */
export function MoraleIndicator({ morale }: { morale: number }) {
  const emoji = morale >= 80 ? "😄" : morale >= 60 ? "😊" : morale >= 40 ? "😐" : morale >= 20 ? "😟" : "😰";
  const color = morale >= 60 ? "#4caf50" : morale >= 40 ? "#ff9800" : "#f44336";
  return (
    <div className="glass" style={{ padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }} title="Your fleet's morale. Rises with hits and sinks, drops on misses. High morale boosts XP earned!">
      <span>{emoji}</span>
      <span>Morale: </span>
      <span style={{ fontWeight: 700, color }}>{morale}%</span>
    </div>
  );
}
