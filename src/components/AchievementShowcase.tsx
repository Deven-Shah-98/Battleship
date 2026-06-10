/** Achievement Showcase — pin favorite achievements to profile */
import { useState, useEffect } from "react";
import { ACHIEVEMENTS, loadAchievements } from "../game/achievements";

const STORAGE_KEY = "battleship.achievementShowcase";
const MAX_PINNED = 3;

interface Props {
  open: boolean;
  onClose: () => void;
}

function loadPinned(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch { /* ignore */ }
  return [];
}

function savePinned(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch { /* ignore */ }
}

export function getPinnedAchievements(): string[] {
  return loadPinned();
}

export function AchievementShowcase({ open, onClose }: Props) {
  const [pinned, setPinned] = useState<string[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPinned(loadPinned());
    const achData = loadAchievements();
    setUnlocked(new Set(Object.keys(achData).filter((id) => achData[id].unlocked)));
  }, [open]);

  const toggle = (id: string) => {
    let next: string[];
    if (pinned.includes(id)) {
      next = pinned.filter((p) => p !== id);
    } else if (pinned.length < MAX_PINNED) {
      next = [...pinned, id];
    } else {
      return;
    }
    setPinned(next);
    savePinned(next);
  };

  if (!open) return null;

  const unlockedAchievements = ACHIEVEMENTS.filter((a) => unlocked.has(a.id));

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Achievement Showcase">
        <div className="modal__header">
          <h2>Achievement Showcase</h2>
          <button type="button" className="modal__close" onClick={onClose}>&times;</button>
        </div>
        <p style={{ opacity: 0.7, marginBottom: "1rem" }}>Pin up to {MAX_PINNED} achievements to your profile.</p>
        {unlockedAchievements.length === 0 ? (
          <p>No achievements unlocked yet. Play some games!</p>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {unlockedAchievements.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => toggle(a.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  background: pinned.includes(a.id)
                    ? "rgba(var(--accent-rgb, 250,80,80), 0.2)"
                    : "rgba(255,255,255,0.05)",
                  border: pinned.includes(a.id)
                    ? "1px solid var(--accent)"
                    : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: "inherit",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>{a.icon}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.name}</div>
                  <div style={{ opacity: 0.7, fontSize: "0.85rem" }}>{a.description}</div>
                </div>
                {pinned.includes(a.id) && <span style={{ marginLeft: "auto" }}>📌</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
