'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Crown, BookOpen, Zap, ChevronRight, Trophy, Users,
  Star, ArrowRight, Flame, Brain, Globe, Shield,
} from 'lucide-react';
import GlassCard from '@/components/GlassCard';

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const GAMES = [
  {
    tier: 'The Grandmaster Suite',
    icon: Crown,
    href: '/games/chess',
    color: '#FFD700',
    colorClass: 'text-yellow-400',
    bgClass: 'bg-yellow-400/10',
    borderClass: 'border-yellow-400/20',
    title: 'Chess Arena',
    desc: 'Enter the sanctum of strategic mastery. Engage AI opponents calibrated to your ELO, study moves with built-in analysis, and forge your legacy on the board.',
    badge: 'ELO Tracked',
    tags: ['AI Opponent', 'Move Analysis', 'ELO Rating', 'Full Rules'],
    stats: { label: 'Games Played', value: '1.2M+' },
    size: 'large',
  },
  {
    tier: 'The Academy',
    icon: Brain,
    href: '/games/academy/math',
    color: '#00AAFF',
    colorClass: 'text-cobalt-bright',
    bgClass: 'bg-cobalt-bright/10',
    borderClass: 'border-cobalt-bright/20',
    title: 'Math Arena',
    desc: 'Sharpen your analytical edge through progressively challenging arithmetic and algebra battles. Track your cognitive ascent.',
    badge: 'Progress Tracked',
    tags: ['Arithmetic', 'Algebra', 'Speed Rounds'],
    stats: { label: 'Problems Solved', value: '840K+' },
    size: 'small',
  },
  {
    tier: 'The Academy',
    icon: BookOpen,
    href: '/games/academy/physics',
    color: '#00AAFF',
    colorClass: 'text-cobalt-bright',
    bgClass: 'bg-cobalt-bright/10',
    borderClass: 'border-cobalt-bright/20',
    title: 'Physics Lab',
    desc: 'Launch projectiles, simulate gravity, and master Newtonian mechanics through interactive challenges.',
    badge: 'Simulation',
    tags: ['Projectile Motion', 'Gravity', 'Vectors'],
    stats: { label: 'Levels', value: '24' },
    size: 'small',
  },
  {
    tier: 'The Academy',
    icon: Globe,
    href: '/games/academy/language',
    color: '#00AAFF',
    colorClass: 'text-cobalt-bright',
    bgClass: 'bg-cobalt-bright/10',
    borderClass: 'border-cobalt-bright/20',
    title: 'Language Dojo',
    desc: "Decode the architecture of language through elegant word-games that test vocabulary, spelling, and linguistic intuition.",
    badge: 'Vocabulary',
    tags: ['Word Scramble', 'Hangman', 'Anagrams'],
    stats: { label: 'Word Sets', value: '500+' },
    size: 'small',
  },
  {
    tier: 'Legendary Icons',
    icon: Zap,
    href: '/games/sonic',
    color: '#0047FF',
    colorClass: 'text-cobalt-light',
    bgClass: 'bg-cobalt/10',
    borderClass: 'border-cobalt/20',
    title: 'Velocity Runner',
    desc: 'Pure momentum physics. Build speed, master loops, execute the perfect spin-dash, and shatter records across 5 handcrafted zones.',
    badge: '60 FPS',
    tags: ['Momentum Physics', 'Speed Boost', 'Loop Physics', '5 Zones'],
    stats: { label: 'Top Speed', value: 'Mach 1' },
    size: 'medium',
  },
  {
    tier: 'Legendary Icons',
    icon: Shield,
    href: '/games/platformer',
    color: '#0047FF',
    colorClass: 'text-cobalt-light',
    bgClass: 'bg-cobalt/10',
    borderClass: 'border-cobalt/20',
    title: 'Apex Platformer',
    desc: "Precision is king. Navigate treacherous stages with pixel-perfect controls, stomp enemies, collect coins, and find every hidden path.",
    badge: '60 FPS',
    tags: ['Precision Controls', 'Enemy AI', 'Hidden Secrets', '6 Worlds'],
    stats: { label: 'Worlds', value: '6' },
    size: 'medium',
  },
  {
    tier: 'Legendary Icons',
    icon: Zap,
    href: '/games/racing',
    color: '#FF4444',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/20',
    title: 'Motorcycle Racing',
    desc: 'Drift, boost, and lean through neon-lit circuits and desert tracks. Physics-accurate momentum, nitro system, and real-time AI opponent.',
    badge: 'NEW',
    tags: ['Drift System', 'Nitro Boost', 'AI Race', '2 Tracks'],
    stats: { label: 'Max Speed', value: '870 KPH' },
    size: 'medium',
  },
  {
    tier: 'The Academy',
    icon: BookOpen,
    href: '/games/academy/reading',
    color: '#22c55e',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    title: 'Reading Challenge',
    desc: 'Read complex passages across science, history, and technology — then answer comprehension questions under time pressure.',
    badge: 'NEW',
    tags: ['Grade 6–12', 'Comprehension', '5 Passages', 'Timed'],
    stats: { label: 'Passages', value: '5' },
    size: 'small',
  },
  {
    tier: 'Arcade',
    icon: Zap,
    href: '/games/train',
    color: '#8B5CF6',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/20',
    title: 'Train Surf Runner',
    desc: 'Endless lane-based runner on top of a speeding train. Dodge barriers, collect coins, and survive as speed keeps climbing.',
    badge: 'NEW',
    tags: ['Endless Runner', 'Lane Switch', 'Coins', '4 Obstacles'],
    stats: { label: 'Max Speed', value: '900 px/s' },
    size: 'small',
  },
  {
    tier: 'The Academy',
    icon: Brain,
    href: '/games/academy/mathdog',
    color: '#F39C12',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
    title: 'Math Dog & Logic Cat',
    desc: 'Grade 5-12 adaptive math and logic quizzes. Two characters, two modes — arithmetic and pattern recognition.',
    badge: 'NEW',
    tags: ['Grade 5–12', 'Adaptive', 'Algebra', 'Logic'],
    stats: { label: 'Grade Levels', value: '8' },
    size: 'small',
  },
  {
    tier: 'The Academy',
    icon: Globe,
    href: '/games/academy/arabic',
    color: '#00AA44',
    colorClass: 'text-green-400',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/20',
    title: 'World Languages',
    desc: 'Learn Arabic, Russian, and Chinese Mandarin through vocabulary, script study, and interactive quizzes.',
    badge: 'NEW',
    tags: ['Arabic', 'Russian', 'Chinese', '3 Languages'],
    stats: { label: 'Languages', value: '3' },
    size: 'small',
  },
  {
    tier: 'The Academy',
    icon: BookOpen,
    href: '/games/academy/signs',
    color: '#7F8C8D',
    colorClass: 'text-slate-400',
    bgClass: 'bg-slate-500/10',
    borderClass: 'border-slate-500/20',
    title: 'Sign Language ASL',
    desc: 'Learn American Sign Language — sign recognition, fingerspelling, and common phrases in 3 difficulty levels.',
    badge: 'NEW',
    tags: ['ASL', 'Fingerspelling', '40 Signs', 'Phrases'],
    stats: { label: 'Signs', value: '40+' },
    size: 'small',
  },
];

