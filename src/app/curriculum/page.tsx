'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Brain, Zap, Star, Trophy, Lock } from 'lucide-react';
import Link from 'next/link';

interface GradePlan {
  grade: number;
  label: string;
  ageRange: string;
  focus: string;
  subjects: { name: string; icon: string; games: { title: string; href: string; color: string }[] }[];
  milestone: string;
}

const CURRICULUM: GradePlan[] = [
  {
    grade: 5, label: 'Grade 5', ageRange: '10–11', focus: 'Foundations & Exploration',
    subjects: [
      { name: 'Mathematics', icon: '🔢', games: [
        { title: 'Math Arena', href: '/games/academy/math', color: '#0047FF' },
        { title: 'Math Dog (Grade 5)', href: '/games/academy/mathdog?grade=5', color: '#00AA44' },
      ]},
      { name: 'Science', icon: '🔬', games: [
        { title: 'Physics Lab', href: '/games/academy/physics', color: '#FF6600' },
      ]},
      { name: 'Language Arts', icon: '📖', games: [
        { title: 'Reading Challenge', href: '/games/academy/reading', color: '#9B59B6' },
      ]},
      { name: 'Communication', icon: '💬', games: [
        { title: 'How to Speak', href: '/games/academy/speak', color: '#E67E22' },
      ]},
    ],
    milestone: 'Master basic arithmetic, fractions, and reading comprehension.',
  },
  {
    grade: 6, label: 'Grade 6', ageRange: '11–12', focus: 'Building Core Skills',
    subjects: [
      { name: 'Mathematics', icon: '🔢', games: [
        { title: 'Math Arena', href: '/games/academy/math', color: '#0047FF' },
        { title: 'Math Dog (Grade 6)', href: '/games/academy/mathdog?grade=6', color: '#00AA44' },
        { title: 'Math Battle', href: '/games/academy/battle', color: '#FF4444' },
      ]},
      { name: 'Science', icon: '🔬', games: [
        { title: 'Physics Lab', href: '/games/academy/physics', color: '#FF6600' },
      ]},
      { name: 'Languages', icon: '🌍', games: [
        { title: 'Language Dojo', href: '/games/academy/language', color: '#E74C3C' },
        { title: 'Arabic Basics', href: '/games/academy/arabic', color: '#00AA44' },
      ]},
    ],
    milestone: 'Introduction to ratios, percentages, and pre-algebra.',
  },
  {
    grade: 7, label: 'Grade 7', ageRange: '12–13', focus: 'Abstract Thinking',
    subjects: [
      { name: 'Mathematics', icon: '🔢', games: [
        { title: 'Math Dog (Grade 7)', href: '/games/academy/mathdog?grade=7', color: '#00AA44' },
        { title: 'Math Battle', href: '/games/academy/battle', color: '#FF4444' },
      ]},
      { name: 'Science', icon: '🔬', games: [
        { title: 'Physics Lab', href: '/games/academy/physics', color: '#FF6600' },
      ]},
      { name: 'Critical Thinking', icon: '🧩', games: [
        { title: 'Chess', href: '/games/chess', color: '#FFD700' },
        { title: 'How to Speak', href: '/games/academy/speak', color: '#E67E22' },
      ]},
      { name: 'Languages', icon: '🌍', games: [
        { title: 'Russian Basics', href: '/games/academy/russian', color: '#CC0000' },
        { title: 'Sign Language', href: '/games/academy/signs', color: '#7F8C8D' },
      ]},
    ],
    milestone: 'Pre-algebra, introduction to variables, and logical reasoning.',
  },
  {
    grade: 8, label: 'Grade 8', ageRange: '13–14', focus: 'Algebra & Analysis',
    subjects: [
      { name: 'Mathematics', icon: '🔢', games: [
        { title: 'Math Dog (Grade 8)', href: '/games/academy/mathdog?grade=8', color: '#00AA44' },
        { title: 'Math Battle', href: '/games/academy/battle', color: '#FF4444' },
      ]},
      { name: 'Physics', icon: '⚛️', games: [
        { title: 'Physics Lab', href: '/games/academy/physics', color: '#FF6600' },
      ]},
      { name: 'Logic', icon: '🧩', games: [
        { title: 'Chess', href: '/games/chess', color: '#FFD700' },
        { title: 'Math Dog — Logic Cat', href: '/games/academy/mathdog', color: '#00AA44' },
      ]},
    ],
    milestone: 'Algebra I, linear equations, and systematic thinking.',
  },
  {
    grade: 9, label: 'Grade 9', ageRange: '14–15', focus: 'Advanced Mathematics',
    subjects: [
      { name: 'Mathematics', icon: '🔢', games: [
        { title: 'Math Dog (Grade 9)', href: '/games/academy/mathdog?grade=9', color: '#00AA44' },
        { title: 'Math Arena', href: '/games/academy/math', color: '#0047FF' },
      ]},
      { name: 'Sciences', icon: '🔬', games: [
        { title: 'Physics Lab', href: '/games/academy/physics', color: '#FF6600' },
      ]},
      { name: 'World Languages', icon: '🌍', games: [
        { title: 'Chinese Mandarin', href: '/games/academy/chinese', color: '#FF4444' },
        { title: 'Language Dojo', href: '/games/academy/language', color: '#E74C3C' },
      ]},
    ],
    milestone: 'Algebra II, functions, and trigonometry basics.',
  },
  {
    grade: 10, label: 'Grade 10', ageRange: '15–16', focus: 'Geometry & Functions',
    subjects: [
      { name: 'Mathematics', icon: '🔢', games: [
        { title: 'Math Dog (Grade 10)', href: '/games/academy/mathdog?grade=10', color: '#00AA44' },
        { title: 'Math Battle', href: '/games/academy/battle', color: '#FF4444' },
      ]},
      { name: 'Physics', icon: '⚛️', games: [
        { title: 'Physics Lab', href: '/games/academy/physics', color: '#FF6600' },
      ]},
      { name: 'Communication', icon: '💬', games: [
        { title: 'How to Speak', href: '/games/academy/speak', color: '#E67E22' },
        { title: 'Reading Challenge', href: '/games/academy/reading', color: '#9B59B6' },
      ]},
    ],
    milestone: 'Geometry, trigonometry, and college-prep critical thinking.',
  },
  {
    grade: 11, label: 'Grade 11', ageRange: '16–17', focus: 'Pre-Calculus',
    subjects: [
      { name: 'Advanced Math', icon: '📐', games: [
        { title: 'Math Dog (Grade 11)', href: '/games/academy/mathdog?grade=11', color: '#00AA44' },
        { title: 'Math Arena', href: '/games/academy/math', color: '#0047FF' },
      ]},
      { name: 'Physics', icon: '⚛️', games: [
        { title: 'Physics Lab', href: '/games/academy/physics', color: '#FF6600' },
      ]},
      { name: 'Strategy', icon: '♟️', games: [
        { title: 'Chess — Advanced', href: '/games/chess', color: '#FFD700' },
      ]},
    ],
    milestone: 'Pre-calculus, sequences, and analytical reasoning.',
  },
  {
    grade: 12, label: 'Grade 12', ageRange: '17–18', focus: 'Calculus & College Prep',
    subjects: [
      { name: 'Calculus', icon: '∫', games: [
        { title: 'Math Dog (Grade 12)', href: '/games/academy/mathdog?grade=12', color: '#00AA44' },
        { title: 'Math Battle', href: '/games/academy/battle', color: '#FF4444' },
      ]},
      { name: 'Sciences', icon: '🔬', games: [
        { title: 'Physics Lab', href: '/games/academy/physics', color: '#FF6600' },
      ]},
      { name: 'All Skills', icon: '🎯', games: [
        { title: 'Chess', href: '/games/chess', color: '#FFD700' },
        { title: 'How to Speak', href: '/games/academy/speak', color: '#E67E22' },
        { title: 'Sign Language', href: '/games/academy/signs', color: '#7F8C8D' },
      ]},
    ],
    milestone: 'Calculus, proof writing, and college application readiness.',
  },
];

