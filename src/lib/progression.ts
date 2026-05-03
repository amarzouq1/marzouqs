// XP & Progression System — Marzouq's Gaming Center
// All data is stored in localStorage for instant, offline-first operation.

export interface XPEntry {
  game: string;
  xp: number;
  timestamp: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: PlayerStats) => boolean;
}

export interface PlayerStats {
  totalXP: number;
  level: number;
  gameXP: Record<string, number>;
  gamesPlayed: Record<string, number>;
  highScores: Record<string, number>;
  achievementIds: string[];
  streakDays: number;
  lastPlayDate: string;
}

// ─── Level thresholds ─────────────────────────────────────────────────────────
export function xpForLevel(level: number): number {
  // Quadratic scale: level 1 = 0, level 2 = 150, level 5 = 1350, level 20 = 28500
  return Math.round(100 * level * (level - 1) * 0.75);
}

export function levelFromXP(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function xpProgressInLevel(xp: number): { current: number; needed: number; percent: number } {
  const level = levelFromXP(xp);
  const start = xpForLevel(level);
  const next  = xpForLevel(level + 1);
  return {
    current: xp - start,
    needed:  next - start,
    percent: Math.round(((xp - start) / (next - start)) * 100),
  };
}

export function levelTitle(level: number): string {
  if (level >= 50) return 'Grandmaster';
  if (level >= 40) return 'Legend';
  if (level >= 30) return 'Elite';
  if (level >= 20) return 'Expert';
  if (level >= 15) return 'Veteran';
  if (level >= 10) return 'Advanced';
  if (level >= 6)  return 'Intermediate';
  if (level >= 3)  return 'Apprentice';
  return 'Rookie';
}

// ─── Achievements ─────────────────────────────────────────────────────────────
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_game',    name: 'Welcome!',        description: 'Play your first game',          icon: '🎮', condition: s => s.totalXP > 0 },
  { id: 'chess_1000',   name: 'Tactician',        description: 'Reach 1000 ELO in Chess',       icon: '♟️', condition: s => (s.highScores['chess'] ?? 0) >= 1000 },
  { id: 'chess_1500',   name: 'Chess Master',     description: 'Reach 1500 ELO in Chess',       icon: '👑', condition: s => (s.highScores['chess'] ?? 0) >= 1500 },
  { id: 'race_win',     name: 'Pole Position',    description: 'Win a racing match',             icon: '🏍️', condition: s => (s.highScores['racing'] ?? 0) > 0 },
  { id: 'math_streak',  name: 'Math Wizard',      description: 'Score 500+ in Math Arena',       icon: '🧮', condition: s => (s.highScores['math'] ?? 0) >= 500 },
  { id: 'reader',       name: 'Scholar',          description: 'Complete a reading challenge',   icon: '📚', condition: s => (s.gamesPlayed['reading'] ?? 0) >= 1 },
  { id: 'perfect_read', name: 'Perfect Reader',   description: 'Score 5/5 in reading',          icon: '🌟', condition: s => (s.highScores['reading'] ?? 0) >= 600 },
  { id: 'physicist',    name: 'Physicist',        description: 'Complete Physics Lab Level 3',   icon: '🔬', condition: s => (s.highScores['physics'] ?? 0) >= 300 },
  { id: 'level5',       name: 'Level 5',          description: 'Reach Level 5',                  icon: '⬆️', condition: s => s.level >= 5 },
  { id: 'level10',      name: 'Veteran',          description: 'Reach Level 10',                 icon: '🏆', condition: s => s.level >= 10 },
  { id: 'level20',      name: 'Expert',           description: 'Reach Level 20',                 icon: '💎', condition: s => s.level >= 20 },
  { id: 'polymath',     name: 'Polymath',         description: 'Play every game at least once',  icon: '🧠', condition: s => ['chess','math','physics','language','sonic','platformer','racing','reading'].every(g => (s.gamesPlayed[g] ?? 0) > 0) },
  { id: 'streak3',      name: '3-Day Streak',     description: '3 consecutive play days',        icon: '🔥', condition: s => s.streakDays >= 3 },
  { id: 'streak7',      name: 'Weekly Warrior',   description: '7-day play streak',              icon: '🗓️', condition: s => s.streakDays >= 7 },
  { id: 'xp1000',       name: 'Rising Star',      description: 'Earn 1000 total XP',             icon: '⭐', condition: s => s.totalXP >= 1000 },
  { id: 'xp5000',       name: 'Superstar',        description: 'Earn 5000 total XP',             icon: '🌠', condition: s => s.totalXP >= 5000 },
];

// ─── XP rewards per game ──────────────────────────────────────────────────────
export const XP_RATES: Record<string, (score: number) => number> = {
  chess:      (score) => Math.round(10 + score * 0.05),
  math:       (score) => Math.round(5 + score * 0.15),
  physics:    (score) => Math.round(8 + score * 0.1),
  language:   (score) => Math.round(6 + score * 0.12),
  sonic:      (score) => Math.round(4 + score * 0.02),
  platformer: (score) => Math.round(4 + score * 0.02),
  racing:     (score) => Math.round(10 + score * 0.25),
  reading:    (score) => Math.round(8 + score * 0.1),
};

const KEY = 'mgc_player_stats';

function defaultStats(): PlayerStats {
  return {
    totalXP: 0, level: 1,
    gameXP: {}, gamesPlayed: {}, highScores: {},
    achievementIds: [],
    streakDays: 0, lastPlayDate: '',
  };
}

export function loadStats(): PlayerStats {
  if (typeof window === 'undefined') return defaultStats();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultStats();
    return JSON.parse(raw) as PlayerStats;
  } catch {
    return defaultStats();
  }
}

export function saveStats(stats: PlayerStats): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(stats));
}

/** Grant XP for completing a game. Returns new achievements unlocked. */
export function grantXP(game: string, rawScore: number): Achievement[] {
  const stats = loadStats();
  const xpEarned = (XP_RATES[game] ?? (() => 5))(rawScore);
  stats.totalXP += xpEarned;
  stats.level = levelFromXP(stats.totalXP);
  stats.gameXP[game] = (stats.gameXP[game] ?? 0) + xpEarned;
  stats.gamesPlayed[game] = (stats.gamesPlayed[game] ?? 0) + 1;
  if (rawScore > (stats.highScores[game] ?? 0)) stats.highScores[game] = rawScore;

  // Streak
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (stats.lastPlayDate === yesterday) stats.streakDays++;
  else if (stats.lastPlayDate !== today) stats.streakDays = 1;
  stats.lastPlayDate = today;

  // Check achievements
  const before = new Set(stats.achievementIds);
  const newAchs: Achievement[] = [];
  for (const ach of ACHIEVEMENTS) {
    if (!before.has(ach.id) && ach.condition(stats)) {
      stats.achievementIds.push(ach.id);
      newAchs.push(ach);
    }
  }

  saveStats(stats);
  return newAchs;
}
