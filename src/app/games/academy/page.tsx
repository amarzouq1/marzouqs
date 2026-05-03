'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Brain, BookOpen, Zap, ChevronRight, ArrowLeft, Swords, BookOpenCheck } from 'lucide-react';
import GlassCard from '@/components/GlassCard';

const ACADEMY_GAMES = [
  {
    icon: Brain,
    href: '/games/academy/math',
    color: '#0047FF',
    glow: '#0047FF',
    title: 'Math Arena',
    desc: 'Sharpen analytical thinking through progressively challenging arithmetic, algebra, and speed-math battles.',
    tags: ['Arithmetic', 'Algebra', 'Square Roots', 'Speed Rounds'],
    difficulties: ['Easy', 'Medium', 'Hard', 'Elite'],
    badge: null,
  },
  {
    icon: Swords,
    href: '/games/academy/battle',
    color: '#FF4444',
    glow: '#FF4444',
    title: 'Math Battle',
    desc: 'Head-to-head math combat against AI. Answer faster to deal damage — last HP standing wins.',
    tags: ['PvP vs AI', 'HP System', 'Combos', '12 Rounds'],
    difficulties: ['Rookie', 'Apprentice', 'Expert', 'Master', 'Legend'],
    badge: 'NEW',
  },
  {
    icon: Zap,
    href: '/games/academy/physics',
    color: '#00AAFF',
    glow: '#00AAFF',
    title: 'Physics Lab',
    desc: 'Launch projectiles, simulate gravitational fields from the Moon to Jupiter, and master Newtonian mechanics.',
    tags: ['Projectile Motion', 'Gravity Fields', 'Vector Analysis', '5 Levels'],
    difficulties: ['Lunar', 'Earth', 'Wind Tunnel', 'Moving Targets', 'Jupiter'],
    badge: null,
  },
  {
    icon: BookOpen,
    href: '/games/academy/language',
    color: '#9B59B6',
    glow: '#9B59B6',
    title: 'Language Dojo',
    desc: 'Decode the architecture of language through elegant word-games testing vocabulary, spelling, and linguistic intuition.',
    tags: ['Word Scramble', 'Hangman', 'Anagram', '3 Categories'],
    difficulties: ['Science', 'Language', 'Elite'],
    badge: null,
  },
  {
    icon: BookOpenCheck,
    href: '/games/academy/reading',
    color: '#22c55e',
    glow: '#22c55e',
    title: 'Reading Challenge',
    desc: 'Deep reading comprehension. Read complex passages then answer 5 timed questions to test true understanding.',
    tags: ['Grade 6–12', 'Comprehension', 'Timed Quiz', '5 Passages'],
    difficulties: ['Science', 'Technology', 'History', 'Physics', 'Ethics'],
    badge: 'NEW',
  },
  {
    icon: Brain,
    href: '/games/academy/mathdog',
    color: '#F39C12',
    glow: '#F39C12',
    title: 'Math Dog & Logic Cat',
    desc: 'Grade 5-12 adaptive math and logic quizzes. Switch between Math Dog (arithmetic/algebra) and Logic Cat (patterns/sequences).',
    tags: ['Grade 5–12', 'Adaptive', 'Algebra', 'Logic'],
    difficulties: ['Gr 5', 'Gr 6', 'Gr 7', 'Gr 8', 'Gr 9', 'Gr 10', 'Gr 11', 'Gr 12'],
    badge: 'NEW',
  },
  {
    icon: BookOpen,
    href: '/games/academy/speak',
    color: '#E67E22',
    glow: '#E67E22',
    title: 'How to Speak',
    desc: '10 real-world scenarios — job interviews, conflict resolution, presentations. Choose the best response and learn communication skills.',
    tags: ['Social Skills', 'Real Scenarios', 'Feedback', '10 Situations'],
    difficulties: ['Job Interview', 'Friends', 'Conflict', 'Presentation', 'Online'],
    badge: 'NEW',
  },
  {
    icon: BookOpen,
    href: '/games/academy/signs',
    color: '#7F8C8D',
    glow: '#95A5A6',
    title: 'Sign Language ASL',
    desc: 'Learn American Sign Language through interactive sign recognition, fingerspelling practice, and common phrase identification.',
    tags: ['ASL', 'Fingerspelling', 'Signs', 'Phrases'],
    difficulties: ['Beginner', 'Intermediate', 'Advanced'],
    badge: 'NEW',
  },
  {
    icon: BookOpen,
    href: '/games/academy/arabic',
    color: '#00AA44',
    glow: '#00AA44',
    title: 'Arabic العربية',
    desc: 'Learn Arabic script, vocabulary, numbers, and family words through study cards and interactive quizzes.',
    tags: ['Right-to-Left', 'Script', 'Vocabulary', 'Phrases'],
    difficulties: ['Greetings', 'Numbers', 'Family'],
    badge: 'NEW',
  },
  {
    icon: BookOpen,
    href: '/games/academy/russian',
    color: '#CC0000',
    glow: '#CC0000',
    title: 'Russian Русский',
    desc: 'Master the Cyrillic alphabet, key Russian phrases, and vocabulary through interactive lessons and quizzes.',
    tags: ['Cyrillic', 'Alphabet', 'Vocabulary', 'Phrases'],
    difficulties: ['Alphabet', 'Greetings', 'Numbers'],
    badge: 'NEW',
  },
  {
    icon: BookOpen,
    href: '/games/academy/chinese',
    color: '#FF4444',
    glow: '#FF4444',
    title: 'Chinese 普通话',
    desc: 'Learn Mandarin tones, characters, pinyin, and key phrases. Understand why tone matters in Chinese!',
    tags: ['Tones', 'Pinyin', 'Characters', 'Phrases'],
    difficulties: ['Tones', 'Greetings', 'Numbers'],
    badge: 'NEW',
  },
];

