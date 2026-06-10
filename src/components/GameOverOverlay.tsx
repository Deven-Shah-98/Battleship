import { useState } from "react";

interface GameOverOverlayProps {
  won: boolean;
  label: string;
  shots: number;
  hits: number;
  accuracy: number;
  duration?: number;
  xpEarned?: number;
  newLevel?: number;
  onPlayAgain: () => void;
  onShowAnalysis?: () => void;
  onShowLossAnalysis?: () => void;
  onShare?: () => void;
  onViewReplay?: () => void;
}

export default function GameOverOverlay({
  won,
  label,
  shots,
  hits,
  accuracy,
  duration,
  xpEarned,
  newLevel,
  onPlayAgain,
  onShowAnalysis,
  onShowLossAnalysis,
  onShare,
  onViewReplay,
}: GameOverOverlayProps) {
  const [shared, setShared] = useState(false);

  const rating = accuracy >= 70 ? "S" : accuracy >= 55 ? "A" : accuracy >= 40 ? "B" : accuracy >= 25 ? "C" : "D";
  const ratingColor = { S: "#FFD700", A: "#69F0AE", B: "#00BCD4", C: "#FF9800", D: "#FF5252" }[rating];

  const handleShare = () => {
    onShare?.();
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <div className="gameover-overlay" role="alertdialog" aria-label="Game over">
      <div className="gameover-card">
        <div className={`gameover-icon ${won ? "gameover-icon--win" : "gameover-icon--loss"}`}>
          {won ? "V" : "X"}
        </div>
        <h2 className={`gameover-title ${won ? "gameover-title--win" : "gameover-title--loss"}`}>
          {label}
        </h2>

        <div className="gameover-rating" style={{ color: ratingColor }}>
          <span className="gameover-rating__grade">{rating}</span>
          <span className="gameover-rating__label">Rating</span>
        </div>

        <div className="gameover-stats">
          <div className="gameover-stat">
            <span className="gameover-stat__value">{shots}</span>
            <span className="gameover-stat__label">Shots</span>
          </div>
          <div className="gameover-stat">
            <span className="gameover-stat__value">{hits}</span>
            <span className="gameover-stat__label">Hits</span>
          </div>
          <div className="gameover-stat">
            <span className="gameover-stat__value">{accuracy}%</span>
            <span className="gameover-stat__label">Accuracy</span>
          </div>
          {duration !== undefined && (
            <div className="gameover-stat">
              <span className="gameover-stat__value">{formatDuration(duration)}</span>
              <span className="gameover-stat__label">Time</span>
            </div>
          )}
        </div>

        {(xpEarned !== undefined && xpEarned > 0) && (
          <div className="gameover-xp">
            <span className="gameover-xp__value">+{xpEarned} XP</span>
            {newLevel && <span className="gameover-xp__level">Level {newLevel}!</span>}
          </div>
        )}

        <div className="gameover-actions">
          <button
            type="button"
            className="btn-primary gameover-btn"
            onClick={onPlayAgain}
            autoFocus
          >
            Play Again
          </button>
          {onShowAnalysis && (
            <button type="button" className="gameover-btn gameover-btn--secondary" onClick={onShowAnalysis}>
              Analysis
            </button>
          )}
          {onShare && (
            <button type="button" className="gameover-btn gameover-btn--secondary" onClick={handleShare}>
              {shared ? "Copied!" : "Share"}
            </button>
          )}
          {onViewReplay && (
            <button type="button" className="gameover-btn gameover-btn--secondary" onClick={onViewReplay}>
              Replay
            </button>
          )}
          {onShowLossAnalysis && (
            <button type="button" className="gameover-btn gameover-btn--secondary" onClick={onShowLossAnalysis}>
              Loss Analysis
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
