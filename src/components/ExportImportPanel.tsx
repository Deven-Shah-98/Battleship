import { useRef, useState } from "react";
import { downloadExport, importSaveData } from "../game/exportImport";

interface Props {
  onClose: () => void;
  onImport: () => void;
}

export function ExportImportPanel({ onClose, onImport }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadExport();
    setStatus("Save data downloaded!");
  };

  const handleImport = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target?.result as string;
      const result = importSaveData(json);
      if (result.success) {
        setStatus(`Imported ${result.keysImported} data keys. Refreshing...`);
        setTimeout(() => {
          onImport();
          window.location.reload();
        }, 1500);
      } else {
        setStatus(`Import failed: ${result.error}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal export-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>&times;</button>
        <h2>Export / Import Save Data</h2>

        <p className="export-desc">
          Export all your progress (XP, achievements, stats, replays, settings) as a JSON file.
          Import to restore on another device or after clearing data.
        </p>

        <div className="export-actions">
          <button className="btn btn--accent" onClick={handleExport}>
            📥 Export Save Data
          </button>

          <div className="export-import-section">
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="export-file-input"
            />
            <button className="btn btn--secondary" onClick={() => fileRef.current?.click()}>
              📤 Import Save Data
            </button>
          </div>
        </div>

        {status && <p className="export-status">{status}</p>}
      </div>
    </div>
  );
}
