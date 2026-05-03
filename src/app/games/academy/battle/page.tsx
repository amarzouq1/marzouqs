'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, Shield, Heart, Brain } from 'lucide-react';
import Link from 'next/link';
import { saveLocalScore } from '@/lib/utils';

// ─── Question Engine ──────────────────────────────────────────────────────────
type QType = 'add' | 'sub' | 'mul' | 'div' | 'power' | 'sqrt' | 'algebra';

interface BattleQ {
  text: string;
  answer: number;
  choices: number[];
  pts: number;
  type: QType;
}

function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

function makeQuestion(difficulty: number): BattleQ {
  const tier = Math.min(Math.floor(difficulty / 3), 4);
  const pools: QType[][] = [
    ['add','sub'],
    ['add','sub','mul'],
    ['mul','div','power'],
    ['power','sqrt','algebra'],
    ['mul','div','power','sqrt','algebra'],
  ];
  const types = pools[tier];
  const type = types[Math.floor(Math.random() * types.length)];
  const maxN = [20, 50, 100, 200, 300][tier];

  let text = '', answer = 0, pts = (tier + 1) * 100;

  switch (type) {
    case 'add': { const a = randInt(1,maxN), b = randInt(1,maxN); text = `${a} + ${b} = ?`; answer = a + b; break; }
    case 'sub': { const a = randInt(maxN/2,maxN), b = randInt(1,Math.floor(maxN/2)); text = `${a} − ${b} = ?`; answer = a - b; break; }
    case 'mul': { const a = randInt(2,Math.min(maxN,25)), b = randInt(2,Math.min(maxN,25)); text = `${a} × ${b} = ?`; answer = a * b; break; }
    case 'div': { const b = randInt(2,12), a = b * randInt(2,20); text = `${a} ÷ ${b} = ?`; answer = a / b; break; }
    case 'power': { const b = randInt(2,5), e = randInt(2,3); text = `${b}^${e} = ?`; answer = Math.pow(b, e); break; }
    case 'sqrt': { const r = randInt(2,15); text = `√${r*r} = ?`; answer = r; break; }
    case 'algebra': { const x = randInt(1,20), a = randInt(2,12), b = randInt(1,50); text = `${a}x + ${b} = ${a*x+b}, x = ?`; answer = x; break; }
  }

  // Generate wrong choices
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const delta = randInt(1, Math.max(3, Math.round(Math.abs(answer) * 0.25) || 5));
    const w = answer + (Math.random() < 0.5 ? delta : -delta);
    if (w !== answer && w >= 0) wrongs.add(w);
  }
  const choices = shuffle([answer, ...Array.from(wrongs).slice(0, 3)]);
  return { text, answer, choices, pts, type };
}

