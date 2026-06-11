import {
  type RoguelikeState, type MultiRoundState,
} from "../game/experimental";
import {
  PUZZLES, loadPuzzleResults, calculatePuzzleStars,
  TRAINING_DRILLS, loadGraveyard,
  type Puzzle,
} from "../game/social";

/* ─── Mode Selector ─── */
export type ExperimentalMode =
  | "fog_exploration"
  | "minehunter"
  | "speed_chess"
  | "roguelike"
  | "chaos"
  | "artillery"
  | "blind"
  | "multi_round"
  | "puzzle"
  | null;

export function ExperimentalModeSelector({ onSelect, onClose }: { onSelect: (mode: ExperimentalMode) => void; onClose: () => void }) {
  const modes: { id: ExperimentalMode; name: string; desc: string; icon: string }[] = [
    { id: "fog_exploration", name: "Fog Exploration", desc: "Board starts dark; shots reveal 3×3 areas", icon: "🌫️" },
    { id: "minehunter", name: "Minehunter", desc: "Navigate mines to reach enemy ships", icon: "💣" },
    { id: "speed_chess", name: "Speed Chess", desc: "Total time bank — run out and lose!", icon: "⏱️" },
    { id: "roguelike", name: "Roguelike Run", desc: "10 games, escalating AI. One loss = restart", icon: "🎲" },
    { id: "chaos", name: "Chaos Mode", desc: "Random rule changes every 3 turns", icon: "🌀" },
    { id: "artillery", name: "Artillery", desc: "AoE shots (1×1, 2×2, 3×3) with ammo", icon: "💥" },
    { id: "blind", name: "Blind Mode", desc: "No feedback until end of turn", icon: "🙈" },
    { id: "multi_round", name: "Best of 5", desc: "Multi-round match with running score", icon: "🏆" },
    { id: "puzzle", name: "Puzzle Mode", desc: "Find the fleet in minimum shots", icon: "🧩" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "650px" }}>
        <h2>🧪 Experimental Modes</h2>
        <p style={{ opacity: 0.7, fontSize: "0.85rem" }}>Choose an experimental game mode for a unique twist!</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.5rem", margin: "1rem 0" }}>
          {modes.map(mode => (
            <div
              key={mode.id}
              className="glass"
              onClick={() => onSelect(mode.id)}
              style={{ padding: "0.75rem", borderRadius: "8px", cursor: "pointer", transition: "transform 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <div style={{ fontSize: "1.5rem" }}>{mode.icon}</div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", marginTop: "0.3rem" }}>{mode.name}</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.6, marginTop: "0.2rem" }}>{mode.desc}</div>
            </div>
          ))}
        </div>
        <button className="btn" onClick={onClose} style={{ marginTop: "0.5rem" }}>Cancel</button>
      </div>
    </div>
  );
}

/* ─── Roguelike Progress ─── */
export function RoguelikeProgress({ state }: { state: RoguelikeState }) {
  return (
    <div className="glass" style={{ padding: "0.5rem 0.75rem", borderRadius: "8px", fontSize: "0.8rem" }}>
      <div style={{ fontWeight: 600 }}>🎲 Roguelike Run</div>
      <div>Round {state.currentRound}/{state.maxRounds} | Score: {state.score}</div>
      <div style={{ opacity: 0.6 }}>
        Wins: {state.wins} | Power-ups: R{state.carryOverPowerUps.radar} S{state.carryOverPowerUps.sonar} A{state.carryOverPowerUps.airstrike}
      </div>
      <div style={{ opacity: 0.5, fontSize: "0.7rem" }}>
        Next difficulty: {state.difficulty[Math.min(state.currentRound, state.difficulty.length - 1)]}
      </div>
    </div>
  );
}

/* ─── Multi-Round Score ─── */
export function MultiRoundScore({ state }: { state: MultiRoundState }) {
  return (
    <div className="glass" style={{ padding: "0.5rem 0.75rem", borderRadius: "8px", fontSize: "0.85rem", textAlign: "center" }}>
      <div style={{ fontWeight: 600 }}>🏆 Best of {state.bestOf}</div>
      <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
        <span style={{ color: "#4caf50" }}>{state.playerScore}</span>
        {" - "}
        <span style={{ color: "#f44336" }}>{state.aiScore}</span>
      </div>
      <div style={{ opacity: 0.5, fontSize: "0.7rem" }}>Round {state.currentRound}</div>
    </div>
  );
}

/* ─── Chaos Mode Display ─── */
export function ChaosDisplay({ rule, description, turnsUntilChange }: { rule: string | null; description: string; turnsUntilChange: number }) {
  if (!rule) return null;
  return (
    <div className="glass" style={{ padding: "0.5rem 0.75rem", borderRadius: "8px", fontSize: "0.8rem", borderLeft: "3px solid #ff6600" }}>
      <div style={{ fontWeight: 600 }}>🌀 CHAOS</div>
      <div style={{ color: "#ff6600" }}>{description}</div>
      <div style={{ opacity: 0.5, fontSize: "0.7rem" }}>Changes in {turnsUntilChange} turns</div>
    </div>
  );
}

