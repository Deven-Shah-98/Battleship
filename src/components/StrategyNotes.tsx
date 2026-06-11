import { useState, useEffect } from "react";

const STORAGE_KEY = "battleship.strategyNotes";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function StrategyNotes({ open, onClose }: Props) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setNotes(saved);
    } catch { /* ignore */ }
  }, []);

  const handleChange = (value: string) => {
    setNotes(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch { /* ignore */ }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal strategy-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Strategy Notes">
        <div className="modal__header">
          <h2>Strategy Notes</h2>
          <button type="button" className="modal__close" onClick={onClose}>&times;</button>
        </div>
        <p className="strategy-hint">Jot down observations during the game. Notes persist across sessions.</p>
        <textarea
          className="strategy-textarea"
          value={notes}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="e.g. AI tends to cluster ships in the center...&#10;Row 5 seems clear after radar scan...&#10;Try targeting corners next game..."
          rows={10}
        />
        <div className="strategy-actions">
          <button type="button" className="btn-secondary" onClick={() => handleChange("")}>Clear</button>
          <button type="button" className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
