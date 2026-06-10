import { useState } from "react";
import { loadLoadouts, addLoadout, deleteLoadout, type Loadout } from "../game/loadouts";
import type { ShipDef, GameMode, AIPersonality } from "../game/types";

interface Props {
  onApply: (loadout: Loadout) => void;
  onClose: () => void;
  currentSettings: {
    boardSize: number;
    fleet: ShipDef[];
    difficulty: string;
    gameMode: GameMode;
    aiPersonality: AIPersonality;
    enablePowerUps: boolean;
    enableWeather: boolean;
    timedTurns: number;
    aiSpeed: string;
  };
}

export function LoadoutPanel({ onApply, onClose, currentSettings }: Props) {
  const [loadouts, setLoadouts] = useState(loadLoadouts);
  const [newName, setNewName] = useState("");

  const handleSave = () => {
    if (!newName.trim()) return;
    const lo = addLoadout({ name: newName.trim(), ...currentSettings });
    setLoadouts((prev) => [...prev, lo]);
    setNewName("");
  };

  const handleDelete = (id: string) => {
    if (id.startsWith("preset-")) return; // don't delete presets
    deleteLoadout(id);
    setLoadouts((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal loadout-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>&times;</button>
        <h2>Loadout Presets</h2>

        <div className="loadout-list">
          {loadouts.map((lo) => (
            <div key={lo.id} className="loadout-card">
              <div className="loadout-card__header">
                <strong>{lo.name}</strong>
                <span className="loadout-card__meta">
                  {lo.boardSize}x{lo.boardSize} · {lo.difficulty} · {lo.gameMode}
                </span>
              </div>
              <div className="loadout-card__details">
                <span>{lo.fleet.length} ships</span>
                <span>{lo.aiPersonality}</span>
                {lo.enablePowerUps && <span>Power-ups</span>}
                {lo.enableWeather && <span>Weather</span>}
                {lo.timedTurns > 0 && <span>{lo.timedTurns}s timer</span>}
              </div>
              <div className="loadout-card__actions">
                <button className="btn btn--small btn--accent" onClick={() => onApply(lo)}>
                  Apply
                </button>
                {!lo.id.startsWith("preset-") && (
                  <button className="btn btn--small btn--ghost" onClick={() => handleDelete(lo.id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="loadout-save">
          <input
            type="text"
            placeholder="Loadout name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={30}
            className="loadout-input"
          />
          <button className="btn btn--accent btn--small" onClick={handleSave} disabled={!newName.trim()}>
            Save Current
          </button>
        </div>
      </div>
    </div>
  );
}
