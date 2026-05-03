'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Trophy, Target, Zap, BookOpen, Crown, Star, BarChart2, Shield, Flame,
} from 'lucide-react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import { getEloTitle, formatNumber, getLocalScores } from '@/lib/utils';
import { loadStats, ACHIEVEMENTS, levelTitle, xpProgressInLevel, PlayerStats } from '@/lib/progression';

interface GameStat { slug: string; label: string; icon: React.ReactNode; color: string; maxScore: number }

const GAME_STATS: GameStat[] = [
  { slug: 'chess',      label: 'Chess',             icon: <Crown    size={16} />, color: '#FFD700', maxScore: 3200  },
  { slug: 'math',       label: 'Math Arena',        icon: <Target   size={16} />, color: '#0047FF', maxScore: 5000  },
  { slug: 'battle',     label: 'Math Battle',       icon: <Target   size={16} />, color: '#FF4444', maxScore: 3000  },
  { slug: 'physics',    label: 'Physics Lab',       icon: <Zap      size={16} />, color: '#00AAFF', maxScore: 8000  },
  { slug: 'language',   label: 'Language Dojo',     icon: <BookOpen size={16} />, color: '#9B59B6', maxScore: 5000  },
  { slug: 'reading',    label: 'Reading Challenge',  icon: <BookOpen size={16} />, color: '#22c55e', maxScore: 1000  },
  { slug: 'sonic',      label: 'Velocity Runner',   icon: <Zap      size={16} />, color: '#00FF88', maxScore: 20000 },
  { slug: 'platformer', label: 'Apex Platformer',   icon: <Shield   size={16} />, color: '#4080FF', maxScore: 10000 },
  { slug: 'racing',     label: 'Motorcycle Racing', icon: <Flame    size={16} />, color: '#FF6B35', maxScore: 5000  },
];

