import { loadMilestones, MILESTONES } from "../game/milestones";

interface Props {
  onClose: () => void;
}

export function MilestonePanel({ onClose }: Props) {
  const tracker = loadMilestones();
  const completed = MILESTONES.filter((m) => m.check(tracker));
  const incomplete = MILESTONES.filter((m) => !m.check(tracker));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal milestone-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>&times;</button>
        <h2>Milestones</h2>

        <div className="milestone-stats">
          <div className="milestone-stat">
            <span className="milestone-stat__value">{tracker.totalShots.toLocaleString()}</span>
            <span className="milestone-stat__label">Shots</span>
          </div>
          <div className="milestone-stat">
            <span className="milestone-stat__value">{tracker.totalHits.toLocaleString()}</span>
            <span className="milestone-stat__label">Hits</span>
          </div>
          <div className="milestone-stat">
            <span className="milestone-stat__value">{tracker.totalSinks.toLocaleString()}</span>
            <span className="milestone-stat__label">Sinks</span>
          </div>
          <div className="milestone-stat">
            <span className="milestone-stat__value">{tracker.totalGames}</span>
            <span className="milestone-stat__label">Games</span>
          </div>
          <div className="milestone-stat">
            <span className="milestone-stat__value">{tracker.totalWins}</span>
            <span className="milestone-stat__label">Wins</span>
          </div>
          <div className="milestone-stat">
            <span className="milestone-stat__value">{tracker.longestWinStreak}</span>
            <span className="milestone-stat__label">Best Streak</span>
          </div>
          <div className="milestone-stat">
            <span className="milestone-stat__value">{tracker.bestAccuracy}%</span>
            <span className="milestone-stat__label">Best Acc.</span>
          </div>
          <div className="milestone-stat">
            <span className="milestone-stat__value">
              {tracker.fastestWin > 0 ? `${Math.round(tracker.fastestWin)}s` : "—"}
            </span>
            <span className="milestone-stat__label">Fastest Win</span>
          </div>
        </div>

        <h3>Completed ({completed.length}/{MILESTONES.length})</h3>
        <div className="milestone-grid">
          {completed.map((m) => (
            <div key={m.id} className="milestone-badge milestone-badge--done">
              <span className="milestone-badge__icon">{m.icon}</span>
              <span className="milestone-badge__name">{m.name}</span>
              <span className="milestone-badge__desc">{m.description}</span>
            </div>
          ))}
        </div>

        {incomplete.length > 0 && (
          <>
            <h3>In Progress ({incomplete.length})</h3>
            <div className="milestone-grid">
              {incomplete.map((m) => (
                <div key={m.id} className="milestone-badge milestone-badge--locked">
                  <span className="milestone-badge__icon">{m.icon}</span>
                  <span className="milestone-badge__name">{m.name}</span>
                  <span className="milestone-badge__desc">{m.description}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
