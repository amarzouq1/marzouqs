'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { getLocalScores, formatNumber } from '@/lib/utils';

const ADMIN_PIN = 'admin2024';

const ALL_GAMES = [
  { key: 'chess',    label: 'Chess',           icon: '♟️' },
  { key: 'math',     label: 'Math Arena',       icon: '🔢' },
  { key: 'battle',   label: 'Math Battle',      icon: '⚔️' },
  { key: 'physics',  label: 'Physics Lab',      icon: '⚛️' },
  { key: 'language', label: 'Language Dojo',    icon: '🗣️' },
  { key: 'reading',  label: 'Reading Challenge', icon: '📖' },
  { key: 'sonic',    label: 'Velocity Runner',  icon: '🏃' },
  { key: 'platform', label: 'Apex Platformer',  icon: '🦅' },
  { key: 'racing',   label: 'Moto Racing',      icon: '🏍️' },
  { key: 'train',    label: 'Train Surf',        icon: '🚂' },
  { key: 'mathdog',  label: 'Math Dog',          icon: '🐶' },
  { key: 'speak',    label: 'How to Speak',      icon: '🎤' },
  { key: 'signs',    label: 'Sign Language',     icon: '🤟' },
  { key: 'arabic',   label: 'Arabic',           icon: '🇸🇦' },
  { key: 'russian',  label: 'Russian',          icon: '🇷🇺' },
  { key: 'chinese',  label: 'Chinese',          icon: '🇨🇳' },
];

interface GameStats {
  key: string;
  label: string;
  icon: string;
  plays: number;
  topScore: number;
  avgScore: number;
  scores: number[];
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<GameStats[]>([]);
  const [totalPlays, setTotalPlays] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'xp'>('overview');

  const [playerStats, setPlayerStats] = useState<{level: number; xp: number; totalPlays: number} | null>(null);

