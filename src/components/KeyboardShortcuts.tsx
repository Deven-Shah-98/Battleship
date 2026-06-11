import { KEYBOARD_SHORTCUTS } from "../game/constants";

interface KeyboardShortcutsProps {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcuts({ open, onClose }: KeyboardShortcutsProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal shortcuts-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Keyboard Shortcuts">
        <div className="modal__header">
          <h2>Keyboard Shortcuts</h2>
          <button type="button" className="modal__close" onClick={onClose}>&times;</button>
        </div>
        <div className="shortcuts-list">
          {KEYBOARD_SHORTCUTS.map((s) => (
            <div key={s.key} className="shortcut-row">
              <kbd className="shortcut-key">{s.key}</kbd>
              <span className="shortcut-desc">{s.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
