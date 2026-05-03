'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Lock, CheckCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';
import {
  REWARD_TIERS, RewardTier,
  getEloFromStorage, getLevelFromStorage,
  getUnlockedTiers, getLockedTiers,
  isRewardClaimed, claimReward, getClaimedRewards,
  getNextRewardTier,
} from '@/lib/rewards';
import { sfx, initAudio } from '@/lib/audio';

export default function RewardsPage() {
  const [elo, setElo]         = useState(1000);
  const [level, setLevel]     = useState(1);
  const [claimed, setClaimed] = useState<string[]>([]);
  const [justClaimed, setJustClaimed] = useState<string | null>(null);
  const [tab, setTab]         = useState<'available' | 'locked' | 'history'>('available');

  useEffect(() => {
    setElo(getEloFromStorage());
    setLevel(getLevelFromStorage());
    setClaimed(getClaimedRewards().map(c => c.tierId));
  }, []);

  const unlocked = getUnlockedTiers(elo, level);
  const locked   = getLockedTiers(elo, level);
  const nextTier = getNextRewardTier(elo, level);

  const handleClaim = (tier: RewardTier, bonusXP: number) => {
    initAudio();
    const success = claimReward(tier.id, bonusXP);
    if (success) {
      setClaimed(prev => [...prev, tier.id]);
      setJustClaimed(tier.id);
      sfx.levelUp();
      setTimeout(() => setJustClaimed(null), 3000);
    }
  };

  const xpForTier = (tier: RewardTier): number => {
    const map: Record<string, number> = {
      bronze: 500, silver: 1500, gold: 3000, platinum: 6000, diamond: 15000,
      polyglot: 1000, academician: 2000, speedrunner: 800,
    };
    return map[tier.id] ?? 500;
  };

  // Progress toward next tier
  const eloProgress = nextTier ? Math.min(100, Math.round((elo / nextTier.minElo) * 100)) : 100;
  const lvlProgress = nextTier ? Math.min(100, Math.round((level / nextTier.minLevel) * 100)) : 100;

  return (
    <div className="min-h-dvh pt-16 pb-24 bg-midnight">
      <div className="fluid-container max-w-2xl py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile" className="glass p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} className="text-white/70" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">🏆 Reward Center</h1>
            <p className="text-white/40 text-sm">Claim badges and XP bonuses for your achievements</p>
          </div>
        </div>

        {/* Player status */}
        <div className="glass-dark rounded-2xl p-4 mb-5 border border-gold/20 flex items-center gap-4">
          <div className="text-3xl">⭐</div>
          <div className="flex-1">
            <div className="text-white font-bold">Level {level} · ELO {elo}</div>
            <div className="text-white/40 text-sm">{claimed.length} rewards claimed</div>
          </div>
          <div className="text-right">
            <div className="text-gold font-bold">{unlocked.filter(t => !claimed.includes(t.id)).length}</div>
            <div className="text-white/30 text-xs">available</div>
          </div>
        </div>

        {/* Next reward progress */}
        {nextTier && (
          <div className="glass rounded-2xl p-4 mb-5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">{nextTier.icon}</div>
              <div>
                <div className="text-white font-bold text-sm">Next: {nextTier.name}</div>
                <div className="text-white/40 text-xs">{nextTier.description}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/50">ELO {elo} / {nextTier.minElo}</span>
                  <span className="text-white/50">{eloProgress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${eloProgress}%`, background: nextTier.color }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/50">Level {level} / {nextTier.minLevel}</span>
                  <span className="text-white/50">{lvlProgress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${lvlProgress}%`, background: nextTier.color }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(['available', 'locked', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm capitalize transition-all ${
                tab === t ? 'bg-cobalt text-white' : 'glass text-white/50 hover:text-white'
              }`}>
              {t === 'available' ? `Available (${unlocked.length})` : t === 'locked' ? `Locked (${locked.length})` : 'History'}
            </button>
          ))}
        </div>

        {/* Just claimed toast */}
        <AnimatePresence>
          {justClaimed && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gold text-midnight px-6 py-3 rounded-2xl font-black shadow-2xl">
              🎉 Reward Claimed! XP bonus granted!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Available */}
        {tab === 'available' && (
          <div className="space-y-3">
            {unlocked.length === 0 && (
              <div className="text-center py-10 text-white/30">No rewards unlocked yet. Keep playing!</div>
            )}
            {unlocked.map(tier => {
              const isClaimed = claimed.includes(tier.id);
              const bonus = xpForTier(tier);
              return (
                <motion.div key={tier.id} layout
                  className="glass rounded-2xl p-4 border transition-all"
                  style={{ borderColor: isClaimed ? `${tier.color}44` : `${tier.color}66` }}>
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{tier.icon}</div>
                    <div className="flex-1">
                      <div className="font-black text-white">{tier.name}</div>
                      <div className="text-white/60 text-sm">{tier.description}</div>
                      <div className="text-sm mt-1" style={{ color: tier.color }}>
                        🎁 {tier.reward}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/30 text-xs">ELO {tier.minElo}+</span>
                        <span className="text-white/30 text-xs">·</span>
                        <span className="text-white/30 text-xs">Level {tier.minLevel}+</span>
                      </div>
                    </div>
                    {isClaimed ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle size={24} style={{ color: tier.color }} />
                        <span className="text-white/40 text-xs mt-1">Claimed</span>
                      </div>
                    ) : (
                      <button onClick={() => handleClaim(tier, bonus)}
                        className="px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                        style={{ background: `${tier.color}22`, border: `1px solid ${tier.color}66`, color: tier.color }}>
                        Claim<br />
                        <span className="text-xs">+{formatNumber(bonus)} XP</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Locked */}
        {tab === 'locked' && (
          <div className="space-y-3">
            {locked.map(tier => (
              <div key={tier.id} className="glass rounded-2xl p-4 border border-white/5 opacity-60">
                <div className="flex items-start gap-4">
                  <div className="text-4xl grayscale">{tier.icon}</div>
                  <div className="flex-1">
                    <div className="font-black text-white">{tier.name}</div>
                    <div className="text-white/50 text-sm">{tier.description}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                        ELO {tier.minElo} needed
                        {elo < tier.minElo && <span className="text-red-400 ml-1">(you: {elo})</span>}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                        Level {tier.minLevel} needed
                        {level < tier.minLevel && <span className="text-red-400 ml-1">(you: {level})</span>}
                      </span>
                    </div>
                  </div>
                  <Lock size={20} className="text-white/20 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        {tab === 'history' && (
          <div>
            {claimed.length === 0 ? (
              <div className="text-center py-10 text-white/30">No rewards claimed yet.</div>
            ) : (
              <div className="space-y-3">
                {REWARD_TIERS.filter(t => claimed.includes(t.id)).map(tier => (
                  <div key={tier.id} className="glass rounded-xl p-4 border border-white/10 flex items-center gap-3">
                    <div className="text-3xl">{tier.icon}</div>
                    <div className="flex-1">
                      <div className="text-white font-bold">{tier.name}</div>
                      <div className="text-white/40 text-xs">+{formatNumber(xpForTier(tier))} XP bonus</div>
                    </div>
                    <CheckCircle size={20} style={{ color: tier.color }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