const stagger = { animate: { transition: { staggerChildren: 0.1 } } };
const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

export default function AcademyPage() {
  return (
    <div className="min-h-dvh pt-16 md:pt-20 pb-24">
      <div className="fluid-container py-10">
        {/* Back */}
        <motion.div {...fadeUp} className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
            <ArrowLeft size={14} /> Back to Hub
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 glass-cobalt px-4 py-2 rounded-full text-sm font-medium text-cobalt-light mb-6">
            <BookOpen size={13} />
            The Academy
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Forge Your{' '}
            <span className="text-cobalt-gradient">Intellect</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Three disciplines. Infinite mastery. Every session sharpens a different edge of your cognitive arsenal.
          </p>
        </motion.div>

        {/* Game Cards */}
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {ACADEMY_GAMES.map((game) => {
            const Icon = game.icon;
            return (
              <motion.div key={game.href} variants={fadeUp}>
                <Link href={game.href} className="block group">
                  <GlassCard hover glow className="h-full p-6 relative overflow-hidden">
                    {/* NEW badge */}
                    {game.badge && (
                      <div className="absolute top-4 right-4 px-2 py-0.5 rounded-lg text-xs font-bold bg-cobalt/20 text-cobalt-bright border border-cobalt/40">
                        {game.badge}
                      </div>
                    )}
                    {/* Icon */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                      style={{ background: `${game.color}22`, color: game.color, boxShadow: `0 0 20px ${game.glow}33` }}
                    >
                      <Icon size={26} />
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">{game.title}</h2>
                    <p className="text-white/50 text-sm leading-relaxed mb-4">{game.desc}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      {game.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: `${game.color}18`, color: game.color }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Difficulties */}
                    <div className="mb-5">
                      <div className="text-xs text-white/30 mb-2">Difficulty Tiers</div>
                      <div className="flex gap-1.5">
                        {game.difficulties.map((d, i) => (
                          <div
                            key={d}
                            className="h-1.5 flex-1 rounded-full"
                            style={{
                              background: `${game.color}`,
                              opacity: 0.25 + (i / game.difficulties.length) * 0.75,
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-white/30">
                        <span>{game.difficulties[0]}</span>
                        <span>{game.difficulties[game.difficulties.length - 1]}</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div
                      className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all"
                      style={{ color: game.color }}
                    >
                      Enter Arena <ChevronRight size={15} />
                    </div>

                    {/* Hover glow overlay */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
                      style={{ background: `radial-gradient(ellipse at 50% 0%, ${game.color}12, transparent 70%)` }}
                    />
                  </GlassCard>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <GlassCard variant="cobalt" className="p-8 max-w-lg mx-auto">
            <div className="text-2xl mb-2">🎓</div>
            <h3 className="text-xl font-bold text-white mb-2">Track Your Progress</h3>
            <p className="text-white/50 text-sm mb-5">
              Every score is saved locally. Visit your profile to see your best performances and achievements across all disciplines.
            </p>
            <Link href="/profile" className="btn-cobalt">View Profile →</Link>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
