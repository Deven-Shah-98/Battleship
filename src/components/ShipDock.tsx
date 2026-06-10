import type { ShipDef } from "../game/types";

interface ShipDockProps {
  shipDefs: ShipDef[];
  placedCount: number;
  currentOrientation: string;
}

export default function ShipDock({
  shipDefs,
  placedCount,
  currentOrientation,
}: ShipDockProps) {
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="ship-dock" aria-label="Ships to place">
      {shipDefs.map((def, i) => {
        const isPlaced = i < placedCount;
        const isCurrent = i === placedCount;
        return (
          <div
            key={def.name}
            className={`dock-ship${isPlaced ? " dock-ship--placed" : ""}${isCurrent ? " dock-ship--current" : ""}`}
            draggable={isCurrent}
            onDragStart={(e) => handleDragStart(e, i)}
            aria-label={`${def.name} (${def.size} cells)${isPlaced ? " — placed" : ""}`}
          >
            <span className="dock-ship__name">{def.name}</span>
            <div
              className={`dock-ship__pips ${currentOrientation === "vertical" ? "dock-ship__pips--vertical" : ""}`}
            >
              {Array.from({ length: def.size }, (_, j) => (
                <span key={j} className="dock-ship__pip" />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