export default function ProfilePage() {
  const [chessElo, setChessElo]   = useState(800);
  const [scores, setScores]       = useState<Record<string, number>>({});
  const [totalGames, setTotalGames] = useState(0);
  const [stats, setStats]         = useState<PlayerStats | null>(null);
  const [username, setUsername]   = useState<string | null>(null);

  useEffect(() => {
    setUsername(localStorage.getItem('mgc_username'));
    const elo = parseInt(localStorage.getItem('mgc_chess_elo') ?? '800', 10);
    setChessElo(isNaN(elo) ? 800 : elo);

    const allScores: Record<string, number> = {};
    let games = 0;
    for (const g of GAME_STATS) {
      const entries = getLocalScores(g.slug);
      if (entries.length > 0) {
        allScores[g.slug] = Math.max(...entries.map((e: { score: number }) => e.score));
        games += entries.length;
      }
    }
    setScores(allScores);
    setTotalGames(games);
    setStats(loadStats());
  }, []);

  const eloTitle = getEloTitle(chessElo);
  const eloMax = { Novice: 1000, Apprentice: 1200, Knight: 1400, Expert: 1600, Master: 1800, 'Grand Master': 2200, Grandmaster: 3200 }[eloTitle] ?? 1200;
  const eloProgress = Math.min(100, ((chessElo - 800) / (eloMax - 800)) * 100);
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  const level       = stats?.level ?? 1;
  const totalXP     = stats?.totalXP ?? 0;
  const xpProg      = xpProgressInLevel(totalXP);
  const lvlTitle    = levelTitle(level);
  const unlockedAchs = new Set(stats?.achievementIds ?? []);
  const streakDays  = stats?.streakDays ?? 0;

  return (
    <div className="min-h-dvh pt-16 md:pt-20 pb-24">
      <div className="fluid-container py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <User size={20} className="text-cobalt-light" />
                <h1 className="text-3xl font-bold text-white">
                  {username ? username : 'Player Profile'}
                </h1>
              </div>
              <p className="text-white/50">Your progress across all arenas</p>
            </div>
            <div className="flex items-center gap-3">
              {!username && (
                <Link href="/login" className="btn-cobalt text-sm px-4 py-2">
                  Sign In
                </Link>
              )}
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-cobalt-light border border-cobalt/30 bg-cobalt/10 hover:bg-cobalt/20 transition-all"
              >
                <Shield size={15} /> Admin
              </Link>
            </div>
          </div>
        </motion.div>

        {/* XP / Level Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8">
          <div className="glass-dark rounded-2xl p-6 border border-cobalt/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-cobalt-gradient opacity-5 pointer-events-none rounded-2xl" />
            <div className="relative flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-cobalt-gradient flex items-center justify-center shadow-cobalt text-3xl flex-shrink-0 font-black text-white">
                {username ? username[0].toUpperCase() : '🧑'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <span className="text-xl font-bold text-white">Level {level}</span>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-cobalt/20 text-cobalt-bright border border-cobalt/40">{lvlTitle}</span>
                  {streakDays >= 2 && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      🔥 {streakDays}-day streak
                    </span>
                  )}
                </div>
                <div className="text-white/50 text-sm mb-3">{formatNumber(totalXP)} total XP</div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-1.5">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${xpProg.percent}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full rounded-full bg-cobalt-gradient"
                  />
                </div>
                <div className="flex justify-between text-xs text-white/40">
                  <span>{formatNumber(xpProg.current)} XP</span>
                  <span>{formatNumber(xpProg.needed)} XP to Level {level + 1}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Trophy   size={18} />, label: 'Total Score',    value: formatNumber(totalScore),                          color: 'text-yellow-400'   },
            { icon: <BarChart2 size={18} />, label: 'Games Played',   value: formatNumber(totalGames),                          color: 'text-cobalt-light' },
            { icon: <Crown    size={18} />, label: 'Chess ELO',      value: chessElo,                                          color: 'text-gold'         },
            { icon: <Star     size={18} />, label: 'Achievements',   value: `${unlockedAchs.size}/${ACHIEVEMENTS.length}`,     color: 'text-cobalt-bright'},
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
              <GlassCard hover className="p-4 text-center">
                <div className={`flex justify-center mb-2 ${stat.color}`}>{stat.icon}</div>
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/50 mt-1">{stat.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Chess ELO Progress */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mb-8">
          <GlassCard variant="cobalt" className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Crown size={20} className="text-gold" />
              <h2 className="text-xl font-bold text-white">Chess Rating</h2>
              <span className="elo-badge ml-auto">{eloTitle}</span>
            </div>
            <div className="flex items-end gap-4 mb-3">
              <div className="text-5xl font-bold text-gold">{chessElo}</div>
              <div className="text-white/40 pb-1">ELO</div>
            </div>
            <div className="progress-bar h-3 rounded-full mb-2">
              <div className="progress-fill h-3 rounded-full transition-all duration-700" style={{ width: `${eloProgress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-white/40">
              <span>800</span>
              <span>Next tier: {eloMax}</span>
            </div>
          </GlassCard>
        </motion.div>

        {/* Game High Scores */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart2 size={18} className="text-cobalt-light" />
            Game High Scores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GAME_STATS.map((game, i) => {
              const best    = scores[game.slug] ?? 0;
              const progress = Math.min(100, (best / game.maxScore) * 100);
              const xpEarned = stats?.gameXP[game.slug] ?? 0;
              const played   = stats?.gamesPlayed[game.slug] ?? 0;
              return (
                <motion.div key={game.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
                  <GlassCard hover className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${game.color}22`, color: game.color }}>
                        {game.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">{game.label}</div>
                        {best === 0
                          ? <div className="text-xs text-white/30">Not played yet</div>
                          : <div className="text-xs text-white/50">{played}× played · {formatNumber(xpEarned)} XP</div>}
                      </div>
                      {best > 0 && (
                        <div className="text-lg font-bold flex-shrink-0" style={{ color: game.color }}>{formatNumber(best)}</div>
                      )}
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, delay: 0.2 + i * 0.07 }}
                        className="h-full rounded-full"
                        style={{ background: game.color, boxShadow: `0 0 6px ${game.color}66` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-white/30">
                      <span>{Math.round(progress)}%</span>
                      <span>Max: {formatNumber(game.maxScore)}</span>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Star size={18} className="text-gold" />
            Achievements ({unlockedAchs.size}/{ACHIEVEMENTS.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = unlockedAchs.has(ach.id);
              return (
                <GlassCard key={ach.id} className={`p-4 text-center transition-opacity duration-300 ${unlocked ? '' : 'opacity-35'}`}>
                  <div className="text-3xl mb-2">{ach.icon}</div>
                  <div className={`text-sm font-semibold mb-1 ${unlocked ? 'text-white' : 'text-white/60'}`}>{ach.name}</div>
                  <div className="text-xs text-white/40 leading-snug">{ach.description}</div>
                  {unlocked && <div className="mt-2 text-xs text-cobalt-bright font-bold">✓ Unlocked</div>}
                </GlassCard>
              );
            })}
          </div>
        </motion.div>

        {/* Quick links */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-10 flex flex-wrap gap-3 justify-center">
          <Link href="/" className="btn-glass px-6 py-2.5 rounded-xl text-sm font-bold">← Back to Hub</Link>
          <Link href="/games/chess" className="btn-cobalt px-6 py-2.5 rounded-xl text-sm font-bold">Play Chess</Link>
          <Link href="/games/racing" className="px-6 py-2.5 rounded-xl text-sm font-bold bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-colors">
            🏍️ Race
          </Link>
          <Link href="/games/academy/battle" className="px-6 py-2.5 rounded-xl text-sm font-bold bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30 transition-colors">
            ⚔️ Battle
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