const STATS = [
  { icon: Trophy, label: 'Games Available', value: '16' },
  { icon: Users, label: 'Active Players', value: '12K+' },
  { icon: Star, label: 'Average Rating', value: '4.9★' },
  { icon: Flame, label: 'Daily Matches', value: '3.8K' },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative pt-28 md:pt-36 pb-20 overflow-hidden mesh-bg">
        {/* Animated floating orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cobalt/10 rounded-full blur-[100px] pointer-events-none animate-orb-1" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-cobalt-bright/10 rounded-full blur-[70px] pointer-events-none animate-orb-2" />
        <div className="absolute bottom-10 left-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-[90px] pointer-events-none animate-orb-3" />

        <div className="fluid-container text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 glass-cobalt px-4 py-2 rounded-full text-sm font-medium text-cobalt-light mb-8">
              <Flame size={13} />
              <span>2026 Season is Live</span>
            </div>

            {/* Hero headline */}
            <h1
              className="font-bold leading-none tracking-tight mb-6"
              style={{ fontSize: 'var(--text-hero)' }}
            >
              <span className="text-cobalt-gradient">Marzouq&apos;s:</span>
              <br />
              <span className="text-white">Where Precision</span>
              <br />
              <span className="text-white/60">Meets Play.</span>
            </h1>

            <p
              className="max-w-2xl mx-auto text-white/50 mb-10 leading-relaxed"
              style={{ fontSize: 'var(--text-lg)' }}
            >
              A luxury gaming portal engineered for those who pursue mastery.
              Chess arenas. Cognitive academies. High-velocity platformers.
              All running at console-grade performance in your browser.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/games/chess" className="btn-cobalt">
                Enter the Arena
                <ArrowRight size={16} />
              </Link>
              <Link href="/profile" className="btn-glass">
                My Profile
              </Link>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {STATS.map(({ icon: Icon, label, value }) => (
              <motion.div key={label} variants={fadeUp}>
                <GlassCard className="p-4 text-center group hover:border-cobalt/20 transition-colors">
                  <Icon size={20} className="text-cobalt-light mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
                  <div className="text-xs text-white/40">{label}</div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Bento Game Grid ──────────────────────────────── */}
      <section className="fluid-container pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h2 className="text-3xl font-bold text-white mb-2">The Ecosystem</h2>
          <p className="text-white/40">
            16 elite game experiences — arcade, chess, academy, languages.
          </p>
        </motion.div>

        {/* Bento CSS Grid */}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(280px, 30vw, 400px), 1fr))',
            gridAutoRows: 'auto',
          }}
        >
          {GAMES.map((game, i) => {
            const Icon = game.icon;
            return (
              <motion.div
                key={game.href}
                variants={fadeUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.06 }}
                className={game.size === 'large' ? 'md:col-span-2 md:row-span-2' : ''}
              >
                <Link href={game.href} className="block h-full group">
                  <GlassCard
                    hover
                    className={`h-full p-6 border ${game.borderClass} card-3d card-3d-glow relative overflow-hidden`}
                    style={{ '--game-color': game.color } as React.CSSProperties}
                  >
                    {/* Background radial glow */}
                    <div
                      className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none group-hover:opacity-40 transition-opacity duration-500"
                      style={{ background: game.color }}
                    />
                    {/* Tier label */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`text-xs font-semibold uppercase tracking-widest ${game.colorClass}`}
                      >
                        {game.tier}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${game.bgClass} ${game.colorClass} font-medium`}
                      >
                        {game.badge}
                      </span>
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-2xl ${game.bgClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                      style={{ boxShadow: `0 0 28px ${game.color}35` }}
                    >
                      <Icon size={22} style={{ color: game.color }} />
                    </div>

                    {/* Title */}
                    <h3
                      className="font-bold text-white mb-2 group-hover:text-cobalt-light transition-colors"
                      style={{
                        fontSize: game.size === 'large' ? 'var(--text-2xl)' : 'var(--text-xl)',
                      }}
                    >
                      {game.title}
                    </h3>

                    {/* Description */}
                    <p
                      className="text-white/50 mb-4 leading-relaxed"
                      style={{ fontSize: 'var(--text-sm)' }}
                    >
                      {game.desc}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {game.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-lg bg-white/5 text-white/40 border border-white/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                      <div className="text-xs text-white/30">
                        <span className="font-bold text-white/70 mr-1">{game.stats.value}</span>
                        {game.stats.label}
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-white/30 group-hover:text-cobalt-light group-hover:translate-x-1 transition-all duration-200"
                      />
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Philosophy Section ───────────────────────────── */}
      <section className="fluid-container pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard variant="cobalt" className="p-8 md:p-12 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-cobalt-gradient opacity-5 pointer-events-none" />
            <div className="relative z-10">
              <Crown size={32} className="text-cobalt-light mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Gaming Elevated to an Art Form
              </h2>
              <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed mb-8">
                Every game in the Center is architected for those who see gaming not as escape,
                but as a proving ground for the mind. Precision engineering meets luxury design
                in a portal that respects your intelligence.
              </p>
              <Link href="/profile" className="btn-cobalt mx-auto inline-flex">
                Claim Your Ranking
                <ArrowRight size={16} />
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </section>
    </div>
  );
}