  useEffect(() => {
    // Check stored auth
    const stored = sessionStorage.getItem('mgc_admin_auth');
    if (stored === ADMIN_PIN) setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    // Load all game stats from localStorage
    const gameStats = ALL_GAMES.map(g => {
      const raw = getLocalScores(g.key) as Array<{ score: number; date: string }>;
      const scoreValues = raw.map(s => s.score);
      return {
        ...g,
        plays: raw.length,
        topScore: scoreValues.length > 0 ? Math.max(...scoreValues) : 0,
        avgScore: scoreValues.length > 0 ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) : 0,
        scores: scoreValues,
      };
    });
    setStats(gameStats);
    setTotalPlays(gameStats.reduce((a: number, g: GameStats) => a + g.plays, 0));

    // Player stats
    try {
      const raw = localStorage.getItem('mgc_player_stats');
      if (raw) {
        const ps = JSON.parse(raw);
        setPlayerStats({ level: ps.level ?? 1, xp: ps.xp ?? 0, totalPlays: ps.totalGames ?? 0 });
      }
    } catch { /* ignore */ }
  }, [authed]);

  const handleLogin = () => {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('mgc_admin_auth', pin);
      setAuthed(true);
      setError('');
    } else {
      setError('Incorrect PIN. Try admin2024');
    }
  };

  const topGames = [...stats].sort((a, b) => b.plays - a.plays).slice(0, 5);
  const mostPlayed = stats.find(s => s.plays === Math.max(...stats.map(g => g.plays)));

  return (
    <div className="min-h-dvh pt-16 pb-24 bg-midnight">
      <div className="fluid-container max-w-4xl py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="glass p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} className="text-white/70" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">🛡️ Admin Dashboard</h1>
            <p className="text-white/40 text-sm">Platform analytics and management</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Login */}
          {!authed && (
            <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-sm mx-auto">
              <div className="glass-dark rounded-2xl p-8 text-center border border-white/10">
                <div className="text-5xl mb-4">🔐</div>
                <h2 className="text-xl font-black text-white mb-2">Admin Access</h2>
                <p className="text-white/40 text-sm mb-6">Enter your admin PIN to continue</p>
                <div className="relative mb-4">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
                    placeholder="Enter PIN..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-bold text-center text-lg focus:outline-none focus:border-cobalt/60 placeholder-white/30 tracking-widest"
                  />
                  <button onClick={() => setShowPin(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                <button onClick={handleLogin} className="w-full btn-cobalt py-3 rounded-xl font-bold">
                  <Lock size={16} className="inline mr-2" /> Access Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {/* Dashboard */}
          {authed && (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Plays', value: totalPlays, icon: '🎮', color: '#0047FF' },
                  { label: 'Games Available', value: ALL_GAMES.length, icon: '🗂️', color: '#00AA44' },
                  { label: 'Player Level', value: playerStats?.level ?? '—', icon: '⭐', color: '#FFD700' },
                  { label: 'Total XP', value: playerStats ? formatNumber(playerStats.xp) : '—', icon: '⚡', color: '#FF6600' },
                ].map((card, i) => (
                  <div key={i} className="glass rounded-2xl p-4 border border-white/10">
                    <div className="text-2xl mb-2">{card.icon}</div>
                    <div className="text-2xl font-black text-white">{card.value}</div>
                    <div className="text-white/40 text-xs">{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-5">
                {(['overview', 'leaderboard', 'xp'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm capitalize transition-all ${
                      activeTab === tab ? 'bg-cobalt text-white' : 'glass text-white/50 hover:text-white'
                    }`}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  <h2 className="text-white font-bold text-sm text-white/50 uppercase tracking-wider">All Games Stats</h2>
                  {stats.map(g => (
                    <div key={g.key} className="glass rounded-xl p-4 border border-white/10 flex items-center gap-4">
                      <span className="text-2xl w-8">{g.icon}</span>
                      <div className="flex-1">
                        <div className="text-white font-bold text-sm">{g.label}</div>
                        <div className="text-white/40 text-xs">{g.plays} plays</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gold font-bold text-sm">{formatNumber(g.topScore)}</div>
                        <div className="text-white/30 text-xs">best</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white/60 text-sm">{formatNumber(g.avgScore)}</div>
                        <div className="text-white/30 text-xs">avg</div>
                      </div>
                      {/* Mini bar */}
                      <div className="w-16 h-2 bg-white/10 rounded-full">
                        <div className="h-2 bg-cobalt-gradient rounded-full"
                          style={{ width: `${totalPlays > 0 ? Math.round((g.plays / Math.max(...stats.map(s => s.plays), 1)) * 100) : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Leaderboard Tab */}
              {activeTab === 'leaderboard' && (
                <div>
                  <h2 className="text-white font-bold mb-3">Top 5 Most Played Games</h2>
                  <div className="space-y-2 mb-6">
                    {topGames.map((g, i) => (
                      <div key={g.key} className="glass rounded-xl p-4 border border-white/10 flex items-center gap-4">
                        <div className="text-lg font-black" style={{ color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#ffffff44' }}>
                          #{i + 1}
                        </div>
                        <span className="text-2xl">{g.icon}</span>
                        <div className="flex-1">
                          <div className="text-white font-bold">{g.label}</div>
                          <div className="text-white/40 text-xs">{g.plays} plays · Best: {formatNumber(g.topScore)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h2 className="text-white font-bold mb-3">All-Time Best Scores</h2>
                  <div className="space-y-2">
                    {[...stats].filter(g => g.topScore > 0).sort((a, b) => b.topScore - a.topScore).map(g => (
                      <div key={g.key} className="glass rounded-xl p-3 border border-white/10 flex items-center gap-3">
                        <span className="text-xl">{g.icon}</span>
                        <div className="flex-1 text-white text-sm font-semibold">{g.label}</div>
                        <div className="text-gold font-black">{formatNumber(g.topScore)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* XP Tab */}
              {activeTab === 'xp' && playerStats && (
                <div className="space-y-4">
                  <div className="glass-dark rounded-2xl p-5 border border-gold/20">
                    <h2 className="text-white font-bold mb-4">Player Progress</h2>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-3xl font-black text-gold">{playerStats.level}</div>
                        <div className="text-white/40 text-xs">Level</div>
                      </div>
                      <div>
                        <div className="text-3xl font-black text-cobalt-bright">{formatNumber(playerStats.xp)}</div>
                        <div className="text-white/40 text-xs">Total XP</div>
                      </div>
                      <div>
                        <div className="text-3xl font-black text-white">{totalPlays}</div>
                        <div className="text-white/40 text-xs">Games Played</div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-dark rounded-2xl p-5 border border-white/10">
                    <h3 className="text-white font-bold mb-3">Activity by Game</h3>
                    <div className="space-y-2">
                      {stats.filter(g => g.plays > 0).sort((a, b) => b.plays - a.plays).map(g => (
                        <div key={g.key} className="flex items-center gap-3">
                          <span className="text-lg">{g.icon}</span>
                          <div className="flex-1">
                            <div className="text-white text-sm font-semibold">{g.label}</div>
                            <div className="h-2 bg-white/10 rounded-full mt-1">
                              <div className="h-2 bg-cobalt rounded-full" style={{ width: `${Math.round((g.plays / Math.max(...stats.map(s => s.plays), 1)) * 100)}%` }} />
                            </div>
                          </div>
                          <div className="text-white/50 text-xs">{g.plays}x</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Logout */}
              <div className="mt-8 text-center">
                <button onClick={() => { sessionStorage.removeItem('mgc_admin_auth'); setAuthed(false); setPin(''); }}
                  className="text-white/30 text-sm hover:text-white/60 transition-colors">
                  🔒 Lock Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