/* ─── Puzzle Selector ─── */
export function PuzzleSelector({ onSelect, onClose }: { onSelect: (puzzle: Puzzle) => void; onClose: () => void }) {
  const results = loadPuzzleResults();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <h2>🧩 Puzzle Mode</h2>
        <p style={{ opacity: 0.7, fontSize: "0.85rem" }}>Find the fleet in the fewest shots possible!</p>
        <div style={{ display: "grid", gap: "0.5rem", margin: "1rem 0" }}>
          {PUZZLES.map(puzzle => {
            const result = results.find(r => r.puzzleId === puzzle.id);
            const stars = result ? calculatePuzzleStars(result.shots, puzzle.parShots) : 0;
            return (
              <div
                key={puzzle.id}
                className="glass"
                onClick={() => onSelect(puzzle)}
                style={{ padding: "0.75rem", borderRadius: "8px", cursor: "pointer" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{puzzle.name}</div>
                    <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{puzzle.description}</div>
                    <div style={{ fontSize: "0.7rem", opacity: 0.5 }}>Par: {puzzle.parShots} shots | {puzzle.boardSize}×{puzzle.boardSize} | {puzzle.difficulty}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {result ? (
                      <div>
                        <div>{"⭐".repeat(stars)}{"☆".repeat(3 - stars)}</div>
                        <div style={{ fontSize: "0.7rem" }}>{result.shots} shots</div>
                      </div>
                    ) : (
                      <span style={{ opacity: 0.5 }}>—</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ─── Training Grounds ─── */
export function TrainingGroundsPanel({ onClose, onStart }: { onClose: () => void; onStart: (drillId: string) => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "550px" }}>
        <h2>🎯 Training Grounds</h2>
        <p style={{ opacity: 0.7, fontSize: "0.85rem" }}>Practice specific skills in isolated drills.</p>
        <div style={{ display: "grid", gap: "0.5rem", margin: "1rem 0" }}>
          {TRAINING_DRILLS.map(drill => (
            <div key={drill.id} className="glass" style={{ padding: "0.75rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{drill.name}</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{drill.description}</div>
                <div style={{ fontSize: "0.65rem", opacity: 0.5 }}>Type: {drill.type} | Target: {drill.targetScore} | Board: {drill.boardSize}×{drill.boardSize}</div>
              </div>
              <button className="btn-sm" onClick={() => onStart(drill.id)}>Start</button>
            </div>
          ))}
        </div>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ─── Ship Graveyard ─── */
export function ShipGraveyard({ onClose }: { onClose: () => void }) {
  const graveyard = loadGraveyard();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "550px" }}>
        <h2>⚓ Ship Graveyard</h2>
        <p style={{ opacity: 0.7, fontSize: "0.85rem" }}>Every ship you've ever sunk, remembered.</p>
        {graveyard.length === 0 && <p style={{ opacity: 0.5 }}>No ships sunk yet. Play some games!</p>}
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {graveyard.slice(0, 50).map((entry, i) => (
            <div key={i} className="glass" style={{ padding: "0.4rem 0.6rem", margin: "0.3rem 0", borderRadius: "6px", fontSize: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600 }}>{entry.customName ?? entry.shipName}</span>
                <span style={{ opacity: 0.5, fontSize: "0.7rem" }}>{entry.gameDate}</span>
              </div>
              <div style={{ opacity: 0.6, fontSize: "0.7rem" }}>
                Sunk by: {entry.sunkBy} | Shots to sink: {entry.shotsToSink}
              </div>
              {entry.lastWords && <div style={{ fontStyle: "italic", opacity: 0.5, fontSize: "0.65rem" }}>"{entry.lastWords}"</div>}
            </div>
          ))}
        </div>
        <button className="btn" onClick={onClose} style={{ marginTop: "1rem" }}>Close</button>
      </div>
    </div>
  );
}

/* ─── Combo Display ─── */
export function ComboDisplay({ streak, multiplier }: { streak: number; multiplier: number }) {
  if (streak < 2) return null;
  return (
    <div style={{
      position: "fixed", top: "10%", right: "2rem", zIndex: 1000,
      padding: "0.5rem 1rem", borderRadius: "12px",
      background: "linear-gradient(135deg, #ff6600, #ff9800)",
      color: "#fff", fontWeight: 900, fontSize: "1.2rem",
      animation: "pulse 0.5s ease-in-out",
      boxShadow: "0 4px 20px rgba(255,102,0,0.5)",
    }} title={`Consecutive hit streak! ${streak} hits in a row = ${multiplier}x XP multiplier. Resets on a miss.`}>
      🔥 {streak}x COMBO ({multiplier}x XP)
    </div>
  );
}

/* ─── Bounty Display ─── */
export function BountyDisplay({ bounties }: { bounties: { id: string; description: string; reward: number; completed: boolean }[] }) {
  const active = bounties.filter(b => !b.completed);
  if (active.length === 0) return null;

  return (
    <div className="glass" style={{ padding: "0.5rem 0.75rem", borderRadius: "8px", fontSize: "0.8rem" }}>
      <div style={{ fontWeight: 600, marginBottom: "0.3rem" }}>💰 Active Bounties</div>
      {active.map(b => (
        <div key={b.id} style={{ display: "flex", justifyContent: "space-between", opacity: 0.8, padding: "0.15rem 0" }}>
          <span>{b.description}</span>
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>+{b.reward} XP</span>
        </div>
      ))}
    </div>
  );
}
