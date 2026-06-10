interface GameOverOverlayProps {
  won: boolean;
  label: string;
  shots: number;
  hits: number;
  accuracy: number;
  onPlayAgain: () => void;
}

export default function GameOverOverlay({
  won,
  label,
  shots,
  hits,
  accuracy,
  onPlayAgain,
}: GameOverOverlayProps) {
  return (
    <div className="gameover-overlay" role="alertdialog" aria-label="Game over">
      <div className="gameover-card">
        <div className={`gameover-icon ${won ? "gameover-icon--win" : "gameover-icon--loss"}`}>
          {won ? "V" : "X"}
        </div>
        <h2 className={`gameover-title ${won ? "gameover-title--win" : "gameover-title--loss"}`}>
          {label}
        </h2>
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
        </div>
        <button
          type="button"
          className="btn-primary gameover-btn"
          onClick={onPlayAgain}
          autoFocus
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
