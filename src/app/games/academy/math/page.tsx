'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronLeft, Trophy, Flame, Clock, Star, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import Link from 'next/link';
import { saveLocalScore, formatNumber } from '@/lib/utils';

type Mode = 'menu' | 'playing' | 'gameover';
type Difficulty = 'easy' | 'medium' | 'hard' | 'elite';
type QuestionType = 'add' | 'sub' | 'mul' | 'div' | 'power' | 'sqrt' | 'algebra';

interface Question {
  text: string;
  answer: number;
  choices: number[];
  type: QuestionType;
  points: number;
}

const DIFF_CONFIG: Record<Difficulty, {
  timeLimit: number; types: QuestionType[]; maxNum: number; pointsBase: number;
}> = {
  easy:   { timeLimit: 15, types: ['add','sub'],                         maxNum: 20,  pointsBase: 100 },
  medium: { timeLimit: 12, types: ['add','sub','mul'],                   maxNum: 50,  pointsBase: 150 },
  hard:   { timeLimit: 10, types: ['add','sub','mul','div','power'],      maxNum: 100, pointsBase: 200 },
  elite:  { timeLimit: 8,  types: ['mul','div','power','sqrt','algebra'], maxNum: 200, pointsBase: 300 },
};

function rnd(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateQuestion(difficulty: Difficulty): Question {
  const { types, maxNum, pointsBase } = DIFF_CONFIG[difficulty];
  const type = types[Math.floor(Math.random() * types.length)];
  let text = '';
  let answer = 0;

  switch (type) {
    case 'add': {
      const a = rnd(1, maxNum); const b = rnd(1, maxNum);
      text = `${a} + ${b} = ?`; answer = a + b; break;
    }
    case 'sub': {
      const a = rnd(1, maxNum); const b = rnd(1, a);
      text = `${a} − ${b} = ?`; answer = a - b; break;
    }
    case 'mul': {
      const a = rnd(2, Math.min(maxNum, 20)); const b = rnd(2, Math.min(maxNum, 20));
      text = `${a} × ${b} = ?`; answer = a * b; break;
    }
    case 'div': {
      const b = rnd(2, 12); const a = b * rnd(1, 12);
      text = `${a} ÷ ${b} = ?`; answer = a / b; break;
    }
    case 'power': {
      const base = rnd(2, 10); const exp = rnd(2, 3);
      text = `${base}^${exp} = ?`; answer = Math.pow(base, exp); break;
    }
    case 'sqrt': {
      const sq = rnd(1, 15); answer = sq;
      text = `√${sq * sq} = ?`; break;
    }
    case 'algebra': {
      const x = rnd(1, 20); const m = rnd(2, 10); const c = rnd(0, 20);
      text = `${m}x + ${c} = ${m * x + c}, x = ?`; answer = x; break;
    }
  }

  // Generate 3 wrong choices
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const offset = rnd(-Math.max(5, Math.abs(Math.round(answer * 0.3))), Math.max(5, Math.abs(Math.round(answer * 0.3))));
    const w = answer + offset;
    if (w !== answer && w >= 0) wrongs.add(w);
  }
  const choices = shuffle([answer, ...Array.from(wrongs)]);

  return { text, answer, choices, type, points: pointsBase };
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function MathArena() {
  const [mode, setMode] = useState<Mode>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [question, setQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(12);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [questionNum, setQuestionNum] = useState(0);
  const [totalQuestions] = useState(15);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback(() => {
    setMode('playing');
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setQuestionNum(1);
    setFeedback(null);
    setSelectedChoice(null);
    setQuestion(generateQuestion(difficulty));
    setTimeLeft(DIFF_CONFIG[difficulty].timeLimit);
  }, [difficulty]);

  const nextQuestion = useCallback(() => {
    if (questionNum >= totalQuestions) {
      setMode('gameover');
      saveLocalScore('math', score);
      return;
    }
    setQuestionNum((q) => q + 1);
    setQuestion(generateQuestion(difficulty));
    setTimeLeft(DIFF_CONFIG[difficulty].timeLimit);
    setFeedback(null);
    setSelectedChoice(null);
  }, [questionNum, totalQuestions, difficulty, score]);

  // Timer
  useEffect(() => {
    if (mode !== 'playing' || feedback !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setFeedback('wrong');
          setStreak(0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode, question, feedback]);

  // Auto-advance after feedback
  useEffect(() => {
    if (feedback !== null) {
      const t = setTimeout(nextQuestion, 1200);
      return () => clearTimeout(t);
    }
  }, [feedback, nextQuestion]);

  const handleAnswer = (choice: number) => {
    if (feedback !== null || !question) return;
    setSelectedChoice(choice);

    if (choice === question.answer) {
      const bonus = Math.ceil(timeLeft / DIFF_CONFIG[difficulty].timeLimit * 50);
      const streakBonus = streak >= 3 ? Math.ceil(streak * 10) : 0;
      setScore((s) => s + question.points + bonus + streakBonus);
      setStreak((s) => {
        const ns = s + 1;
        setMaxStreak((m) => Math.max(m, ns));
        return ns;
      });
      setFeedback('correct');
    } else {
      setStreak(0);
      setFeedback('wrong');
    }
  };

  const timePercent = question ? (timeLeft / DIFF_CONFIG[difficulty].timeLimit) * 100 : 100;
  const timerColor = timePercent > 50 ? 'bg-cobalt-bright' : timePercent > 25 ? 'bg-yellow-400' : 'bg-red-500';

  return (
    <div className="min-h-dvh pt-16 md:pt-20 pb-24">
      <div className="fluid-container py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="p-2 glass rounded-xl text-white/50 hover:text-white transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-cobalt-bright" />
              <h1 className="text-xl font-bold text-white">Math Arena</h1>
              <span className="text-xs text-white/30">The Academy</span>
            </div>
            <p className="text-xs text-white/40 mt-0.5">Sharpen your analytical edge.</p>
          </div>
        </div>

        {/* MENU */}
        {mode === 'menu' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-8 text-center mb-6">
              <div className="text-5xl mb-4">🧮</div>
              <h2 className="text-2xl font-bold text-white mb-2">Math Arena</h2>
              <p className="text-white/50 text-sm max-w-md mx-auto">
                15 questions. Timed. Progressive difficulty. Streak bonuses multiply your score.
                Prove your analytical mastery.
              </p>
            </GlassCard>

            <GlassCard className="p-6 mb-4">
              <h3 className="text-sm font-semibold text-white mb-3">Select Difficulty</h3>
              <div className="grid grid-cols-2 gap-3">
                {(['easy','medium','hard','elite'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      difficulty === d
                        ? 'bg-cobalt/20 border-cobalt/40 text-cobalt-light'
                        : 'glass border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold capitalize mb-1">{d}</div>
                    <div className="text-xs opacity-60">
                      {DIFF_CONFIG[d].timeLimit}s · {DIFF_CONFIG[d].types.join(', ')}
                    </div>
                  </button>
                ))}
              </div>
            </GlassCard>

            <button onClick={startGame} className="btn-cobalt w-full py-4 text-base">
              Start Challenge
            </button>
          </motion.div>
        )}

        {/* PLAYING */}
        {mode === 'playing' && question && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* HUD */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="glass px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-sm">
                  <Trophy size={13} className="text-yellow-400" />
                  <span className="font-bold text-white">{formatNumber(score)}</span>
                </div>
                {streak >= 3 && (
                  <div className="glass px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-sm">
                    <Flame size={13} className="text-orange-400" />
                    <span className="font-bold text-orange-400">{streak}x</span>
                  </div>
                )}
              </div>
              <div className="glass px-3 py-1.5 rounded-xl text-sm text-white/60">
                {questionNum} / {totalQuestions}
              </div>
            </div>

            {/* Timer bar */}
            <div className="progress-bar mb-6">
              <motion.div
                className={`h-full rounded-full transition-colors ${timerColor}`}
                animate={{ width: `${timePercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Question */}
            <GlassCard className={`p-8 text-center mb-6 transition-all duration-200 ${
              feedback === 'correct' ? 'border-green-400/40 shadow-[0_0_20px_rgba(74,222,128,0.2)]' :
              feedback === 'wrong' ? 'border-red-400/40 shadow-[0_0_20px_rgba(248,113,113,0.2)]' :
              'border-cobalt/20'
            }`}>
              <div className="text-xs text-cobalt-light mb-3 font-medium uppercase tracking-wider">
                <Clock size={12} className="inline mr-1" />
                {timeLeft}s remaining
              </div>
              <div
                className="font-bold text-white mb-2"
                style={{ fontSize: 'var(--text-3xl)' }}
              >
                {question.text}
              </div>
              <div className="text-xs text-white/30">{question.points} pts base + time bonus</div>

              {feedback && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-3"
                >
                  {feedback === 'correct'
                    ? <CheckCircle size={28} className="text-green-400 mx-auto" />
                    : <XCircle size={28} className="text-red-400 mx-auto" />}
                  {feedback === 'wrong' && selectedChoice !== null && (
                    <div className="text-sm text-white/50 mt-2">
                      Correct: <span className="text-green-400 font-bold">{question.answer}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </GlassCard>

            {/* Choices */}
            <div className="grid grid-cols-2 gap-3">
              {question.choices.map((choice, i) => {
                let btnClass = 'glass border-white/10 text-white hover:border-cobalt/30';
                if (feedback !== null) {
                  if (choice === question.answer) btnClass = 'bg-green-500/20 border-green-400/50 text-green-400';
                  else if (choice === selectedChoice) btnClass = 'bg-red-500/20 border-red-400/50 text-red-400';
                  else btnClass = 'glass border-white/4 text-white/30';
                }
                return (
                  <motion.button
                    key={i}
                    onClick={() => handleAnswer(choice)}
                    disabled={feedback !== null}
                    whileHover={feedback === null ? { scale: 1.02 } : {}}
                    whileTap={feedback === null ? { scale: 0.98 } : {}}
                    className={`p-4 rounded-xl border text-xl font-bold transition-all duration-150 ${btnClass}`}
                  >
                    {choice}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* GAME OVER */}
        {mode === 'gameover' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <GlassCard variant="cobalt" className="p-8 text-center">
              <div className="text-5xl mb-4">
                {score >= 3000 ? '🏆' : score >= 2000 ? '🥇' : score >= 1000 ? '🥈' : '🎯'}
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Challenge Complete!</h2>
              <p className="text-white/50 text-sm mb-6">{totalQuestions} questions answered</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="glass p-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-cobalt-gradient">{formatNumber(score)}</div>
                  <div className="text-xs text-white/40 mt-1">Score</div>
                </div>
                <div className="glass p-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-orange-400">{maxStreak}</div>
                  <div className="text-xs text-white/40 mt-1">Best Streak</div>
                </div>
                <div className="glass p-3 rounded-xl text-center">
                  <Star size={18} className="text-yellow-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-yellow-400">
                    {score >= 3000 ? 3 : score >= 2000 ? 2 : score >= 1000 ? 1 : 0}★
                  </div>
                  <div className="text-xs text-white/40">Rating</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={startGame} className="btn-cobalt flex-1">
                  <RotateCcw size={14} /> Play Again
                </button>
                <Link href="/" className="btn-glass flex-1 text-sm text-center flex items-center justify-center">
                  Main Hub
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
