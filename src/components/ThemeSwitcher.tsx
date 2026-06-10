import { THEMES } from "../utils/theme";
import type { ThemeName } from "../game/types";

interface ThemeSwitcherProps {
  current: ThemeName;
  onChange: (theme: ThemeName) => void;
}

export default function ThemeSwitcher({
  current,
  onChange,
}: ThemeSwitcherProps) {
  const names: ThemeName[] = ["cognition", "midnight", "arctic", "ember"];
  return (
    <div className="theme-switcher" role="radiogroup" aria-label="Theme">
      {names.map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={current === t}
          className={`chip theme-chip${current === t ? " chip--active" : ""}`}
          onClick={() => onChange(t)}
          title={THEMES[t].label}
        >
          {THEMES[t].label}
        </button>
      ))}
    </div>
  );
}
