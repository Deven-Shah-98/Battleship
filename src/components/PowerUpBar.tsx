import type { PowerUpKind, PowerUpState } from "../game/types";

interface PowerUpBarProps {
  powerUps: PowerUpState;
  activePowerUp: PowerUpKind | null;
  onSelect: (kind: PowerUpKind | null) => void;
  disabled?: boolean;
}

const POWER_UP_INFO: Record<
  PowerUpKind,
  { label: string; icon: string; desc: string }
> = {
  radar: {
    label: "Radar",
    icon: "\uD83D\uDCE1",
    desc: "Reveal ships in a 3\u00D73 area",
  },
  sonar: {
    label: "Sonar",
    icon: "\uD83D\uDD0A",
    desc: "Count ship segments in a 3\u00D73 area",
  },
  airstrike: {
    label: "Airstrike",
    icon: "\uD83D\uDCA3",
    desc: "Bomb up to 5 cells in a row/column",
  },
};

export default function PowerUpBar({
  powerUps,
  activePowerUp,
  onSelect,
  disabled = false,
}: PowerUpBarProps) {
  const kinds: PowerUpKind[] = ["radar", "sonar", "airstrike"];
  return (
    <div className="powerup-bar" role="toolbar" aria-label="Power-ups">
      {kinds.map((kind) => {
        const info = POWER_UP_INFO[kind];
        const uses = powerUps[kind];
        const isActive = activePowerUp === kind;
        return (
          <button
            key={kind}
            type="button"
            className={`powerup-btn${isActive ? " powerup-btn--active" : ""}`}
            disabled={disabled || uses === 0}
            title={`${info.desc} (${uses} left)`}
            aria-pressed={isActive}
            onClick={() => onSelect(isActive ? null : kind)}
          >
            <span className="powerup-btn__icon">{info.icon}</span>
            <span className="powerup-btn__label">{info.label}</span>
            <span className="powerup-btn__count">{uses}</span>
          </button>
        );
      })}
    </div>
  );
}
