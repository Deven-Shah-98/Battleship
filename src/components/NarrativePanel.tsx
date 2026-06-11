import { useState } from "react";
import {
  loadCrew, hireCrew, loadLoreCards, loadMemorial,
  loadNemesis, getNemesisTaunt, FACTIONS, loadFaction, saveFaction,
  type CrewMember, type Faction,
} from "../game/narrative";

/* ─── Captain's Log Panel ─── */
export function CaptainsLog({ entries }: { entries: { turn: number; text: string; mood: string }[] }) {
  return (
    <div className="panel glass" style={{ maxHeight: "300px", overflowY: "auto" }}>
      <h3 style={{ margin: "0 0 0.5rem" }}>📜 Captain's Log</h3>
      {entries.length === 0 && <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>No entries yet. Start a game!</p>}
      {entries.map((entry, i) => (
        <div key={i} style={{ padding: "0.3rem 0", borderBottom: "1px solid var(--glass-border)", fontSize: "0.85rem" }}>
          <span style={{ opacity: 0.5 }}>Turn {entry.turn}:</span>{" "}
          <span style={{ fontStyle: "italic" }}>{entry.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Crew Panel ─── */
export function CrewPanel({ onClose }: { onClose: () => void }) {
  const [crew, setCrew] = useState(loadCrew);
  const roles: CrewMember["role"][] = ["navigator", "gunner", "engineer", "lookout", "medic"];

  const handleHire = (role: CrewMember["role"]) => {
    hireCrew(role);
    setCrew(loadCrew());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <h2>👥 Crew Quarters</h2>
        <p style={{ opacity: 0.7, fontSize: "0.85rem" }}>Hire and level crew members for passive bonuses.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.5rem", margin: "1rem 0" }}>
          {crew.map(member => (
            <div key={member.id} className="glass" style={{ padding: "0.5rem", borderRadius: "8px" }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{member.name}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.7, textTransform: "capitalize" }}>{member.role} Lv.{member.level}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--accent)" }}>{member.bonus}: +{member.bonusValue}</div>
              <div style={{ fontSize: "0.65rem", opacity: 0.5 }}>XP: {member.xp}/{member.level * 100}</div>
            </div>
          ))}
        </div>

        {crew.length < 5 && (
          <div>
            <h4 style={{ margin: "0.5rem 0" }}>Hire New Crew</h4>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {roles.map(role => (
                <button key={role} className="btn-sm" onClick={() => handleHire(role)} style={{ textTransform: "capitalize" }}>
                  + {role}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="btn" onClick={onClose} style={{ marginTop: "1rem" }}>Close</button>
      </div>
    </div>
  );
}

/* ─── Lore Cards Panel ─── */
export function LoreCardsPanel({ onClose }: { onClose: () => void }) {
  const cards = loadLoreCards();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <h2>📚 Fleet Lore</h2>
        <div style={{ display: "grid", gap: "0.75rem", margin: "1rem 0" }}>
          {cards.map(card => (
            <div key={card.shipType} className="glass" style={{ padding: "0.75rem", borderRadius: "8px", opacity: card.unlocked ? 1 : 0.4 }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{card.unlocked ? card.title : "???"}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{card.shipType}</div>
              {card.unlocked ? (
                <p style={{ fontSize: "0.8rem", margin: "0.5rem 0 0", lineHeight: 1.4 }}>{card.story}</p>
              ) : (
                <p style={{ fontSize: "0.8rem", margin: "0.5rem 0 0", fontStyle: "italic" }}>Sink this ship type to unlock its story.</p>
              )}
            </div>
          ))}
        </div>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ─── Memorial Wall ─── */
export function MemorialWall({ onClose }: { onClose: () => void }) {
  const memorial = loadMemorial();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <h2>🪦 Memorial Wall</h2>
        <p style={{ opacity: 0.7, fontSize: "0.85rem" }}>Honoring ships that served with distinction.</p>
        {memorial.length === 0 && <p style={{ opacity: 0.5 }}>No entries yet. Play more games!</p>}
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {memorial.map((entry, i) => (
            <div key={i} className="glass" style={{ padding: "0.5rem", margin: "0.5rem 0", borderRadius: "8px" }}>
              <div style={{ fontWeight: 600 }}>{entry.customName ?? entry.shipName} {entry.heroicDeath ? "⭐" : ""}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                Kills: {entry.kills} | Games: {entry.gamesServed} | Longest survival: {entry.longestSurvival} turns
              </div>
              <div style={{ fontSize: "0.7rem", opacity: 0.5 }}>Retired: {entry.dateRetired}</div>
            </div>
          ))}
        </div>
        <button className="btn" onClick={onClose} style={{ marginTop: "1rem" }}>Close</button>
      </div>
    </div>
  );
}

/* ─── Faction Selector ─── */
export function FactionSelector({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<Faction>(loadFaction);

  const handleSelect = (faction: Faction) => {
    setSelected(faction);
    saveFaction(faction);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <h2>⚔️ Choose Your Faction</h2>
        <div style={{ display: "grid", gap: "0.75rem", margin: "1rem 0" }}>
          {Object.values(FACTIONS).map(faction => (
            <div
              key={faction.id}
              className="glass"
              onClick={() => handleSelect(faction.id)}
              style={{
                padding: "1rem",
                borderRadius: "8px",
                cursor: "pointer",
                border: selected === faction.id ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "1rem" }}>{faction.name}</div>
              <div style={{ fontSize: "0.8rem", opacity: 0.7, margin: "0.3rem 0" }}>{faction.description}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--accent)" }}>🎯 {faction.specialAbility}</div>
            </div>
          ))}
        </div>
        <button className="btn" onClick={onClose} style={{ marginTop: "1rem" }}>Close</button>
      </div>
    </div>
  );
}

/* ─── Nemesis Display ─── */
export function NemesisDisplay() {
  const nemesis = loadNemesis();
  const taunt = getNemesisTaunt();

  if (nemesis.gamesPlayed < 3) return null;

  return (
    <div className="glass" style={{ padding: "0.5rem 0.75rem", borderRadius: "8px", fontSize: "0.8rem" }}>
      <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>🎭 The Admiral</div>
      <div style={{ opacity: 0.7 }}>
        Record: {nemesis.aiWins}W - {nemesis.playerWins}L | Grudge: {"🔥".repeat(nemesis.grudgeLevel)}
      </div>
      {taunt && <div style={{ fontStyle: "italic", marginTop: "0.3rem", color: "var(--accent)" }}>"{taunt}"</div>}
    </div>
  );
}
