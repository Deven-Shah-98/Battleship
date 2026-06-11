import { useState } from "react";

interface HelpGuideProps {
  open: boolean;
  onClose: () => void;
}

type HelpCategory = "basics" | "modes" | "ai" | "powerups" | "settings" | "progression" | "social" | "advanced";

const CATEGORIES: { id: HelpCategory; label: string; icon: string }[] = [
  { id: "basics", label: "Getting Started", icon: "🚀" },
  { id: "modes", label: "Game Modes", icon: "🎮" },
  { id: "ai", label: "AI & Difficulty", icon: "🤖" },
  { id: "powerups", label: "Power-ups & Abilities", icon: "⚡" },
  { id: "settings", label: "Board & Settings", icon: "⚙️" },
  { id: "progression", label: "Progression & XP", icon: "📈" },
  { id: "social", label: "Social & Stats", icon: "🏆" },
  { id: "advanced", label: "Advanced Features", icon: "🔬" },
];

const HELP_CONTENT: Record<HelpCategory, { title: string; items: { q: string; a: string }[] }> = {
  basics: {
    title: "Getting Started",
    items: [
      { q: "How do I play?", a: "Place your ships on your grid during setup, then take turns firing at the enemy grid. Hit all cells of a ship to sink it. Sink all enemy ships to win!" },
      { q: "How do I place ships?", a: "Click cells on your grid to place ships. Press R to rotate between horizontal/vertical. You can also drag ships from the dock, or click 'Random' for auto-placement." },
      { q: "What do the colors mean?", a: "Red/orange cells = hit (a ship was there). Blue/grey cells with a dot = miss (empty water). Ships on your board show as colored blocks." },
      { q: "What is the Battle Log?", a: "The scrollable panel at the bottom shows a history of every shot fired, who hit/missed, and when ships were sunk." },
      { q: "How do I undo a ship placement?", a: "Press U or click 'Undo' to remove the last placed ship. Click 'Reset' to clear all placements." },
      { q: "What is a Game Seed?", a: "A seed is a code (like 'AB34') that generates the same random board layout. Share seeds with friends to play the exact same game!" },
    ],
  },
  modes: {
    title: "Game Modes",
    items: [
      { q: "What is Classic mode?", a: "One shot per turn. Simple, traditional Battleship rules." },
      { q: "What is Salvo mode?", a: "You fire one shot per surviving ship each turn. Start with 5 shots, lose one each time a ship sinks. More strategic and faster-paced!" },
      { q: "What is 2-Player (Hotseat)?", a: "Two players share one device, passing back and forth. A 'Pass Device' screen appears between turns so the next player can't see the other's board." },
      { q: "What is Campaign mode?", a: "10 story missions with unique objectives, varying board sizes, and special conditions. Complete missions to earn bonus XP and achievements." },
      { q: "What are Experimental Modes?", a: "Click 'Modes' in the header to access unique variants: Fog Exploration, Minehunter, Reverse Battleship, Battleship Poker, Speed Chess, Ironman, Roguelike, Mirror Match, and Chaos mode." },
      { q: "What are Puzzles?", a: "Pre-set boards where you must find the fleet in the fewest shots possible — like chess puzzles but for Battleship!" },
      { q: "What is Training?", a: "Isolated drills to practice specific skills: targeting, pattern recognition, and speed accuracy." },
    ],
  },
  ai: {
    title: "AI & Difficulty",
    items: [
      { q: "What does Easy AI do?", a: "Fires completely at random. Great for learning the game or casual play." },
      { q: "What does Medium AI do?", a: "Uses a 'hunt and target' strategy — fires in a checkerboard pattern, then chases adjacent cells after a hit." },
      { q: "What does Hard AI do?", a: "Uses probability-density calculations to determine the most likely ship locations. Very challenging!" },
      { q: "What does Admiral AI do?", a: "Enhanced heatmap with miss analysis and pattern recognition — the toughest opponent." },
      { q: "What are AI Personalities?", a: "Balanced: standard play. Aggressive: immediately chases hits. Cautious: spreads shots wide. Chaotic: unpredictable with occasional brilliance. Methodical: systematic row-by-row." },
      { q: "What is Progressive AI?", a: "The AI adapts to your win rate. Win too often and it gets harder; lose often and it eases up — keeping games competitive." },
      { q: "What is AI Speed?", a: "Controls how fast the AI takes its turn. Instant: no delay. Fast: 300ms. Normal: 700ms. Slow: 1.5s. Dramatic: 2.5s with emphasis on events." },
    ],
  },
  powerups: {
    title: "Power-ups & Abilities",
    items: [
      { q: "How do Power-ups work?", a: "Enable power-ups in setup. You get limited charges of each. Click the power-up bar to select one, then click a cell to use it." },
      { q: "What does Radar do?", a: "Reveals a 3×3 area around the target cell, showing which cells contain ships (without damaging them). Use to plan your attacks!" },
      { q: "What does Sonar do?", a: "Shows the exact number of ship cells in a 5×5 area around the target. Doesn't reveal positions — just the count." },
      { q: "What does Airstrike do?", a: "Bombs an entire row or column (you choose). Hits everything in its path — devastating but you only get 1 use!" },
      { q: "What are Ship Shields?", a: "When enabled in Settings, each ship absorbs its first hit for free. The shot registers as a miss, but the shield is consumed." },
      { q: "What is the Hint system?", a: "Press H during gameplay to highlight the highest-probability cell. Uses the same AI logic as the Hard difficulty to suggest your best shot." },
    ],
  },
  settings: {
    title: "Board & Settings",
    items: [
      { q: "What board sizes are available?", a: "6×6 (Quick — 3 ships), 8×8 (Compact — 4 ships), 10×10 (Classic — 5 ships), 12×12 (Extended — 6 ships), 15×15 (Epic — 8 ships)." },
      { q: "What are Islands?", a: "Random impassable cells placed on the board. Ships can't be placed on them and shots fired there always miss. Adds tactical complexity!" },
      { q: "What are Hidden Reefs?", a: "Invisible cells that always result in a miss. They're only revealed when you actually fire at them — frustrating but realistic!" },
      { q: "What is Shrinking Board?", a: "Every 10 turns, the outermost ring of the board becomes blocked. Forces action to the center — like a battle royale!" },
      { q: "What is Weather?", a: "Random weather events: Storm (power-ups disabled, shots scatter), Fog (reduced visibility), Calm (bonus accuracy). Changes every few turns." },
      { q: "What is a Timer?", a: "Set a countdown per turn (10s/30s/60s). If time expires, a random cell is auto-fired. Adds pressure and speeds up games!" },
      { q: "What is Fog of War Decay?", a: "Your hit/miss markers fade after 8 turns unless the area is re-scouted. Forces you to remember or re-explore!" },
      { q: "What is Chain Reaction?", a: "When a ship sinks, it damages all cells adjacent to it. Can trigger chain sinks if another ship is nearby!" },
      { q: "What is Night Mode?", a: "You can only see a 3-cell radius around your last shot. Everything else is dark — tests your memory!" },
      { q: "What is the Scout Plane?", a: "Every 3 turns, automatically reveals whether a random row or column contains ships." },
      { q: "What are Moving Ships?", a: "After each turn, you can move one un-hit ship one cell in any direction. Adds a whole new strategic layer!" },
    ],
  },
  progression: {
    title: "Progression & XP",
    items: [
      { q: "How does XP work?", a: "Earn XP from every game based on difficulty, accuracy, speed, and combos. Level up from Recruit (Lv.1) to Grand Admiral (Lv.50+)." },
      { q: "What are Achievements?", a: "50+ unlockable achievements for milestones like 'First Blood' (first hit), 'Perfect Game' (100% accuracy), and 'Speed Demon' (win in under 20 shots)." },
      { q: "What is Prestige?", a: "After reaching high levels, reset your level for a prestige star and exclusive cosmetic rewards. Your achievements and stats are kept!" },
      { q: "What is the Battle Pass?", a: "Weekly missions (like 'Win 3 games on Hard' or 'Sink 10 ships') that award bonus XP. Resets each week." },
      { q: "What is Mastery?", a: "Per-difficulty skill tracks: Bronze → Silver → Gold → Platinum. Win consistently on a difficulty to advance." },
      { q: "What are Milestones?", a: "Lifetime stat badges: 100/500/1000 shots fired, ships sunk, games played, etc. Track your overall career." },
      { q: "What are Commander Perks?", a: "At level milestones, choose 1 of 3 passive perks (e.g., +1 radar charge, +10% XP, or extra ship shield)." },
      { q: "What is the Ship Upgrade Tree?", a: "Spend XP to permanently upgrade ships: extend radar range, add armor, reduce ability cooldowns, or gain extra shots." },
    ],
  },
  social: {
    title: "Social & Stats",
    items: [
      { q: "What is the Profile?", a: "View your lifetime stats, level, title, accuracy trends, and total games. Accessible via the Profile button in the header." },
      { q: "What is Match History?", a: "A log of your last 50 games with details: difficulty, shots, accuracy, duration, and result." },
      { q: "What are Replays?", a: "Every game is automatically recorded. Watch replays move-by-move with playback controls!" },
      { q: "What are Loadouts?", a: "Save your favorite settings combinations (board size, difficulty, mode, etc.) as named presets for quick access." },
      { q: "What is the Memorial Wall?", a: "An honor roll of your most heroic ships — the ones with the most kills before sinking or the longest survivors." },
      { q: "What is Head-to-Head?", a: "Track your win/loss record against each AI personality and difficulty level." },
      { q: "What is the Placement Heatmap?", a: "Visualize where you most commonly place your ships, so you can identify and break predictable patterns." },
      { q: "What is Export/Import?", a: "Export all your progress (stats, achievements, replays, settings) as a JSON file. Import to restore on a new device." },
    ],
  },
  advanced: {
    title: "Advanced Features",
    items: [
      { q: "What is the Crew System?", a: "Hire and level crew members that give passive bonuses. Navigator gives +1 move range, Gunner improves accuracy, Medic enables repairs." },
      { q: "What are Fleet Lore Cards?", a: "Collectible backstory cards for each ship type, unlocked through gameplay. Build your collection!" },
      { q: "What are Factions?", a: "Choose Navy, Pirates, or Aliens — each has unique visual themes and potential future gameplay differences." },
      { q: "What is the Nemesis System?", a: "The AI remembers past games and develops grudges. It may comment on your previous strategies!" },
      { q: "What is the Improvement Tracker?", a: "Graphs showing your accuracy, win rate, and speed trends over time. See if you're getting better!" },
      { q: "What is Board Skins?", a: "Change the visual appearance of the game board: Classic Blue, Tropical Lagoon, Arctic Ice, Deep Space, Lava Sea, or Steampunk Brass." },
      { q: "What is the Strategy Notes pad?", a: "A text pad beside the board for writing notes during play. Track patterns, mark suspicious areas, plan your next moves." },
      { q: "What are Board Annotations?", a: "Right-click cells to mark them as 'maybe' (yellow) or 'unlikely' (grey). Helps you track your deductions visually." },
      { q: "What is Smart Assist?", a: "Highlights cells that are guaranteed misses (e.g., corners adjacent to sunk ships). Reduces wasted shots for newer players." },
      { q: "What is the Probability Overlay?", a: "Toggle an overlay showing AI-computed hit probability for each cell. See exactly where ships are most likely hiding!" },
      { q: "What is Voice Commands?", a: "Say 'Fire B4' or any coordinate to fire using your microphone (Web Speech API). Enable in Settings." },
      { q: "What is Gamepad Support?", a: "Play with an Xbox/PlayStation controller. D-pad to navigate cells, A/X to fire. Enable in Settings." },
      { q: "What is the Benchmark?", a: "Run 100 simulated AI-vs-AI games to test strategies and measure average performance metrics." },
    ],
  },
};