const GRADE_COLORS = ['#0047FF', '#00AA44', '#FF6600', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12', '#8E44AD'];

export default function CurriculumPage() {
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  const plan = CURRICULUM.find(c => c.grade === selectedGrade);

  return (
    <div className="min-h-dvh pt-16 pb-24 bg-midnight">
      <div className="fluid-container max-w-4xl py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="glass p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} className="text-white/70" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">📚 Grade 5–12 Curriculum</h1>
            <p className="text-white/40 text-sm">Your learning roadmap — all subjects, all grades</p>
          </div>
        </div>

        {/* Grade selector */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-8">
          {CURRICULUM.map((c, i) => (
            <button key={c.grade} onClick={() => setSelectedGrade(selectedGrade === c.grade ? null : c.grade)}
              className="relative p-3 rounded-2xl text-center transition-all border"
              style={{
                background: selectedGrade === c.grade ? `${GRADE_COLORS[i]}22` : 'rgba(255,255,255,0.03)',
                borderColor: selectedGrade === c.grade ? `${GRADE_COLORS[i]}66` : 'rgba(255,255,255,0.08)',
                transform: selectedGrade === c.grade ? 'scale(1.05)' : 'scale(1)',
              }}>
              <div className="text-xl font-black text-white">{c.grade}</div>
              <div className="text-white/40 text-xs">Grade</div>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Selected grade detail */}
          {plan && selectedGrade && (
            <motion.div key={`grade-${selectedGrade}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass-dark rounded-2xl p-5 mb-6 border border-white/10">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-white">{plan.label}</h2>
                    <div className="text-white/50 text-sm">Ages {plan.ageRange} · {plan.focus}</div>
                  </div>
                  <div className="text-3xl">{selectedGrade <= 6 ? '🌱' : selectedGrade <= 9 ? '🌿' : '🌳'}</div>
                </div>
                <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-gold font-bold mb-1">🏆 Grade Milestone</div>
                  <p className="text-white/70 text-sm">{plan.milestone}</p>
                </div>
              </div>

              <div className="space-y-4">
                {plan.subjects.map((subject, si) => (
                  <motion.div key={si} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: si * 0.1 }}
                    className="glass rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{subject.icon}</span>
                      <h3 className="text-white font-bold">{subject.name}</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {subject.games.map((game, gi) => (
                        <Link key={gi} href={game.href}
                          className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02]"
                          style={{ background: `${game.color}11`, borderColor: `${game.color}33` }}>
                          <div className="w-2 h-2 rounded-full" style={{ background: game.color }} />
                          <span className="text-white text-sm font-semibold flex-1">{game.title}</span>
                          <span className="text-white/30 text-xs">→</span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* No selection — overview */}
          {!selectedGrade && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center py-6 mb-6">
                <p className="text-white/40">Select a grade to see your curriculum roadmap</p>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Grades Covered', value: '8', icon: '📚' },
                  { label: 'Subjects', value: '6', icon: '🎯' },
                  { label: 'Total Games', value: '16', icon: '🎮' },
                  { label: 'Languages', value: '4', icon: '🌍' },
                ].map((stat, i) => (
                  <div key={i} className="glass rounded-2xl p-4 text-center border border-white/10">
                    <div className="text-3xl mb-2">{stat.icon}</div>
                    <div className="text-2xl font-black text-white">{stat.value}</div>
                    <div className="text-white/40 text-xs">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* All grades overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CURRICULUM.map((c, i) => (
                  <button key={c.grade} onClick={() => setSelectedGrade(c.grade)}
                    className="glass rounded-2xl p-4 border border-white/10 text-left hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm"
                        style={{ background: GRADE_COLORS[i] }}>
                        {c.grade}
                      </div>
                      <div>
                        <div className="text-white font-bold">{c.label}</div>
                        <div className="text-white/40 text-xs">Ages {c.ageRange}</div>
                      </div>
                    </div>
                    <div className="text-white/60 text-sm">{c.focus}</div>
                    <div className="flex gap-1 mt-2">
                      {c.subjects.map((s, si) => (
                        <span key={si} className="text-sm">{s.icon}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
