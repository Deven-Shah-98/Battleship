import { useState, useRef, useEffect } from "react";

interface InfoTipProps {
  text: string;
  direction?: "top" | "bottom" | "left" | "right";
  inline?: boolean;
}

export function InfoTip({ text, direction = "top", inline = false }: InfoTipProps) {
  const [visible, setVisible] = useState(false);
  const tipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setVisible(false), 150);
  };

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  return (
    <span
      className={`infotip-wrapper${inline ? " infotip-wrapper--inline" : ""}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onClick={(e) => { e.stopPropagation(); setVisible((v) => !v); }}
    >
      <span className="infotip-icon" aria-label="More info" role="button" tabIndex={0}>ⓘ</span>
      {visible && (
        <div ref={tipRef} className={`infotip-bubble infotip-bubble--${direction}`} role="tooltip">
          {text}
        </div>
      )}
    </span>
  );
}

interface SettingHelpProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

export function SettingWithHelp({ label, description, children }: SettingHelpProps) {
  return (
    <div className="setting-help-row">
      <div className="setting-help-row__header">
        <span className="setting-help-row__label">{label}</span>
        <InfoTip text={description} direction="right" inline />
      </div>
      <div className="setting-help-row__content">
        {children}
      </div>
    </div>
  );
}
