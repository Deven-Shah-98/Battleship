import { loadPrestige, canPrestige, performPrestige } from "../game/prestige";
import { loadXP } from "../game/xp";

interface Props {
  onPrestige: () => void;
  onClose: () => void;
}

export function PrestigePanel({ onPrestige, onClose }: Props) {
  const xp = loadXP();
  const prestige = loadPrestige();
  const eligible = canPrestige(xp);

  const handlePrestige = () => {
    if (!eligible) return;
    performPrestige(xp);
    onPrestige();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal prestige-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>&times;</button>
        <h2>Prestige System</h2>

        <div className="prestige-stars">
          {Array.from({ length: Math.max(prestige.stars, 1) }, (_, i) => (
            <span key={i} className={i < prestige.stars ? "star--filled" : "star--empty"}>
              {i < prestige.stars ? "⭐" : "☆"}
            </span>
          ))}
        </div>

        <div className="prestige-info">
          <p><strong>Prestige Stars:</strong> {prestige.stars}</p>
          <p><strong>Lifetime XP:</strong> {prestige.totalLifetimeXP.toLocaleString()}</p>
          <p><strong>Bonus XP:</strong> +{prestige.bonusXPPercent}%</p>
          <p><strong>Current Level:</strong> {xp.level}</p>
        </div>

        <div className="prestige-requirements">
          <h3>Prestige Requirements</h3>
          <p>Reach <strong>Level 25</strong> to prestige.</p>
          <p className="prestige-warning">
            Prestiging resets your level to 1 but grants a permanent <strong>+10% XP</strong> bonus
            and a prestige star on your profile.
          </p>
        </div>

        <button
          className={`btn btn--accent prestige-btn ${eligible ? "" : "btn--disabled"}`}
          onClick={handlePrestige}
          disabled={!eligible}
        >
          {eligible ? `⭐ Prestige Now (Level ${xp.level} → 1)` : `Need Level 25 (Currently ${xp.level})`}
        </button>
      </div>
    </div>
  );
}
