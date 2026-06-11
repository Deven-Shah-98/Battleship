import {
  loadPlacementHeatmap, loadH2H, loadImprovementData, loadBenchmarkResults,
  BENCHMARK_SCENARIOS, calculateEfficiencyGrade,
} from "../game/analytics";

/* ─── Improvement Tracker ─── */
export function ImprovementTracker({ onClose }: { onClose: () => void }) {
  const data = loadImprovementData();
  const last7 = data.slice(-7);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <h2>📈 Improvement Tracker</h2>
        {data.length === 0 ? (
          <p style={{ opacity: 0.6 }}>Play more games to see your improvement over time!</p>
        ) : (
          <>
            <div style={{ margin: "1rem 0" }}>
              <h4 style={{ margin: "0 0 0.5rem" }}>Last 7 Days</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "0.5rem" }}>
                {last7.map((d, i) => (
                  <div key={i} className="glass" style={{ padding: "0.4rem", borderRadius: "6px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", opacity: 0.5 }}>{d.date.split("/").slice(0, 2).join("/")}</div>
                    <div style={{ fontSize: "1rem", fontWeight: 700 }}>{d.accuracy}%</div>
                    <div style={{ fontSize: "0.65rem", opacity: 0.7 }}>{d.gamesPlayed} games</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
              <div className="glass" style={{ padding: "0.5rem", borderRadius: "6px", textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", opacity: 0.5 }}>Avg Accuracy</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                  {data.length > 0 ? Math.round(data.reduce((a, d) => a + d.accuracy, 0) / data.length) : 0}%
                </div>
              </div>
              <div className="glass" style={{ padding: "0.5rem", borderRadius: "6px", textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", opacity: 0.5 }}>Avg Shots</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                  {data.length > 0 ? Math.round(data.reduce((a, d) => a + d.avgShots, 0) / data.length) : 0}
                </div>
              </div>
              <div className="glass" style={{ padding: "0.5rem", borderRadius: "6px", textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", opacity: 0.5 }}>Win Rate</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                  {data.length > 0 ? Math.round(data.reduce((a, d) => a + d.winRate, 0) / data.length) : 0}%
                </div>
              </div>
            </div>
          </>
        )}
        <button className="btn" onClick={onClose} style={{ marginTop: "1rem" }}>Close</button>
      </div>
    </div>
  );
}

/* ─── Head-to-Head Records ─── */
export function H2HPanel({ onClose }: { onClose: () => void }) {
  const records = loadH2H();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <h2>⚔️ Head-to-Head Records</h2>
        {records.length === 0 ? (
          <p style={{ opacity: 0.6 }}>Play against different AI personalities to build your records!</p>
        ) : (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {records.map((r, i) => (
              <div key={i} className="glass" style={{ padding: "0.5rem", margin: "0.4rem 0", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{r.personality} ({r.difficulty})</span>
                  <span style={{ color: r.wins > r.losses ? "#4caf50" : "#f44336" }}>
                    {r.wins}W - {r.losses}L
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                  {r.gamesPlayed} games | Avg: {r.avgShots} shots, {r.avgAccuracy}% accuracy
                </div>
              </div>
            ))}
          </div>
        )}
        <button className="btn" onClick={onClose} style={{ marginTop: "1rem" }}>Close</button>
      </div>
    </div>
  );
}

/* ─── Placement Heatmap ─── */
export function PlacementHeatmapPanel({ onClose }: { onClose: () => void }) {
  const heatmap = loadPlacementHeatmap();

  const maxCount = Math.max(1, ...Object.values(heatmap.cells));
  const size = heatmap.boardSize;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
        <h2>🗺️ Your Placement Patterns</h2>
        <p style={{ opacity: 0.7, fontSize: "0.8rem" }}>Brighter = you place ships here more often ({heatmap.totalGames} games analyzed)</p>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${size}, 1fr)`, gap: "1px", margin: "1rem auto", maxWidth: "300px" }}>
          {Array.from({ length: size * size }, (_, i) => {
            const row = Math.floor(i / size);
            const col = i % size;
            const count = heatmap.cells[`${row},${col}`] ?? 0;
            const intensity = count / maxCount;
            return (
              <div
                key={i}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  backgroundColor: `rgba(229, 57, 53, ${intensity * 0.8})`,
                  border: "1px solid var(--glass-border)",
                  borderRadius: "2px",
                }}
                title={`(${row},${col}): ${count} uses`}
              />
            );
          })}
        </div>
        <button className="btn" onClick={onClose} style={{ marginTop: "1rem" }}>Close</button>
      </div>
    </div>
  );
}

/* ─── Efficiency Grade Display ─── */
export function EfficiencyGradeDisplay({ shots, totalSegments, boardSize }: { shots: number; totalSegments: number; boardSize: number }) {
  const { grade, score } = calculateEfficiencyGrade(shots, totalSegments, boardSize);
  const gradeColors: Record<string, string> = {
    S: "#ff6600", "A+": "#ffd700", A: "#4caf50", B: "#2196f3", C: "#9e9e9e", D: "#795548", F: "#f44336",
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
      <span style={{ fontSize: "1.5rem", fontWeight: 900, color: gradeColors[grade] ?? "#fff" }}>{grade}</span>
      <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>({score}/100)</span>
    </div>
  );
}

/* ─── Benchmark Panel ─── */
export function BenchmarkPanel({ onClose, onStart }: { onClose: () => void; onStart: (scenarioId: string) => void }) {
  const results = loadBenchmarkResults();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <h2>🏆 Benchmark Mode</h2>
        <p style={{ opacity: 0.7, fontSize: "0.8rem" }}>Compare your performance against standardized scenarios.</p>
        <div style={{ display: "grid", gap: "0.5rem", margin: "1rem 0" }}>
          {BENCHMARK_SCENARIOS.map(scenario => {
            const best = results.find(r => r.scenarioId === scenario.id);
            return (
              <div key={scenario.id} className="glass" style={{ padding: "0.75rem", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{scenario.name}</div>
                    <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{scenario.description}</div>
                    <div style={{ fontSize: "0.7rem", opacity: 0.5 }}>Par: {scenario.parScore} shots | Board: {scenario.boardSize}×{scenario.boardSize}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {best ? (
                      <div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--accent)" }}>{best.shots} shots</div>
                        <div style={{ fontSize: "0.65rem", opacity: 0.5 }}>Top {best.percentile}%</div>
                      </div>
                    ) : (
                      <button className="btn-sm" onClick={() => onStart(scenario.id)}>Play</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button className="btn" onClick={onClose} style={{ marginTop: "1rem" }}>Close</button>
      </div>
    </div>
  );
}

/* ─── Strategy Fingerprint ─── */
export function StrategyFingerprint({ style, confidence, description }: { style: string; confidence: number; description: string }) {
  return (
    <div className="glass" style={{ padding: "0.5rem 0.75rem", borderRadius: "8px", fontSize: "0.8rem" }}>
      <div style={{ fontWeight: 600 }}>🧬 Strategy Fingerprint</div>
      <div style={{ textTransform: "capitalize", color: "var(--accent)" }}>{style.replace(/_/g, " ")}</div>
      <div style={{ opacity: 0.7, fontSize: "0.75rem" }}>{description}</div>
      <div style={{ opacity: 0.5, fontSize: "0.65rem" }}>Confidence: {Math.round(confidence * 100)}%</div>
    </div>
  );
}
