import { useState } from "react";

interface TutorialProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS = [
  {
    title: "Welcome to Battleship!",
    content: "Command your fleet in a classic naval strategy game. Sink all enemy ships before they sink yours!",
    icon: "🚢",
  },
  {
    title: "Place Your Fleet",
    content: "During setup, place 5 ships on your grid. Click a cell to place, press R to rotate, or drag ships from the dock. Click 'Random' for auto-placement.",
    icon: "📍",
  },
  {
    title: "Fire!",
    content: "Take turns firing at the enemy grid. Click any cell to fire. Red = hit, blue/grey = miss. The battle log shows details of each shot.",
    icon: "🎯",
  },
  {
    title: "Sink Ships",
    content: "Keep hitting a ship until all its cells are destroyed. The fleet panel shows which ships are still afloat and which are sunk.",
    icon: "💥",
  },
  {
    title: "AI Difficulty",
    content: "Choose your opponent: Easy (random), Medium (hunt & target), Hard (probability solver), or Admiral (enhanced heatmap). Progressive AI adapts to your skill!",
    icon: "🤖",
  },
  {
    title: "Power-ups",
    content: "Enable power-ups for special abilities: Radar (reveal 3x3), Sonar (count ships in area), Airstrike (bomb a row/column). Use them wisely!",
    icon: "⚡",
  },
  {
    title: "Game Modes",
    content: "Classic: 1 shot per turn. Salvo: 1 shot per surviving ship. Blitz: 6x6 board, 5-second turns. Campaign: 10 story missions with objectives.",
    icon: "🎮",
  },
  {
    title: "Earn XP & Achievements",
    content: "Every game earns XP. Level up, unlock 50+ achievements, and climb the ranks from Recruit to Grand Admiral!",
    icon: "🏆",
  },
  {
    title: "Pro Tips",
    content: "Use keyboard shortcuts (press ? anytime). Try the hint system (H key) when stuck. Share your results with the share button. Check post-game analysis to improve!",
    icon: "💡",
  },
  {
    title: "Ready to Play!",
    content: "You're all set, Commander. Choose your settings and start your first game. Good luck on the seas!",
    icon: "⚓",
  },
];

export default function Tutorial({ open, onClose, onComplete }: TutorialProps) {
  const [step, setStep] = useState(0);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSkip = () => {
    onComplete();
    onClose();
  };

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal tutorial-modal" role="dialog" aria-label="Tutorial">
        <div className="tutorial-progress">
          {STEPS.map((_, i) => (
            <div key={i} className={`tutorial-dot${i === step ? " tutorial-dot--active" : i < step ? " tutorial-dot--done" : ""}`} />
          ))}
        </div>

        <div className="tutorial-content">
          <span className="tutorial-icon">{current.icon}</span>
          <h2 className="tutorial-title">{current.title}</h2>
          <p className="tutorial-text">{current.content}</p>
        </div>

        <div className="tutorial-actions">
          <button type="button" className="tutorial-skip" onClick={handleSkip}>
            Skip Tutorial
          </button>
          <div className="tutorial-nav">
            {step > 0 && (
              <button type="button" onClick={handlePrev}>Back</button>
            )}
            <button type="button" className="btn-primary" onClick={handleNext}>
              {isLast ? "Start Playing!" : "Next"}
            </button>
          </div>
        </div>

        <span className="tutorial-counter">{step + 1} / {STEPS.length}</span>
      </div>
    </div>
  );
}
