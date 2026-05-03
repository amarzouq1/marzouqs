// ELO Reward System — Marzouq's Gaming Center
// Tier-based rewards unlocked by ELO rating and player level.

export interface RewardTier {
  id: string;
  name: string;
  icon: string;
  color: string;
  minElo: number;
  minLevel: number;
  description: string;
  reward: string;
  badge: string;
}

export interface ClaimedReward {
  tierId: string;
  claimedAt: number; // timestamp
}

export const REWARD_TIERS: RewardTier[] = [
  {
    id: 'bronze',
    name: 'Bronze Scholar',
    icon: '🥉',
    color: '#CD7F32',
    minElo: 900,
    minLevel: 3,
    description: 'Awarded for reaching ELO 900 and Level 3.',
    reward: 'Bronze Scholar badge + 500 bonus XP',
    badge: '🥉',
  },
  {
    id: 'silver',
    name: 'Silver Thinker',
    icon: '🥈',
    color: '#C0C0C0',
    minElo: 1100,
    minLevel: 8,
    description: 'Awarded for reaching ELO 1100 and Level 8.',
    reward: 'Silver Thinker badge + 1500 bonus XP',
    badge: '🥈',
  },
  {
    id: 'gold',
    name: 'Gold Champion',
    icon: '🥇',
    color: '#FFD700',
    minElo: 1300,
    minLevel: 15,
    description: 'Awarded for reaching ELO 1300 and Level 15.',
    reward: 'Gold Champion badge + 3000 bonus XP',
    badge: '🥇',
  },
  {
    id: 'platinum',
    name: 'Platinum Master',
    icon: '💎',
    color: '#E5E4E2',
    minElo: 1600,
    minLevel: 25,
    description: 'Awarded for reaching ELO 1600 and Level 25.',
    reward: 'Platinum Master badge + 6000 bonus XP',
    badge: '💎',
  },
  {
    id: 'diamond',
    name: 'Diamond Legend',
    icon: '👑',
    color: '#B9F2FF',
    minElo: 2000,
    minLevel: 40,
    description: 'The pinnacle of achievement. ELO 2000 and Level 40.',
    reward: 'Diamond Legend crown + 15000 bonus XP + Hall of Fame',
    badge: '👑',
  },
  // Special achievement rewards
  {
    id: 'polyglot',
    name: 'Polyglot',
    icon: '🌍',
    color: '#2ECC71',
    minElo: 800,
    minLevel: 5,
    description: 'Play all 4 language games (Arabic, Russian, Chinese, Sign Language).',
    reward: 'Polyglot badge + 1000 bonus XP',
    badge: '🌍',
  },
  {
    id: 'academician',
    name: 'Academician',
    icon: '🎓',
    color: '#9B59B6',
    minElo: 1000,
    minLevel: 10,
    description: 'Complete quizzes in all 6 Academy subjects.',
    reward: 'Academician cap + 2000 bonus XP',
    badge: '🎓',
  },
  {
    id: 'speedrunner',
    name: 'Speed Runner',
    icon: '⚡',
    color: '#F39C12',
    minElo: 900,
    minLevel: 5,
    description: 'Reach score 5000+ in any arcade game.',
    reward: 'Speed Runner lightning badge + 800 bonus XP',
    badge: '⚡',
  },
];

const STORAGE_KEY = 'mgc_rewards';

export interface RewardState {
  claimed: ClaimedReward[];
  lastDailyClaim: number; // timestamp
  totalXPBonusGranted: number;
}

function loadRewardState(): RewardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as RewardState;
  } catch { /* ignore */ }
  return { claimed: [], lastDailyClaim: 0, totalXPBonusGranted: 0 };
}

function saveRewardState(state: RewardState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function getClaimedRewards(): ClaimedReward[] {
  return loadRewardState().claimed;
}

export function isRewardClaimed(tierId: string): boolean {
  return loadRewardState().claimed.some(c => c.tierId === tierId);
}

export function claimReward(tierId: string, bonusXP: number): boolean {
  const state = loadRewardState();
  // Anti-duplicate: already claimed
  if (state.claimed.some(c => c.tierId === tierId)) return false;

  state.claimed.push({ tierId, claimedAt: Date.now() });
  state.totalXPBonusGranted += bonusXP;

  // Grant XP bonus by updating player stats
  try {
    const raw = localStorage.getItem('mgc_player_stats');
    if (raw) {
      const ps = JSON.parse(raw);
      ps.xp = (ps.xp ?? 0) + bonusXP;
      // Recalculate level
      let level = 1;
      let xpNeeded = 1000;
      let remaining = ps.xp;
      while (remaining >= xpNeeded && level < 100) {
        remaining -= xpNeeded;
        level++;
        xpNeeded = Math.floor(xpNeeded * 1.15);
      }
      ps.level = level;
      localStorage.setItem('mgc_player_stats', JSON.stringify(ps));
    }
  } catch { /* ignore */ }

  saveRewardState(state);
  return true;
}

export function getEloFromStorage(): number {
  try {
    const elo = localStorage.getItem('mgc_chess_elo');
    return elo ? parseInt(elo, 10) : 1000;
  } catch { return 1000; }
}

export function getLevelFromStorage(): number {
  try {
    const raw = localStorage.getItem('mgc_player_stats');
    if (raw) {
      const ps = JSON.parse(raw);
      return ps.level ?? 1;
    }
  } catch { /* ignore */ }
  return 1;
}

export function getUnlockedTiers(elo: number, level: number): RewardTier[] {
  return REWARD_TIERS.filter(t => elo >= t.minElo && level >= t.minLevel);
}

export function getLockedTiers(elo: number, level: number): RewardTier[] {
  return REWARD_TIERS.filter(t => elo < t.minElo || level < t.minLevel);
}

export function getNextRewardTier(elo: number, level: number): RewardTier | null {
  const locked = getLockedTiers(elo, level);
  if (locked.length === 0) return null;
  // Find closest to unlock
  return locked.sort((a, b) => {
    const aProg = (elo / a.minElo) * 0.5 + (level / a.minLevel) * 0.5;
    const bProg = (elo / b.minElo) * 0.5 + (level / b.minLevel) * 0.5;
    return bProg - aProg;
  })[0];
}
