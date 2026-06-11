import { CAMPAIGN_MISSIONS, loadCampaignProgress, isMissionUnlocked } from "../game/campaign";
import type { CampaignMission } from "../game/types";

interface CampaignPanelProps {
  open: boolean;
  onClose: () => void;
  onStartMission: (mission: CampaignMission) => void;
}

export default function CampaignPanel({ open, onClose, onStartMission }: CampaignPanelProps) {
  if (!open) return null;

  const progress = loadCampaignProgress();
  const completedCount = Object.keys(progress.completedMissions).length;
  const totalMissions = CAMPAIGN_MISSIONS.length;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal campaign-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Campaign">
        <div className="modal__header">
          <h2>Campaign</h2>
          <span className="campaign-progress-text">{completedCount}/{totalMissions} Missions</span>
          <button type="button" className="modal__close" onClick={onClose}>&times;</button>
        </div>

        <p className="campaign-intro">Complete missions to earn XP and unlock achievements. Missions unlock sequentially.</p>

        <div className="campaign-list">
          {CAMPAIGN_MISSIONS.map((mission) => {
            const unlocked = isMissionUnlocked(mission.id);
            const completed = progress.completedMissions[mission.id];
            return (
              <div key={mission.id} className={`campaign-card${!unlocked ? " campaign-card--locked" : ""}${completed ? " campaign-card--completed" : ""}`}>
                <div className="campaign-card__header">
                  <span className="campaign-card__difficulty">
                    {"★".repeat(mission.difficulty)}{"☆".repeat(5 - mission.difficulty)}
                  </span>
                  <span className="campaign-card__name">{mission.name}</span>
                  {completed && (
                    <span className="campaign-card__stars">
                      {"⭐".repeat(completed.stars)}
                    </span>
                  )}
                </div>
                <p className="campaign-card__desc">{mission.description}</p>
                <div className="campaign-card__objectives">
                  {mission.objectives.map((obj, i) => (
                    <span key={i} className="campaign-card__objective">{obj.description}</span>
                  ))}
                </div>
                <div className="campaign-card__footer">
                  <span className="campaign-card__reward">{mission.reward.xp} XP</span>
                  <span className="campaign-card__size">{mission.boardSize}x{mission.boardSize}</span>
                  {mission.weather && mission.weather !== "clear" && (
                    <span className="campaign-card__weather">{mission.weather}</span>
                  )}
                  {unlocked ? (
                    <button type="button" className="btn-primary campaign-card__play" onClick={() => onStartMission(mission)}>
                      {completed ? "Replay" : "Start"}
                    </button>
                  ) : (
                    <span className="campaign-card__locked-text">Locked</span>
                  )}
                </div>
                {completed && (
                  <div className="campaign-card__best">
                    Best: {completed.bestAccuracy}% accuracy, {completed.bestShots} shots
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
