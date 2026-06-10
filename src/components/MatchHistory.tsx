import { loadHistory, saveHistory } from "../utils/matchHistory";
import type { MatchRecord } from "../game/types";

function computeStats(records: MatchRecord[]) {
  if (records.length === 0) {
    return { winRate: 0, avgAccuracy: 0, bestStreak: 0, totalGames: 0 };
  }
  const wins = records.filter((r) => r.won).length;
  const totalAccuracy = records.reduce((sum, r) => sum + r.accuracy, 0);
  let bestStreak = 0;
  let currentStreak = 0;
  for (const r of records) {
    if (r.won) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  return {
    winRate: Math.round((wins / records.length) * 100),
    avgAccuracy: Math.round(totalAccuracy / records.length),
    bestStreak,
    totalGames: records.length,
  };
}

function AccuracyChart({ records }: { records: MatchRecord[] }) {
  if (records.length < 2) return null;
  const recent = records.slice(0, 20).reverse();
  const maxAcc = 100;
  const w = 280;
  const h = 80;
  const pad = 4;
  const step = (w - pad * 2) / (recent.length - 1);

  const points = recent
    .map(
      (r, i) =>
        `${pad + i * step},${h - pad - (r.accuracy / maxAcc) * (h - pad * 2)}`,
    )
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="accuracy-chart"
      role="img"
      aria-label="Accuracy trend over recent games"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {recent.map((r, i) => (
        <circle
          key={i}
          cx={pad + i * step}
          cy={h - pad - (r.accuracy / maxAcc) * (h - pad * 2)}
          r="3"
          fill={r.won ? "var(--ok)" : "var(--hit)"}
        >
          <title>
            {r.accuracy}% — {r.won ? "Win" : "Loss"}
          </title>
        </circle>
      ))}
    </svg>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface MatchHistoryProps {
  open: boolean;
  onClose: () => void;
}

export default function MatchHistoryPanel({
  open,
  onClose,
}: MatchHistoryProps) {
  if (!open) return null;
  const records = loadHistory();
  const stats = computeStats(records);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal history-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Match History"
      >
        <div className="modal__header">
          <h2>Match History</h2>
          <button type="button" className="modal__close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="history__stats">
          <div className="stat-card">
            <span className="stat-card__value">{stats.totalGames}</span>
            <span className="stat-card__label">Games</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.winRate}%</span>
            <span className="stat-card__label">Win rate</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.avgAccuracy}%</span>
            <span className="stat-card__label">Avg accuracy</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">{stats.bestStreak}</span>
            <span className="stat-card__label">Best streak</span>
          </div>
        </div>

        <AccuracyChart records={records} />

        {records.length === 0 ? (
          <p className="history__empty">No games played yet.</p>
        ) : (
          <div className="history__table-wrap">
            <table className="history__table">
              <thead>
                <tr>
                  <th>Result</th>
                  <th>Mode</th>
                  <th>Difficulty</th>
                  <th>Shots</th>
                  <th>Accuracy</th>
                  <th>Time</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className={r.won ? "row--win" : "row--loss"}>
                    <td>{r.won ? "W" : "L"}</td>
                    <td>{r.mode}</td>
                    <td>{r.difficulty}</td>
                    <td>{r.shots}</td>
                    <td>{r.accuracy}%</td>
                    <td>{formatDuration(r.duration)}</td>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="history__actions">
          <button
            type="button"
            onClick={() => {
              saveHistory([]);
              onClose();
            }}
            disabled={records.length === 0}
          >
            Clear history
          </button>
        </div>
      </div>
    </div>
  );
}
