'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Zap, Brain, BookOpen, Shield, Star, Medal, Swords, Flame } from 'lucide-react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import { formatNumber, getLocalScores } from '@/lib/utils';

const ACADEMY_SLUGS = new Set(['math', 'physics', 'language', 'battle', 'reading', 'mathdog', 'speak', 'signs', 'arabic', 'russian', 'chinese']);

const GAMES = [
  { slug: 'chess',      label: 'Chess Arena',       icon: Crown,    color: '#FFD700' },
  { slug: 'math',       label: 'Math Arena',        icon: Brain,    color: '#0047FF' },
  { slug: 'battle',     label: 'Math Battle',       icon: Swords,   color: '#FF4444' },
  { slug: 'physics',    label: 'Physics Lab',       icon: Zap,      color: '#00AAFF' },
  { slug: 'language',   label: 'Language Dojo',     icon: BookOpen, color: '#9B59B6' },
  { slug: 'reading',    label: 'Reading Challenge', icon: BookOpen, color: '#22c55e' },
  { slug: 'sonic',      label: 'Velocity Runner',   icon: Zap,      color: '#00FF88' },
  { slug: 'platformer', label: 'Apex Platformer',   icon: Shield,   color: '#4080FF' },
  { slug: 'racing',     label: 'Moto Racing',       icon: Flame,    color: '#FF6B35' },
  { slug: 'train',      label: 'Train Surf',        icon: Zap,      color: '#8B5CF6' },
  { slug: 'mathdog',    label: 'Math Dog',          icon: Brain,    color: '#F39C12' },
  { slug: 'speak',      label: 'How to Speak',      icon: Star,     color: '#E67E22' },
  { slug: 'signs',      label: 'Sign Language',     icon: BookOpen, color: '#7F8C8D' },
  { slug: 'arabic',     label: 'Arabic',            icon: BookOpen, color: '#00AA44' },
  { slug: 'russian',    label: 'Russian',           icon: BookOpen, color: '#CC0000' },
  { slug: 'chinese',    label: 'Chinese',           icon: BookOpen, color: '#FF4444' },
];

function rankColor(rank: number) {
  if (rank === 1) return '#FFD700';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return undefined;
}

function rankIcon(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

interface Entry { name: string; score: number; date: string; }

export default function LeaderboardPage() {
  const [activeGame, setActiveGame] = useState(GAMES[0].slug);
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    // Pull local scores and format them
    const raw = getLocalScores(activeGame) as { score: number; date?: string }[];
    const sorted = [...raw].sort((a, b) => b.score - a.score).slice(0, 20);
    setEntries(
      sorted.map((e, i) => ({
        name: i === 0 ? 'Marzouq ★' : `Player ${i + 1}`,
        score: e.score,
        date: e.date ? new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
      })),
    );
  }, [activeGame]);

  const activeGameMeta = GAMES.find((g) => g.slug === activeGame)!;
  const Icon = activeGameMeta.icon;

  return (
    <div className="min-h-dvh pt-16 md:pt-20 pb-24">
      <div className="fluid-container py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 glass-cobalt px-4 py-2 rounded-full text-sm font-medium text-cobalt-light mb-4">
            <Trophy size={13} />
            Hall of Fame
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Leaderboard</h1>
          <p className="text-white/50">Top scores across all arenas</p>
        </motion.div>

        {/* Game selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
          {GAMES.map((g) => {
            const GIcon = g.icon;
            const active = g.slug === activeGame;
            return (
              <button
                key={g.slug}
                onClick={() => setActiveGame(g.slug)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  active ? 'text-white' : 'glass text-white/50 hover:text-white/80'
                }`}
                style={active ? { background: `${g.color}22`, border: `1px solid ${g.color}44`, color: g.color } : {}}
              >
                <GIcon size={13} /> {g.label}
              </button>
            );
          })}
        </div>

        {/* Leaderboard Table */}
        <motion.div
          key={activeGame}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {entries.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-bold text-white mb-2">No Scores Yet</h3>
              <p className="text-white/50 mb-6">Be the first to set a record in {activeGameMeta.label}!</p>
              <Link href={`/games/${ACADEMY_SLUGS.has(activeGame) ? `academy/${activeGame}` : activeGame}`} className="btn-cobalt">
                Play Now →
              </Link>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {/* Top 3 podium */}
              {entries.length >= 3 && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[entries[1], entries[0], entries[2]].map((e, idx) => {
                    const podiumRank = [2, 1, 3][idx];
                    const isFirst = podiumRank === 1;
                    return (
                      <motion.div
                        key={podiumRank}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: isFirst ? -12 : 0 }}
                        transition={{ delay: 0.1 * podiumRank }}
                      >
                        <GlassCard
                          className={`p-4 text-center ${isFirst ? 'border border-yellow-400/30' : ''}`}
                          variant={isFirst ? 'cobalt' : 'default'}
                        >
                          <div className="text-2xl mb-1">{rankIcon(podiumRank)}</div>
                          <div className="font-bold text-white text-sm truncate">{e.name}</div>
                          <div
                            className="text-lg font-black mt-1"
                            style={{ color: rankColor(podiumRank) ?? activeGameMeta.color }}
                          >
                            {formatNumber(e.score)}
                          </div>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Full list */}
              <GlassCard className="overflow-hidden">
                <div className="divide-y divide-white/5">
                  {entries.map((e, i) => {
                    const rank = i + 1;
                    const rc = rankColor(rank);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 * i }}
                        className={`flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors ${rank <= 3 ? 'bg-white/5' : ''}`}
                      >
                        {/* Rank */}
                        <div className="w-8 text-center font-bold text-sm" style={{ color: rc ?? 'rgba(255,255,255,0.3)' }}>
                          {rankIcon(rank)}
                        </div>
                        {/* Avatar placeholder */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: `${activeGameMeta.color}22`, color: activeGameMeta.color }}
                        >
                          {e.name.charAt(0)}
                        </div>
                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{e.name}</div>
                          <div className="text-xs text-white/30">{e.date}</div>
                        </div>
                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold" style={{ color: rc ?? activeGameMeta.color }}>
                            {formatNumber(e.score)}
                          </div>
                          {rank === 1 && (
                            <div className="flex items-center justify-end gap-0.5">
                              {[...Array(5)].map((_, si) => (
                                <Star key={si} size={8} fill={activeGameMeta.color} color={activeGameMeta.color} />
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </GlassCard>
            </div>
          )}
        </motion.div>

        {/* Back CTA */}
        <div className="mt-8 text-center">
          <Link href="/" className="btn-glass mr-3">← Hub</Link>
          <Link href="/profile" className="btn-cobalt">My Profile</Link>
        </div>
      </div>
    </div>
  );
}
