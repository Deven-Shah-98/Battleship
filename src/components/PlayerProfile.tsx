import { loadXP, getTitle } from "../game/xp";
import { getUnlockedCount, ACHIEVEMENTS } from "../game/achievements";
import { loadHistory } from "../utils/matchHistory";
import { getDailyStreak } from "../game/dailyChallenge";

interface PlayerProfileProps {
  open: boolean;
  onClose: () => void;
}

export default function PlayerProfile({ open, onClose }: PlayerProfileProps) {
  if (!open) return null;

  const xp = loadXP();
  const title = getTitle(xp.level);
  const history = loadHistory();
  const unlocked = getUnlockedCount();
  const total = ACHIEVEMENTS.length;
  const dailyStreak = getDailyStreak();

  const totalGames = history.length;
  const wins = history.filter((r) => r.won).length;
  const losses = totalGames - wins;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const avgAccuracy = totalGames > 0 ? Math.round(history.reduce((s, r) => s + r.accuracy, 0) / totalGames) : 0;
  const totalShots = history.reduce((s, r) => s + r.shots, 0);
  const totalHits = history.reduce((s, r) => s + r.hits, 0);
  const totalTime = history.reduce((s, r) => s + r.duration, 0);
  const avgGameTime = totalGames > 0 ? Math.round(totalTime / totalGames) : 0;

  // Best streak
  let bestStreak = 0;
  let currentStreak = 0;
  for (const r of history) {
    if (r.won) { currentStreak++; bestStreak = Math.max(bestStreak, currentStreak); }
    else currentStreak = 0;
  }

  // Most played difficulty
  const diffCounts: Record<string, number> = {};
  for (const r of history) {
    diffCounts[r.difficulty] = (diffCounts[r.difficulty] ?? 0) + 1;
  }
  const favDiff = Object.entries(diffCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  const xpPercent = xp.nextLevelXP > 0 ? Math.round((xp.currentLevelXP / xp.nextLevelXP) * 100) : 0;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal profile-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Player Profile">
        <div className="modal__header">
          <h2>Player Profile</h2>
          <button type="button" className="modal__close" onClick={onClose}>&times;</button>
        </div>

        <div className="profile-hero">
          <div className="profile-level">
            <span className="profile-level__number">{xp.level}</span>
            <span className="profile-level__title">{title}</span>
          </div>
          <div className="profile-xp">
            <div className="profile-xp__bar">
              <div className="profile-xp__fill" style={{ width: `${xpPercent}%` }} />
            </div>
            <span className="profile-xp__text">{xp.currentLevelXP} / {xp.nextLevelXP} XP</span>
            <span className="profile-xp__total">Total: {xp.totalXP} XP</span>
          </div>
        </div>

        <div className="profile-stats-grid">
          <StatCard label="Games Played" value={totalGames} />
          <StatCard label="Wins" value={wins} />
          <StatCard label="Losses" value={losses} />
          <StatCard label="Win Rate" value={`${winRate}%`} />
          <StatCard label="Avg Accuracy" value={`${avgAccuracy}%`} />
          <StatCard label="Total Shots" value={totalShots} />
          <StatCard label="Total Hits" value={totalHits} />
          <StatCard label="Best Streak" value={bestStreak} />
          <StatCard label="Daily Streak" value={dailyStreak} />
          <StatCard label="Avg Game Time" value={formatTime(avgGameTime)} />
          <StatCard label="Fav Difficulty" value={favDiff} />
          <StatCard label="Achievements" value={`${unlocked}/${total}`} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="profile-stat-card">
      <span className="profile-stat-card__value">{value}</span>
      <span className="profile-stat-card__label">{label}</span>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
