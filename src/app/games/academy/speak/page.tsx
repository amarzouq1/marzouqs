'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageSquare, RotateCcw, Star, Trophy } from 'lucide-react';
import Link from 'next/link';
import { saveLocalScore, formatNumber } from '@/lib/utils';
import { grantXP } from '@/lib/progression';
import { sfx, initAudio } from '@/lib/audio';

type Phase = 'menu' | 'playing' | 'results';

interface Scenario {
  id: number;
  situation: string;
  context: string;
  choices: {
    text: string;
    score: number;
    feedback: string;
    tag: 'excellent' | 'good' | 'okay' | 'poor';
  }[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    situation: '🤝 Job Interview',
    context: 'The interviewer asks: "Tell me about a time you failed and what you learned from it."',
    choices: [
      { text: 'I once missed a project deadline because I underestimated the workload. I learned to break tasks into smaller milestones and communicate early when I anticipate delays.', score: 100, feedback: 'Perfect! Shows self-awareness, accountability, and growth mindset.', tag: 'excellent' },
      { text: 'I failed a test once but then studied harder and passed next time.', score: 60, feedback: 'Acceptable but vague. More specific professional examples show stronger character.', tag: 'okay' },
      { text: "I don't really fail at things.", score: 10, feedback: 'Overconfident and unconvincing. Everyone fails — refusing to acknowledge it raises red flags.', tag: 'poor' },
      { text: 'I failed to meet a deadline and my manager was really angry at me.', score: 35, feedback: 'Mentions failure but focuses on negative reaction, not growth. Missing the lesson.', tag: 'poor' },
    ],
  },
  {
    id: 2,
    situation: '👥 Making Friends',
    context: 'You\'re new at school. Someone is sitting alone at lunch. You want to start a conversation.',
    choices: [
      { text: '"Hi! Mind if I sit here? I\'m new — still figuring everything out."', score: 90, feedback: 'Warm, honest, and low-pressure. Shows vulnerability which builds connection.', tag: 'excellent' },
      { text: '"Is this seat taken?" (sit down and eat silently)', score: 50, feedback: 'Technically okay but misses the opportunity to connect.', tag: 'okay' },
      { text: '"You look lonely. Want to be my friend?"', score: 40, feedback: 'Good intention, but "look lonely" can feel patronizing. Better to focus on yourself.', tag: 'okay' },
      { text: 'Stare at your phone and don\'t say anything.', score: 5, feedback: 'Missed a perfect chance for connection. Being new is the ideal time to reach out!', tag: 'poor' },
    ],
  },
  {
    id: 3,
    situation: '⚡ Conflict Resolution',
    context: 'Your teammate submitted work you feel is below standard. You need to address it before presenting to the class.',
    choices: [
      { text: '"Hey, I noticed some parts of the presentation might need more detail — can we work on sections 2 and 3 together before tomorrow?"', score: 100, feedback: 'Excellent! Specific, collaborative, forward-looking, and non-confrontational.', tag: 'excellent' },
      { text: '"This isn\'t good enough, you need to redo it."', score: 20, feedback: 'Direct but harsh. Likely to cause defensiveness and damage teamwork.', tag: 'poor' },
      { text: '"The presentation is good but maybe we can improve a few things?"', score: 65, feedback: 'Good tone, but too vague. Specify what needs improvement for action to happen.', tag: 'good' },
      { text: 'Submit it as-is without saying anything.', score: 15, feedback: 'Avoids conflict but sacrifices quality and fairness to yourself.', tag: 'poor' },
    ],
  },
  {
    id: 4,
    situation: '🎤 Class Presentation',
    context: 'You\'re about to present but realize you forgot a key section of your notes. The class is waiting.',
    choices: [
      { text: 'Take a breath, briefly acknowledge you\'re recalling a detail, continue confidently with what you know.', score: 100, feedback: 'Composure under pressure is a top professional skill. Recovery defines great presenters.', tag: 'excellent' },
      { text: 'Ask the class if you can start over tomorrow.', score: 30, feedback: 'Shows avoidance of challenge. Better to adapt and continue.', tag: 'poor' },
      { text: 'Rush through nervously without mentioning it.', score: 55, feedback: 'Understandable but the panic often shows. A calm pause works better.', tag: 'good' },
      { text: 'Apologize profusely and explain you forgot.', score: 40, feedback: 'Honesty is okay but over-apologizing draws more attention to the issue. Excessive apologies undermine your credibility as a speaker.', tag: 'okay' },
    ],
  },
  {
    id: 5,
    situation: '💬 Online Communication',
    context: 'Someone misunderstood your message in a group chat and got upset. You meant no harm.',
    choices: [
      { text: '"I\'m sorry my message came across that way — that wasn\'t my intention. What I meant was [explanation]. Can we talk it through?"', score: 100, feedback: 'Validates feelings, clarifies intent, and opens dialogue. Textbook conflict resolution.', tag: 'excellent' },
      { text: '"That\'s not what I meant! You\'re too sensitive."', score: 0, feedback: 'Dismisses feelings entirely. Almost always makes situations worse.', tag: 'poor' },
      { text: '"I apologize if you were offended."', score: 50, feedback: 'Passive phrasing ("if offended") subtly shifts blame. Better: "I\'m sorry my message was unclear."', tag: 'okay' },
      { text: 'Leave the group and ignore it.', score: 10, feedback: 'Avoidance never resolves — it escalates. Direct, respectful communication is always better.', tag: 'poor' },
    ],
  },
  {
    id: 6,
    situation: '🙏 Asking for Help',
    context: 'You\'re struggling with an assignment and your teacher is busy. You need to ask for help.',
    choices: [
      { text: '"Excuse me, I\'ve been working on question 3 for a while and I\'m stuck on [specific part]. Could you help me understand it when you have a moment?"', score: 100, feedback: 'Specific, respectful, and shows you\'ve tried first. Teachers love this approach.', tag: 'excellent' },
      { text: '"I don\'t get anything. Can you explain the whole thing?"', score: 20, feedback: 'Too broad and signals you haven\'t tried. Vague requests get vague help.', tag: 'poor' },
      { text: '"Can you help me?"', score: 45, feedback: 'Too vague. The more specific you are about what you need, the better the help you\'ll get.', tag: 'okay' },
      { text: 'Give up and leave the assignment blank.', score: 0, feedback: 'Never give up! Every teacher wants to help — asking is always worth it.', tag: 'poor' },
    ],
  },
  {
    id: 7,
    situation: '🎯 Disagreement with Authority',
    context: 'Your teacher gives you a lower grade than you expected. You believe you deserved more.',
    choices: [
      { text: '"Could I ask about my grade? I\'d like to understand where I lost marks so I can improve next time."', score: 100, feedback: 'Professional, respectful, and shows growth mindset. Best possible approach.', tag: 'excellent' },
      { text: '"That\'s not fair! I worked really hard on this!"', score: 25, feedback: 'Effort ≠ result in grading. This approach puts teachers on the defensive.', tag: 'poor' },
      { text: '"Can I discuss my grade with you after class?"', score: 85, feedback: 'Good — shows respect and gives privacy for the conversation.', tag: 'good' },
      { text: 'Accept it quietly but feel resentful.', score: 30, feedback: 'Passive acceptance misses a learning opportunity. Always respectfully advocate for yourself.', tag: 'okay' },
    ],
  },
  {
    id: 8,
    situation: '🤗 Giving Feedback',
    context: 'A friend shows you their creative project and asks "What do you honestly think?"',
    choices: [
      { text: '"I love the concept — the colors are really striking. The only thing I\'d adjust is the font size on the title to make it more readable. Overall, it\'s great!"', score: 100, feedback: 'The sandwich method: positive → specific improvement → positive. Perfect feedback.', tag: 'excellent' },
      { text: '"It\'s perfect! I wouldn\'t change anything."', score: 40, feedback: 'Kind but not helpful. They asked for honest feedback — vague praise isn\'t useful.', tag: 'okay' },
      { text: '"Honestly? The colors are bad and the layout is confusing."', score: 15, feedback: 'Too harsh and non-specific. Even honest feedback needs to be constructive.', tag: 'poor' },
      { text: '"The concept is strong! The font and layout could be refined for clarity, but the core idea is solid."', score: 90, feedback: 'Very good — specific, constructive, and encouraging.', tag: 'good' },
    ],
  },
  {
    id: 9,
    situation: '🏫 Group Work',
    context: 'One team member hasn\'t contributed to your group project due tomorrow.',
    choices: [
      { text: '"Hey, we\'re finishing up the project tonight — is there a part you can take on? We need [specific task] done."', score: 100, feedback: 'Direct, specific, and gives them a clear path to contribute. No shaming.', tag: 'excellent' },
      { text: 'Tell the teacher without talking to them first.', score: 25, feedback: 'Escalating without attempting resolution first is rarely the best first move.', tag: 'poor' },
      { text: '"You haven\'t done anything! We\'ve been doing all the work!"', score: 10, feedback: 'Accusatory opening will put them on the defensive and damage the relationship.', tag: 'poor' },
      { text: 'Do their part yourself and note their absence to the teacher.', score: 60, feedback: 'Pragmatic but misses the chance to address the behavior directly.', tag: 'good' },
    ],
  },
  {
    id: 10,
    situation: '💪 Introducing Yourself',
    context: 'You\'re starting at a new club. The leader asks everyone to introduce themselves.',
    choices: [
      { text: '"Hi, I\'m [Name]. I joined because I\'m passionate about [topic], and I\'m hoping to learn more and contribute where I can."', score: 100, feedback: 'Name + reason + intention = the perfect introduction. Memorable and genuine.', tag: 'excellent' },
      { text: '"Hi, I\'m [Name]." (sit down quickly)', score: 40, feedback: 'Too brief. A first impression is a chance to be remembered — take it!', tag: 'okay' },
      { text: '"Hi I\'m [Name], I\'m really good at this stuff actually."', score: 35, feedback: 'Overconfident claims in introductions can come across as arrogant before proving yourself.', tag: 'poor' },
      { text: '"Hi, I\'m [Name] and I\'m pretty new to all this so sorry in advance."', score: 50, feedback: 'Honest but pre-apologizing sets a low bar for yourself. Lead with curiosity, not apology.', tag: 'okay' },
    ],
  },
];

