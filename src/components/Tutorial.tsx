import { useState } from "react";

interface TutorialProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS = [
  {
    title: "Welcome, Commander!",
    content: "Welcome to the ultimate Battleship experience! This guide will walk you through everything you need to know. You can access this tutorial anytime from the footer.",
    icon: "⚓",
  },
  {
    title: "Place Your Fleet",
    content: "During setup, place ships on your grid. Click a cell to place, press R to rotate, or drag from the dock. Click 'Random' for auto-placement, 'Undo' (U) to go back, or 'Reset' to start over.",
    icon: "📍",
  },
  {
    title: "Fire at the Enemy",
    content: "Once the game starts, click cells on the enemy grid to fire. Red = hit (ship found!), grey dot = miss (empty water). Sink all enemy ships to win!",
    icon: "🎯",
  },
  {
    title: "Board Size & Mode",
    content: "Choose your board size (6×6 quick to 15×15 epic) and game mode. Classic = 1 shot/turn. Salvo = 1 shot per surviving ship. Bigger boards have more ships and longer games.",
    icon: "📐",
  },
  {
    title: "AI Difficulty",
    content: "Easy: random shots. Medium: hunts & targets hits. Hard: probability solver. Admiral: enhanced heatmap. The AI also has personality styles (Aggressive, Cautious, Chaotic, Methodical) that change its behavior.",
    icon: "🤖",
  },
  {
    title: "Power-ups",
    content: "Enable power-ups for tactical abilities: Radar (reveal 3×3 area), Sonar (count ships in zone), Airstrike (bomb entire row/column). Each has limited charges — use wisely!",
    icon: "⚡",
  },
  {
    title: "Weather & Timer",
    content: "Enable Weather for random events: Storm disables power-ups, Fog limits vision, Calm grants bonus shots. Add a Timer (10s/30s/60s) for pressure — a random shot fires if time expires.",
    icon: "🌊",
  },
  {
    title: "Settings Panel",
    content: "Click 'Settings' in the header for advanced options: Islands, Reefs, Shrinking Board, Ship Shields, Moving Ships, Scout Plane, Night Mode, and more. Each has a description explaining what it does.",
    icon: "⚙️",
  },
  {
    title: "Progression & XP",
    content: "Every game earns XP based on difficulty, accuracy, speed, and combos. Level up from Recruit to Grand Admiral! Unlock 50+ achievements, advance through mastery tiers, and complete battle pass missions.",
    icon: "📈",
  },
  {
    title: "In-Game Indicators",
    content: "During gameplay, watch the bottom bar: Win Probability shows your chances (green/orange/red), Morale tracks your momentum (rises on hits, drops on misses), and the Combo counter appears on consecutive hits.",
    icon: "📊",
  },
  {
    title: "Campaign & Puzzles",
    content: "Campaign: 10 story missions with unique objectives. Puzzles: find the fleet in fewest shots. Training: practice specific skills. Access all from the header buttons.",
    icon: "🗺️",
  },
  {
    title: "Replays & Stats",
    content: "Every game is recorded — watch replays move-by-move! Check your Profile for lifetime stats, Match History for recent games, and the Improvement Tracker for trend graphs.",
    icon: "📹",
  },
  {
    title: "The Header Bar",
    content: "Every button in the header opens a feature panel. Hover over any button to see a description of what it does. Click 'Help' for a searchable guide to everything in the game.",
    icon: "🧭",
  },
  {
    title: "Keyboard Shortcuts",
    content: "Press ? anytime to see all shortcuts. Key ones: R = rotate ship, U = undo, H = hint (suggests best shot), M = mute, Esc = close modals. The game is fully playable with keyboard only!",
    icon: "⌨️",
  },
  {
    title: "Tips for Success",
    content: "Use the Hint system (H) when stuck. Try Smart Assist in Settings to highlight guaranteed misses. Check post-game analysis to learn from mistakes. Save your favorite settings as Loadouts!",
    icon: "💡",
  },
  {
    title: "Ready to Play!",
    content: "You're all set, Commander! Configure your game settings, place your fleet, and begin. Remember: you can click 'Help' in the header anytime for a complete feature reference. Good luck!",
    icon: "🚀",
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