// AI response timing (ms) — harder AI is faster
function aiResponseTime(aiLevel: number, difficulty: number): number {
  const base = [4200, 3200, 2200, 1400, 900][Math.min(aiLevel, 4)];
  return base + (Math.random() - 0.5) * 600;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Combatant { hp: number; score: number; name: string; avatar: string }
type Phase = 'select' | 'battle' | 'finished';

const AI_NAMES = ['MathBot 3000', 'Algebrax', 'Numberix', 'CalcuLord', 'OmegaCalc'];
const AI_AVATARS = ['🤖', '👾', '🦾', '🧠', '⚡'];

interface AIDiff { label: string; level: number; description: string }
const AI_DIFFICULTIES: AIDiff[] = [
  { label: 'Rookie',   level: 0, description: 'Slow AI — perfect for beginners' },
  { label: 'Apprentice', level: 1, description: 'Moderate speed' },
  { label: 'Expert',   level: 2, description: 'Quick responses' },
  { label: 'Master',   level: 3, description: 'Very fast — almost no mercy' },
  { label: 'Legend',   level: 4, description: 'Instant AI — bring your A-game' },
];

const MAX_HP = 1000;
const ROUNDS = 12;

export default function MathBattlePage() {
  const [phase, setPhase] = useState<Phase>('select');
  const [aiDiff, setAiDiff] = useState<AIDiff>(AI_DIFFICULTIES[1]);
  const [aiName] = useState(() => AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)]);
  const [aiAvatar] = useState(() => AI_AVATARS[Math.floor(Math.random() * AI_AVATARS.length)]);

  const [player, setPlayer] = useState<Combatant>({ hp: MAX_HP, score: 0, name: 'You', avatar: '🧑' });
  const [ai, setAi] = useState<Combatant>({ hp: MAX_HP, score: 0, name: aiName, avatar: aiAvatar });

  const [question, setQuestion] = useState<BattleQ | null>(null);
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [difficulty, setDifficulty] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [feedbackP, setFeedbackP] = useState<'correct' | 'wrong' | null>(null);
  const [feedbackAI, setFeedbackAI] = useState<'correct' | 'wrong' | null>(null);
  const [showDamage, setShowDamage] = useState<{ target: 'player' | 'ai'; dmg: number } | null>(null);
  const [streak, setStreak] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const aiTimerRef = useRef<NodeJS.Timeout>();
  const resolveRoundRef = useRef<(playerAns: number | null, aiCorrect: boolean, q: BattleQ) => void>(() => {});
  const nextQuestionRef = useRef<(d: number) => void>(() => {});
  const questionRef = useRef<BattleQ | null>(null);

  const startBattle = () => {
    setPlayer({ hp: MAX_HP, score: 0, name: 'You', avatar: '🧑' });
    setAi({ hp: MAX_HP, score: 0, name: aiName, avatar: aiAvatar });
    setRound(0);
    setDifficulty(0);
    setStreak(0);
    setPhase('battle');
  };

  const resolveRound = useCallback((
    playerAns: number | null,
    aiCorrect: boolean,
    q: BattleQ,
  ) => {
    clearTimeout(timerRef.current);
    clearTimeout(aiTimerRef.current);
    setLocked(true);

    const playerCorrect = playerAns !== null && playerAns === q.answer;
    setFeedbackP(playerCorrect ? 'correct' : 'wrong');
    setFeedbackAI(aiCorrect ? 'correct' : 'wrong');

    let newPlayerHP = player.hp, newAiHP = ai.hp;
    let newStreak = streak;

    if (playerCorrect && !aiCorrect) {
      // Player hits AI
      const dmg = q.pts + (newStreak >= 2 ? 50 * newStreak : 0);
      newAiHP = Math.max(0, ai.hp - dmg);
      setShowDamage({ target: 'ai', dmg });
      newStreak++;
    } else if (!playerCorrect && aiCorrect) {
      // AI hits player
      const dmg = q.pts;
      newPlayerHP = Math.max(0, player.hp - dmg);
      setShowDamage({ target: 'player', dmg });
      newStreak = 0;
    } else if (playerCorrect && aiCorrect) {
      // Both correct — lower damage to both, player slightly better
      const dmg = Math.round(q.pts * 0.3);
      newPlayerHP = Math.max(0, player.hp - dmg);
      newAiHP = Math.max(0, ai.hp - dmg + 20);
      newStreak++;
    } else {
      newStreak = 0;
    }

    const newPlayerScore = player.score + (playerCorrect ? q.pts : 0);
    const newAiScore = ai.score + (aiCorrect ? q.pts : 0);
    const newRound = round + 1;
    const newDiff = difficulty + 1;

    setStreak(newStreak);
    setPlayer(p => ({ ...p, hp: newPlayerHP, score: newPlayerScore }));
    setAi(a => ({ ...a, hp: newAiHP, score: newAiScore }));

    setTimeout(() => {
      if (newPlayerHP <= 0 || newAiHP <= 0 || newRound >= ROUNDS) {
        setRound(newRound);
        setDifficulty(newDiff);
        setPhase('finished');
        saveLocalScore('math', newPlayerScore);
      } else {
        setRound(newRound);
        setDifficulty(newDiff);
        nextQuestionRef.current(newDiff);
      }
    }, 1600);
  }, [player, ai, round, difficulty, streak]);

  const nextQuestion = useCallback((d: number) => {
    clearTimeout(timerRef.current);
    clearTimeout(aiTimerRef.current);
    const q = makeQuestion(d);
    setQuestion(q);
    setChosen(null);
    setLocked(false);
    setFeedbackP(null);
    setFeedbackAI(null);
    setShowDamage(null);

    const timeLimit = Math.max(6, 15 - Math.floor(d / 4));
    setTimeLeft(timeLimit);

    const aiDelayMs =
      aiResponseTime(aiDiff.level, d) * 1000 * (timeLimit / 15);
    aiTimerRef.current = setTimeout(() => {
      const correctChance = [0.5, 0.65, 0.78, 0.88, 0.97][Math.min(aiDiff.level, 4)];
      const aiCorrect = Math.random() < correctChance;
      resolveRoundRef.current(null, aiCorrect, q);
    }, aiDelayMs);
  }, [aiDiff.level]);

  useEffect(() => {
    resolveRoundRef.current = resolveRound;
  }, [resolveRound]);

  useEffect(() => {
    nextQuestionRef.current = nextQuestion;
  }, [nextQuestion]);

  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  // Round timer
  useEffect(() => {
    if (phase !== 'battle' || locked) return;
    if (timeLeft <= 0) {
      const q = questionRef.current;
      if (q) {
        const correctChance = [0.5, 0.65, 0.78, 0.88, 0.97][Math.min(aiDiff.level, 4)];
        const aiCorrect = Math.random() < correctChance;
        resolveRoundRef.current(null, aiCorrect, q);
      }
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, phase, locked, aiDiff.level]);

  // Start first question
  useEffect(() => {
    if (phase === 'battle' && round === 0 && !question) {
      nextQuestion(0);
    }
  }, [phase, round, question, nextQuestion]);

  const handleAnswer = (choice: number) => {
    if (locked || !question) return;
    clearTimeout(timerRef.current);
    clearTimeout(aiTimerRef.current);
    setChosen(choice);
    const correctChance = [0.5, 0.65, 0.78, 0.88, 0.97][Math.min(aiDiff.level, 4)];
    const aiCorrect = Math.random() < correctChance;
    resolveRound(choice, aiCorrect, question);
  };

  const hpPercent = (hp: number) => Math.max(0, (hp / MAX_HP) * 100);
  const hpColor = (pct: number) => pct > 50 ? '#22c55e' : pct > 25 ? '#f59e0b' : '#ef4444';

  const winner = phase === 'finished'
    ? (player.hp > ai.hp || (player.hp === ai.hp && player.score >= ai.score) ? 'player' : 'ai')
    : null;

  return (
    <div className="min-h-dvh bg-midnight flex flex-col items-center pt-16 pb-24">
      <div className="fluid-container px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/games/academy" className="p-2 glass rounded-xl text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Math Battle Arena</h1>
            <p className="text-sm text-white/50">Head-to-head math combat · {ROUNDS} rounds</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── SELECT ── */}
          {phase === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass-dark rounded-2xl p-8 border border-cobalt/30 text-center mb-6">
                <div className="text-6xl mb-4">⚔️</div>
                <h2 className="text-2xl font-bold text-white mb-2">Choose Your Opponent</h2>
                <p className="text-white/50 mb-6">Answer faster and more accurately to deal damage. Reach 0 HP to win!</p>
                <div className="flex items-center justify-center gap-6 text-sm text-white/40 mb-6">
                  <span>🎯 Correct = Damage to opponent</span>
                  <span>⚡ Streak = Bonus damage</span>
                </div>
                <div className="grid gap-3">
                  {AI_DIFFICULTIES.map(d => (
                    <motion.button
                      key={d.label}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setAiDiff(d)}
                      className={`p-4 rounded-xl text-left border transition-all flex items-center justify-between ${
                        aiDiff.level === d.level
                          ? 'bg-cobalt/15 border-cobalt text-white'
                          : 'glass border-white/10 text-white/70 hover:border-white/30'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{d.label}</div>
                        <div className="text-sm opacity-60">{d.description}</div>
                      </div>
                      {aiDiff.level === d.level && <Zap className="w-5 h-5 text-cobalt-bright" />}
                    </motion.button>
                  ))}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={startBattle}
                className="w-full btn-cobalt py-4 rounded-xl font-bold text-lg"
              >
                Start Battle vs {aiDiff.label} AI
              </motion.button>
            </motion.div>
          )}

          {/* ── BATTLE ── */}
          {phase === 'battle' && question && (
            <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* HP Bars */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                {/* Player */}
                <motion.div
                  animate={showDamage?.target === 'player' ? { x: [-4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.35 }}
                  className="glass-dark rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🧑</span>
                    <span className="text-white font-bold text-sm">You</span>
                    {streak >= 2 && <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded-lg border border-orange-500/30">🔥 ×{streak}</span>}
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-1">
                    <motion.div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${hpPercent(player.hp)}%`, backgroundColor: hpColor(hpPercent(player.hp)) }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/50">
                    <span>{player.hp} HP</span>
                    <span>{player.score} pts</span>
                  </div>
                  {showDamage?.target === 'player' && (
                    <motion.div
                      initial={{ y: 0, opacity: 1 }} animate={{ y: -20, opacity: 0 }} transition={{ duration: 0.8 }}
                      className="text-red-400 font-bold text-sm"
                    >-{showDamage.dmg}</motion.div>
                  )}
                  {feedbackP === 'correct' && <div className="text-emerald-400 text-xs mt-1">✓ Correct!</div>}
                  {feedbackP === 'wrong' && <div className="text-red-400 text-xs mt-1">✗ Wrong</div>}
                </motion.div>

                {/* AI */}
                <motion.div
                  animate={showDamage?.target === 'ai' ? { x: [-4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.35 }}
                  className="glass-dark rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{aiAvatar}</span>
                    <span className="text-white font-bold text-sm truncate">{aiName}</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-1">
                    <motion.div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${hpPercent(ai.hp)}%`, backgroundColor: hpColor(hpPercent(ai.hp)) }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/50">
                    <span>{ai.hp} HP</span>
                    <span>{ai.score} pts</span>
                  </div>
                  {showDamage?.target === 'ai' && (
                    <motion.div
                      initial={{ y: 0, opacity: 1 }} animate={{ y: -20, opacity: 0 }} transition={{ duration: 0.8 }}
                      className="text-emerald-400 font-bold text-sm"
                    >-{showDamage.dmg}</motion.div>
                  )}
                  {feedbackAI === 'correct' && <div className="text-emerald-400 text-xs mt-1">✓ Answered</div>}
                  {feedbackAI === 'wrong' && <div className="text-red-400 text-xs mt-1">✗ Missed</div>}
                </motion.div>
              </div>

              {/* Round + Timer */}
              <div className="flex items-center justify-between mb-3 text-sm">
                <span className="text-white/40">Round {round + 1}/{ROUNDS}</span>
                <div className="flex items-center gap-2">
                  <div className="w-40 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ width: `${(timeLeft / Math.max(6, 15 - Math.floor(difficulty / 4))) * 100}%`, backgroundColor: timeLeft > 5 ? '#00aaff' : '#ef4444' }}
                    />
                  </div>
                  <span className={`font-mono font-bold w-5 text-right ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>{timeLeft}</span>
                </div>
              </div>

              {/* Question */}
              <motion.div
                key={question.text}
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="glass-dark rounded-2xl p-8 text-center border border-cobalt/20 mb-5"
              >
                <div className="text-4xl font-bold text-white mb-1 tracking-wide" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {question.text}
                </div>
                <div className="text-cobalt-bright text-sm">{question.pts} pts</div>
              </motion.div>

              {/* Choices */}
              <div className="grid grid-cols-2 gap-3">
                {question.choices.map((c, i) => {
                  let cls = 'glass border-white/10 text-white hover:border-cobalt/50 cursor-pointer';
                  if (locked) {
                    if (c === question.answer) cls = 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
                    else if (c === chosen) cls = 'bg-red-500/20 border-red-500 text-red-300';
                    else cls = 'glass border-white/5 text-white/30';
                  } else if (c === chosen) {
                    cls = 'bg-cobalt/20 border-cobalt text-white';
                  }
                  return (
                    <motion.button
                      key={`${c}-${i}`}
                      whileHover={!locked ? { scale: 1.03 } : {}}
                      whileTap={!locked ? { scale: 0.97 } : {}}
                      onClick={() => handleAnswer(c)}
                      className={`rounded-xl p-4 border text-xl font-bold transition-all ${cls}`}
                    >
                      {c}
                    </motion.button>
                  );
                })}
              </div>

              {streak >= 2 && !locked && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="text-center mt-4 text-orange-300 text-sm font-bold"
                >
                  🔥 Combo ×{streak} — Deal {50 * streak} bonus damage!
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── FINISHED ── */}
          {phase === 'finished' && (
            <motion.div key="finished" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="glass-dark rounded-2xl p-10 text-center border border-cobalt/30 mb-6">
                <div className="text-7xl mb-5">{winner === 'player' ? '🏆' : '💀'}</div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {winner === 'player' ? 'Victory!' : 'Defeated!'}
                </h2>
                <p className="text-white/50 mb-8">
                  {winner === 'player' ? `You defeated ${aiName}!` : `${aiName} was too powerful this time.`}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className={`rounded-xl p-4 border ${winner === 'player' ? 'bg-cobalt/10 border-cobalt/40' : 'glass border-white/10'}`}>
                    <div className="text-3xl mb-1">🧑</div>
                    <div className="text-white font-bold">You</div>
                    <div className="text-2xl font-bold text-cobalt-bright mt-1">{player.score}</div>
                    <div className="text-white/40 text-xs">points</div>
                    <div className="text-sm text-white/60 mt-2">{player.hp} HP left</div>
                  </div>
                  <div className={`rounded-xl p-4 border ${winner === 'ai' ? 'bg-red-500/10 border-red-500/40' : 'glass border-white/10'}`}>
                    <div className="text-3xl mb-1">{aiAvatar}</div>
                    <div className="text-white font-bold truncate">{aiName}</div>
                    <div className="text-2xl font-bold text-red-300 mt-1">{ai.score}</div>
                    <div className="text-white/40 text-xs">points</div>
                    <div className="text-sm text-white/60 mt-2">{ai.hp} HP left</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={startBattle} className="flex-1 btn-cobalt py-3 rounded-xl font-bold">Rematch</button>
                  <button onClick={() => setPhase('select')} className="flex-1 btn-glass py-3 rounded-xl font-bold">Menu</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