export default function HelpGuide({ open, onClose }: HelpGuideProps) {
  const [activeCategory, setActiveCategory] = useState<HelpCategory>("basics");
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (!open) return null;

  const content = HELP_CONTENT[activeCategory];

  const filteredItems = searchQuery.trim()
    ? Object.values(HELP_CONTENT).flatMap((cat) =>
        cat.items.filter(
          (item) =>
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : content.items;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal help-guide-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>&times;</button>
        <div className="help-guide">
          <div className="help-guide__header">
            <h2>Help & Guide</h2>
            <p className="help-guide__subtitle">Everything you need to know about Battleship</p>
            <input
              type="text"
              className="help-guide__search"
              placeholder="Search for anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {!searchQuery.trim() && (
            <nav className="help-guide__nav">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`help-guide__tab${activeCategory === cat.id ? " help-guide__tab--active" : ""}`}
                  onClick={() => { setActiveCategory(cat.id); setExpandedItem(null); }}
                >
                  <span className="help-guide__tab-icon">{cat.icon}</span>
                  <span className="help-guide__tab-label">{cat.label}</span>
                </button>
              ))}
            </nav>
          )}

          <div className="help-guide__content">
            {!searchQuery.trim() && <h3 className="help-guide__section-title">{content.title}</h3>}
            {searchQuery.trim() && <h3 className="help-guide__section-title">Search Results ({filteredItems.length})</h3>}
            <div className="help-guide__items">
              {filteredItems.map((item, i) => (
                <div
                  key={`${item.q}-${i}`}
                  className={`help-guide__item${expandedItem === i ? " help-guide__item--expanded" : ""}`}
                >
                  <button
                    type="button"
                    className="help-guide__question"
                    onClick={() => setExpandedItem(expandedItem === i ? null : i)}
                    aria-expanded={expandedItem === i}
                  >
                    <span>{item.q}</span>
                    <span className="help-guide__chevron">{expandedItem === i ? "−" : "+"}</span>
                  </button>
                  {expandedItem === i && (
                    <div className="help-guide__answer">{item.a}</div>
                  )}
                </div>
              ))}
              {filteredItems.length === 0 && (
                <p className="help-guide__empty">No results found. Try a different search term.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
