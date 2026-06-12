/* ─── Combo Display ─── */
export function ComboDisplay({ streak, multiplier }: { streak: number; multiplier: number }) {
  if (streak < 2) return null;
  return (
    <div style={{
      position: "fixed", top: "10%", right: "2rem", zIndex: 1000,
      padding: "0.5rem 1rem", borderRadius: "12px",
      background: "linear-gradient(135deg, #ff6600, #ff9800)",
      color: "#fff", fontWeight: 900, fontSize: "1.2rem",
      animation: "pulse 0.5s ease-in-out",
      boxShadow: "0 4px 20px rgba(255,102,0,0.5)",
    }} title={`Consecutive hit streak! ${streak} hits in a row = ${multiplier}x XP multiplier. Resets on a miss.`}>
      🔥 {streak}x COMBO ({multiplier}x XP)
    </div>
  );
}