function tagColor(tag: string) {
  if (tag === 'excellent') return 'text-green-400 bg-green-500/15 border-green-500/30';
  if (tag === 'good') return 'text-blue-400 bg-blue-500/15 border-blue-500/30';
  if (tag === 'okay') return 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30';
  return 'text-red-400 bg-red-500/15 border-red-500/30';
}

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

export default function HowToSpeakPage() {
  const [phase, setPhase]       = useState<Phase>('menu');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [idx, setIdx]           = useState(0);
  const [score, setScore]       = useState(0);
  const [chosen, setChosen]     = useState<number | null>(null);
  const [resLog, setResLog]     = useState<{ s: Scenario; chosen: number }[]>([]);
  const TOTAL = 6;

  const startGame = useCallback(() => {
    initAudio();
    const picked = shuffle(SCENARIOS).slice(0, TOTAL);
    setScenarios(picked);
    setIdx(0);
    setScore(0);
    setChosen(null);
    setResLog([]);
    setPhase('playing');
  }, []);

  const handleChoice = useCallback((i: number) => {
    if (chosen !== null) return;
    const s = scenarios[idx];
    const pts = s.choices[i].score;
    setChosen(i);
    setResLog(r => [...r, { s, chosen: i }]);
    setScore(sc => sc + pts);
    if (pts >= 80) sfx.success();
    else if (pts >= 50) { /* neutral */ }
    else sfx.fail();
    setTimeout(() => {
      if (idx + 1 >= TOTAL) {
        const final = score + pts;
        saveLocalScore('speak', final);
        grantXP('language', final);
        if (final >= 500) sfx.levelUp();
        setScore(final);
        setPhase('results');
      } else {
        setIdx(i => i + 1);
        setChosen(null);
      }
    }, 2000);
  }, [chosen, scenarios, idx, score]);

  const s = scenarios[idx];
  const maxPossible = TOTAL * 100;

  return (
    <div className="min-h-dvh pt-16 pb-24 bg-midnight">
      <div className="fluid-container max-w-2xl py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/games/academy" className="glass p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} className="text-white/70" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">💬 How to Speak</h1>
            <p className="text-white/40 text-sm">Real-world communication challenges</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center">
              <div className="text-7xl mb-4">💬</div>
              <h2 className="text-2xl font-black text-white mb-3">How to Speak</h2>
              <p className="text-white/60 mb-6 max-w-sm mx-auto">
                Master communication skills through real-world scenarios. Learn what to say — and how to say it — in every situation.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                {[
                  { emoji: '🤝', text: 'Job interviews' },
                  { emoji: '👥', text: 'Making friends' },
                  { emoji: '⚡', text: 'Conflict resolution' },
                  { emoji: '🎤', text: 'Public speaking' },
                  { emoji: '💬', text: 'Online communication' },
                  { emoji: '🎯', text: 'Asking for help' },
                ].map((item, i) => (
                  <div key={i} className="glass rounded-xl p-3 flex items-center gap-2 text-sm text-white/70">
                    <span>{item.emoji}</span> {item.text}
                  </div>
                ))}
              </div>
              <button onClick={startGame} className="btn-cobalt px-10 py-4 text-lg font-black rounded-2xl w-full">
                Start Challenge 💬
              </button>
            </motion.div>
          )}

          {phase === 'playing' && s && (
            <motion.div key={`s-${idx}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              {/* Progress */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-white/40 text-sm">{idx + 1}/{TOTAL}</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${(idx / TOTAL) * 100}%`, background: 'linear-gradient(to right, #0047FF, #00AAFF)' }} />
                </div>
                <span className="text-gold text-sm font-bold">⭐ {score}</span>
              </div>
              {/* Situation card */}
              <div className="glass-dark rounded-2xl p-6 mb-5 border border-cobalt/20">
                <div className="text-xl font-black text-white mb-1">{s.situation}</div>
                <p className="text-white/80 text-base leading-relaxed">{s.context}</p>
              </div>
              <p className="text-white/50 text-sm mb-3">What would you say or do?</p>
              {/* Choices */}
              <div className="space-y-3">
                {s.choices.map((c, i) => {
                  let style = 'glass border-white/10 text-white hover:border-cobalt/40 hover:bg-cobalt/5';
                  if (chosen !== null) {
                    const isChosen = i === chosen;
                    const col = tagColor(c.tag);
                    if (isChosen) style = `border-2 ${col}`;
                    else style = 'glass border-white/5 text-white/30';
                  }
                  return (
                    <button key={i} onClick={() => handleChoice(i)} disabled={chosen !== null}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${style}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-white/40 font-bold text-sm mt-0.5 flex-shrink-0">{String.fromCharCode(65 + i)}.</span>
                        <div>
                          <div className="font-medium leading-snug">{c.text}</div>
                          {chosen === i && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm opacity-90">
                              {c.feedback}
                              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-bold border ${tagColor(c.tag)}`}>
                                {c.score} pts
                              </span>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {phase === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">{score >= maxPossible * 0.8 ? '🏆' : score >= maxPossible * 0.6 ? '⭐' : '💪'}</div>
                <h2 className="text-2xl font-black text-white">
                  {score >= maxPossible * 0.8 ? 'Master Communicator!' : score >= maxPossible * 0.6 ? 'Skilled Communicator' : 'Keep Practicing!'}
                </h2>
                <div className="text-4xl font-black text-gold mt-2">{score} / {maxPossible}</div>
                <div className="text-white/40 mt-1">{Math.round((score / maxPossible) * 100)}% Communication Score</div>
              </div>
              {/* Review */}
              <div className="space-y-3 mb-6 max-h-80 overflow-y-auto scrollbar-none">
                {resLog.map((r, i) => {
                  const c = r.s.choices[r.chosen];
                  return (
                    <div key={i} className={`p-4 rounded-xl border ${tagColor(c.tag)}`}>
                      <div className="font-bold text-sm mb-1">{r.s.situation}</div>
                      <div className="text-sm opacity-80 mb-1">"{c.text.slice(0, 60)}..."</div>
                      <div className="text-xs opacity-70">{c.feedback}</div>
                      <span className="text-xs font-black">{c.score} pts</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button onClick={startGame} className="flex-1 btn-cobalt py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  <RotateCcw size={16} /> Try Again
                </button>
                <Link href="/games/academy" className="flex-1 btn-glass py-3 rounded-xl font-bold text-center">Academy</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
