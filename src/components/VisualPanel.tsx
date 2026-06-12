import { useState } from "react";
import { getCurrentSeasonalEvent } from "../game/progression2";

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
