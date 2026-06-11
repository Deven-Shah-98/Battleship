import { ACHIEVEMENTS, loadAchievements, getUnlockedCount } from "../game/achievements";
import type { Achievement, AchievementProgress } from "../game/types";

interface AchievementPanelProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { key: "gameplay", label: "Gameplay" },
  { key: "skill", label: "Skill" },
  { key: "challenge", label: "Challenge" },
  { key: "collection", label: "Collection" },
  { key: "social", label: "Social" },
] as const;

export default function AchievementPanel({ open, onClose }: AchievementPanelProps) {
  if (!open) return null;
  const progress = loadAchievements();
  const unlocked = getUnlockedCount();
  const total = ACHIEVEMENTS.length;
  const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal achievement-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Achievements">
        <div className="modal__header">
          <h2>Achievements</h2>
          <span className="achievement-counter">{unlocked}/{total} ({percentage}%)</span>
          <button type="button" className="modal__close" onClick={onClose}>&times;</button>
        </div>

        <div className="achievement-progress-bar">
          <div className="achievement-progress-fill" style={{ width: `${percentage}%` }} />
        </div>

        {CATEGORIES.map(({ key, label }) => {
          const items = ACHIEVEMENTS.filter((a) => a.category === key);
          if (items.length === 0) return null;
          return (
            <div key={key} className="achievement-category">
              <h3 className="achievement-category__title">{label}</h3>
              <div className="achievement-grid">
                {items.map((a) => (
                  <AchievementCard key={a.id} achievement={a} progress={progress[a.id]} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AchievementCard({ achievement, progress }: { achievement: Achievement; progress?: AchievementProgress }) {
  const isUnlocked = progress?.unlocked ?? false;
  const isSecret = achievement.secret && !isUnlocked;

  return (
    <div className={`achievement-card${isUnlocked ? " achievement-card--unlocked" : ""}${isSecret ? " achievement-card--secret" : ""}`}>
      <span className="achievement-card__icon">{isSecret ? "?" : achievement.icon}</span>
      <div className="achievement-card__info">
        <span className="achievement-card__name">{isSecret ? "???" : achievement.name}</span>
        <span className="achievement-card__desc">{isSecret ? "Hidden achievement" : achievement.description}</span>
        <span className="achievement-card__xp">{achievement.xp} XP</span>
      </div>
      {isUnlocked && progress?.unlockedDate && (
        <span className="achievement-card__date">{new Date(progress.unlockedDate).toLocaleDateString()}</span>
      )}
    </div>
  );
}

/** Toast notification for newly unlocked achievement. */
export function AchievementToast({ achievement, onDismiss }: { achievement: Achievement; onDismiss: () => void }) {
  return (
    <div className="achievement-toast" onClick={onDismiss} role="alert">
      <span className="achievement-toast__icon">{achievement.icon}</span>
      <div className="achievement-toast__info">
        <span className="achievement-toast__label">Achievement Unlocked!</span>
        <span className="achievement-toast__name">{achievement.name}</span>
        <span className="achievement-toast__xp">+{achievement.xp} XP</span>
      </div>
    </div>
  );
}
