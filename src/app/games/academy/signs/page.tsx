'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Trophy, Star, Hand } from 'lucide-react';
import Link from 'next/link';
import { saveLocalScore, formatNumber } from '@/lib/utils';
import { grantXP } from '@/lib/progression';
import { sfx, initAudio } from '@/lib/audio';

type Mode = 'menu' | 'fingerspell' | 'words' | 'phrases' | 'results' | 'select';
type Difficulty = 'beginner' | 'intermediate' | 'advanced';

interface SignCard {
  id: number;
  sign: string;       // emoji representation or description
  word: string;       // the answer
  description: string; // how to form the sign
  category: string;
}

// ASL Fingerspelling — letter shapes described and shown as emoji/unicode combos
const ALPHABET: Record<string, { emoji: string; desc: string }> = {
  A: { emoji: '✊', desc: 'Closed fist, thumb rests on side of index finger' },
  B: { emoji: '🖐️', desc: 'Flat hand, fingers together, thumb tucked in' },
  C: { emoji: '🤌', desc: 'Curved hand like holding a ball, C-shape' },
  D: { emoji: '👆', desc: 'Index finger up, other fingers and thumb form O' },
  E: { emoji: '✋', desc: 'Fingers bent at knuckles, thumb tucked under' },
  F: { emoji: '👌', desc: 'Index-thumb touch forming a circle, other fingers up' },
  G: { emoji: '👉', desc: 'Index finger and thumb point sideways, parallel' },
  H: { emoji: '🤞', desc: 'Index and middle finger point sideways, parallel' },
  I: { emoji: '🤙', desc: 'Pinky finger raised, other fingers closed' },
  J: { emoji: '🤙', desc: 'Pinky up, draw a J in the air' },
  K: { emoji: '✌️', desc: 'Index and middle up, thumb between them' },
  L: { emoji: '🤙', desc: 'L-shape: index finger up, thumb out to side' },
  M: { emoji: '✊', desc: 'Three fingers (index, middle, ring) draped over thumb' },
  N: { emoji: '✊', desc: 'Two fingers (index, middle) draped over thumb' },
  O: { emoji: '👌', desc: 'All fingers curve to touch thumb, forming O' },
  P: { emoji: '🤘', desc: 'Like K but pointing downward' },
  Q: { emoji: '👇', desc: 'Like G but pointing downward' },
  R: { emoji: '🤞', desc: 'Index and middle fingers crossed' },
  S: { emoji: '✊', desc: 'Closed fist, thumb wraps over fingers' },
  T: { emoji: '✊', desc: 'Thumb between index and middle finger' },
  U: { emoji: '✌️', desc: 'Index and middle finger together, pointing up' },
  V: { emoji: '✌️', desc: 'Index and middle finger spread apart, V-shape' },
  W: { emoji: '🤟', desc: 'Index, middle, ring fingers spread, forming W' },
  X: { emoji: '☝️', desc: 'Index finger bent/hooked' },
  Y: { emoji: '🤙', desc: 'Thumb and pinky extended, others closed' },
  Z: { emoji: '☝️', desc: 'Index finger draws a Z in the air' },
};

const WORD_SIGNS: SignCard[] = [
  // Greetings
  { id: 1, sign: '👋✨', word: 'Hello', description: 'Wave your dominant hand near your forehead, fingers together.', category: 'Greetings' },
  { id: 2, sign: '🙏', word: 'Thank you', description: 'Flat hand starts at chin, moves forward and down. Like blowing a kiss of gratitude.', category: 'Greetings' },
  { id: 3, sign: '🖐️', word: 'Please', description: 'Rub open hand in a circular motion on chest.', category: 'Greetings' },
  { id: 4, sign: '😊🤝', word: 'Nice to meet you', description: 'Dominant hand slides across non-dominant palm (nice), then both hands clasp (meet).', category: 'Greetings' },
  { id: 5, sign: '👋👋', word: 'Goodbye', description: 'Open hand, bend fingers down repeatedly. Like a wave goodbye.', category: 'Greetings' },
  // Family
  { id: 6, sign: '👨‍👩‍👧‍👦', word: 'Family', description: 'Both F-hands (finger+thumb circle), thumbs touching, rotate forward in a circle.', category: 'Family' },
  { id: 7, sign: '👩', word: 'Mother', description: 'Open hand, thumb touches chin.', category: 'Family' },
  { id: 8, sign: '👨', word: 'Father', description: 'Open hand, thumb touches forehead.', category: 'Family' },
  { id: 9, sign: '👦', word: 'Brother', description: 'L-shape at forehead (male), then tap index fingers together.', category: 'Family' },
  { id: 10, sign: '👧', word: 'Sister', description: 'A-shape at chin (female), then tap index fingers together.', category: 'Family' },
  // Emotions
  { id: 11, sign: '😊', word: 'Happy', description: 'Both hands brush upward on chest repeatedly, like lifting the heart.', category: 'Emotions' },
  { id: 12, sign: '😢', word: 'Sad', description: 'Both hands move downward in front of the face, like tears falling.', category: 'Emotions' },
  { id: 13, sign: '😡', word: 'Angry', description: 'Claw-hands on chest, pull outward sharply.', category: 'Emotions' },
  { id: 14, sign: '😨', word: 'Scared', description: 'Both S-hands move toward each other in front of chest quickly.', category: 'Emotions' },
  { id: 15, sign: '❤️', word: 'Love', description: 'Cross both arms over chest, like hugging yourself.', category: 'Emotions' },
  // Basic needs
  { id: 16, sign: '🍽️', word: 'Eat', description: 'Flat O-hand (fingers together) moves to mouth repeatedly.', category: 'Needs' },
  { id: 17, sign: '💧', word: 'Water', description: 'W-hand (3 fingers) taps chin twice.', category: 'Needs' },
  { id: 18, sign: '🛌', word: 'Sleep', description: 'Open hand in front of face, close fingers as hand drops (eyes closing).', category: 'Needs' },
  { id: 19, sign: '🏃', word: 'Help', description: 'Thumbs-up rests on open non-dominant palm, both move forward together.', category: 'Needs' },
  { id: 20, sign: '🚽', word: 'Bathroom', description: 'T-hand (thumb between fingers) shakes side to side.', category: 'Needs' },
  // Colors
  { id: 21, sign: '🔴', word: 'Red', description: 'Index finger brushes downward on lips (like lipstick).', category: 'Colors' },
  { id: 22, sign: '🔵', word: 'Blue', description: 'B-hand shakes slightly (wrist rotation).', category: 'Colors' },
  { id: 23, sign: '🟡', word: 'Yellow', description: 'Y-hand (thumb and pinky) shakes side to side.', category: 'Colors' },
  { id: 24, sign: '🟢', word: 'Green', description: 'G-hand shakes at the wrist.', category: 'Colors' },
  { id: 25, sign: '⚫', word: 'Black', description: 'Index finger slides across forehead from left to right.', category: 'Colors' },
  { id: 26, sign: '⚪', word: 'White', description: 'Open hand on chest, pull forward closing into flat O.', category: 'Colors' },
  // Numbers concepts
  { id: 27, sign: '1️⃣', word: 'One', description: 'Index finger pointing up.', category: 'Numbers' },
  { id: 28, sign: '2️⃣', word: 'Two', description: 'Index and middle finger up (like V/peace).', category: 'Numbers' },
  { id: 29, sign: '3️⃣', word: 'Three', description: 'Index, middle, and ring finger up, thumb holds pinky.', category: 'Numbers' },
  { id: 30, sign: '5️⃣', word: 'Five', description: 'All five fingers spread open.', category: 'Numbers' },
  // Common phrases
  { id: 31, sign: '❓💭', word: 'What?', description: 'Shake index finger side to side in front of you with questioning expression.', category: 'Phrases' },
  { id: 32, sign: '📍❓', word: 'Where?', description: 'Index finger points and waggles with questioning expression.', category: 'Phrases' },
  { id: 33, sign: '⏰❓', word: 'When?', description: 'Index finger circles around non-dominant index, then points forward.', category: 'Phrases' },
  { id: 34, sign: '✅', word: 'Yes', description: 'S-hand (fist) nods up and down like a head nodding.', category: 'Phrases' },
  { id: 35, sign: '❌', word: 'No', description: 'Index and middle finger snap to thumb.', category: 'Phrases' },
  { id: 36, sign: '🤷', word: 'I don\'t know', description: 'B-hands at temples, flip out and away with shrug.', category: 'Phrases' },
  // School
  { id: 37, sign: '📚', word: 'Book', description: 'Both flat hands together (prayer position), open outward like a book.', category: 'School' },
  { id: 38, sign: '✏️', word: 'Write', description: 'Dominant index+thumb (like holding pen) writes on non-dominant palm.', category: 'School' },
  { id: 39, sign: '🏫', word: 'School', description: 'Non-dominant palm faces up, dominant hand claps on it twice.', category: 'School' },
  { id: 40, sign: '📖', word: 'Read', description: 'V-hand (two fingers like eyes) moves down over non-dominant palm (like scanning text).', category: 'School' },
];

const PHRASES = [
  { id: 1, phrase: 'How are you?', signs: ['👋', '😊', '❓'], description: 'Wave (you) + touch chest (how/feeling) + questioning expression.', answer: 'How are you?' },
  { id: 2, phrase: 'I love you (ILY)', signs: ['🤟'], description: 'Thumb, index finger, and pinky extended simultaneously — the ILY handshape.', answer: 'I love you' },
  { id: 3, phrase: 'Good morning', signs: ['👍', '🌅'], description: 'Thumbs-up (good) then open hand rises from bent elbow (morning/sun rising).', answer: 'Good morning' },
  { id: 4, phrase: 'See you later', signs: ['👀', '⏱️', '👋'], description: 'V-hand points to eyes (see), then Y-hand swings back (later), then wave.', answer: 'See you later' },
  { id: 5, phrase: 'I understand', signs: ['☝️✨'], description: 'Index finger flicks up from closed fist near forehead — like a lightbulb moment.', answer: 'I understand' },
  { id: 6, phrase: 'Nice to meet you', signs: ['😊', '🤝'], description: 'Fingers brush together at chest (nice/meet) with both hands clasping briefly.', answer: 'Nice to meet you' },
];

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

function makeChoices(correct: string, pool: string[]): string[] {
  const others = shuffle(pool.filter(w => w !== correct)).slice(0, 3);
  return shuffle([correct, ...others]);
}

export default function SignLanguagePage() {
  const [mode, setMode]         = useState<Mode>('menu');
  const [difficulty, setDiff]   = useState<Difficulty>('beginner');
  const [cards, setCards]       = useState<SignCard[]>([]);
  const [cardIdx, setCardIdx]   = useState(0);
  const [score, setScore]       = useState(0);
  const [streak, setStreak]     = useState(0);
  const [chosen, setChosen]     = useState<string | null>(null);
  const [correct, setCorrect]   = useState<boolean | null>(null);
  const [choices, setChoices]   = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [results, setResults]   = useState<{ correct: boolean; word: string }[]>([]);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [phraseChosen, setPhraseChosen] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const TOTAL_CARDS = 8;
  const TOTAL_PHRASES = 4;

  const getPool = useCallback((diff: Difficulty) => {
    const cats = diff === 'beginner'
      ? ['Greetings', 'Emotions', 'Phrases']
      : diff === 'intermediate'
      ? ['Family', 'Needs', 'Colors', 'Numbers', 'School']
      : WORD_SIGNS.map(c => c.category);
    return WORD_SIGNS.filter(c => cats.includes(c.category));
  }, []);

  const startWords = useCallback((diff: Difficulty) => {
    initAudio();
    setDiff(diff);
    const pool = getPool(diff);
    const picked = shuffle(pool).slice(0, TOTAL_CARDS);
    setCards(picked);
    setCardIdx(0);
    setScore(0);
    setStreak(0);
    setResults([]);
    const allWords = WORD_SIGNS.map(c => c.word);
    const first = picked[0];
    setChoices(makeChoices(first.word, allWords));
    setChosen(null);
    setCorrect(null);
    setTimeLeft(20);
    setMode('words');
  }, [getPool]);

  // Timer
  useEffect(() => {
    if (mode !== 'words') return;
    if (chosen !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleWordAnswer('__timeout__');
          return 20;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode, cardIdx, chosen]); // eslint-disable-line

  const handleWordAnswer = useCallback((answer: string) => {
    if (chosen !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const card = cards[cardIdx];
    const isCorrect = answer === card.word;
    const timeBonus = answer !== '__timeout__' ? Math.round(timeLeft * 3) : 0;
    const pts = isCorrect ? 100 + timeBonus + streak * 15 : 0;
    const displayAnswer = answer === '__timeout__' ? card.word : answer;
    setChosen(displayAnswer);
    setCorrect(isCorrect);
    setResults(r => [...r, { correct: isCorrect, word: card.word }]);
    if (isCorrect) { sfx.success(); setScore(s => s + pts); setStreak(s => s + 1); }
    else { sfx.fail(); setStreak(0); }
    setTimeout(() => {
      const allWords = WORD_SIGNS.map(c => c.word);
      if (cardIdx + 1 >= TOTAL_CARDS) {
        const final = score + pts;
        saveLocalScore('signs', final);
        grantXP('language', final);
        if (final >= 700) sfx.levelUp();
        setScore(final);
        setMode('results');
      } else {
        const next = cards[cardIdx + 1];
        setChoices(makeChoices(next.word, allWords));
        setCardIdx(i => i + 1);
        setTimeLeft(20);
        setChosen(null);
        setCorrect(null);
      }
    }, 1600);
  }, [chosen, cards, cardIdx, timeLeft, streak, score]);

  const startFingerspell = useCallback(() => {
    initAudio();
    setMode('fingerspell');
  }, []);

  const startPhrases = useCallback(() => {
    initAudio();
    setPhraseIdx(0);
    setPhraseChosen(null);
    setMode('phrases');
  }, []);

  const card = cards[cardIdx];
  const correctCount = results.filter(r => r.correct).length;

  // Fingerspelling state
  const [spellInput, setSpellInput] = useState('');
  const [spellTarget, setSpellTarget] = useState('');
  const [spellFeedback, setSpellFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [spellScore, setSpellScore] = useState(0);
  const [spellRound, setSpellRound] = useState(0);
  const SPELL_ROUNDS = 10;

  const generateSpellTarget = useCallback(() => {
    const words = ['CAT', 'DOG', 'SUN', 'HI', 'LOVE', 'YES', 'NO', 'FUN', 'TREE', 'STAR', 'BOOK', 'PLAY', 'SIGN', 'HAND', 'COOL'];
    return words[Math.floor(Math.random() * words.length)];
  }, []);

  useEffect(() => {
    if (mode === 'fingerspell') {
      setSpellTarget(generateSpellTarget());
      setSpellInput('');
      setSpellFeedback(null);
      setSpellScore(0);
      setSpellRound(0);
    }
  }, [mode, generateSpellTarget]);

  const handleSpellSubmit = () => {
    if (!spellInput.trim()) return;
    const isCorrect = spellInput.trim().toUpperCase() === spellTarget;
    setSpellFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) { sfx.success(); setSpellScore(s => s + 100); }
    else sfx.fail();
    setTimeout(() => {
      if (spellRound + 1 >= SPELL_ROUNDS) {
        const final = isCorrect ? spellScore + 100 : spellScore;
        saveLocalScore('signs', final);
        setSpellScore(final);
        setMode('results');
      } else {
        setSpellRound(r => r + 1);
        setSpellTarget(generateSpellTarget());
        setSpellInput('');
        setSpellFeedback(null);
      }
    }, 1200);
  };

  const phrase = PHRASES[phraseIdx];
  const phraseChoices = shuffle(PHRASES.map(p => p.answer));

  return (
    <div className="min-h-dvh pt-16 pb-24 bg-midnight">
      <div className="fluid-container max-w-2xl py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/games/academy" className="glass p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} className="text-white/70" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">🤟 Sign Language</h1>
            <p className="text-white/40 text-sm">Learn ASL — American Sign Language</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Menu */}
          {mode === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-6">
                <div className="text-7xl mb-3">🤟</div>
                <h2 className="text-2xl font-black text-white">Sign Language Academy</h2>
                <p className="text-white/50 mt-2">Learn ASL through interactive games</p>
              </div>
              <div className="grid grid-cols-1 gap-4 mb-6">
                {[
                  { title: '🤲 Sign Recognition', desc: 'See a sign description → identify the word. 8 rounds.', action: () => {} },
                  { title: '✏️ Fingerspelling', desc: 'Read letter-by-letter descriptions → type the word. 10 rounds.', action: startFingerspell },
                  { title: '💬 Common Phrases', desc: 'Learn full ASL phrase descriptions and recognize them.', action: startPhrases },
                ].map((item, i) => (
                  <button key={i}
                    className="glass p-5 rounded-2xl text-left hover:bg-white/10 transition-all border border-white/10 hover:border-cobalt/30"
                    onClick={() => {
                      if (i === 0) setMode('select');
                      else item.action();
                    }}>
                    <div className="text-white font-bold text-lg">{item.title}</div>
                    <div className="text-white/50 text-sm mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
              {/* Quick reference */}
              <div className="glass-dark rounded-2xl p-4 border border-white/10">
                <h3 className="text-white font-bold mb-3 text-sm">Quick Reference — Alphabet</h3>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(ALPHABET).slice(0, 15).map(([letter, data]) => (
                    <div key={letter} className="text-center">
                      <div className="text-xl">{data.emoji}</div>
                      <div className="text-white/70 text-xs font-bold">{letter}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Difficulty select for words */}
          {mode === 'select' && (
            <motion.div key="diff" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-xl font-bold text-white mb-4">Choose difficulty</h2>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { d: 'beginner', label: 'Beginner', desc: 'Greetings, emotions, phrases', color: '#00FF88' },
                  { d: 'intermediate', label: 'Intermediate', desc: 'Family, colors, needs', color: '#FFD700' },
                  { d: 'advanced', label: 'Advanced', desc: 'All categories', color: '#FF4444' },
                ] as const).map(({ d, label, desc, color }) => (
                  <button key={d} onClick={() => startWords(d)}
                    className="p-4 glass rounded-2xl text-center border border-white/10 hover:border-opacity-60 transition-all"
                    style={{ borderColor: `${color}33` }}>
                    <div className="text-2xl mb-2">🤟</div>
                    <div className="font-bold text-white">{label}</div>
                    <div className="text-white/40 text-xs mt-1">{desc}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Word recognition */}
          {mode === 'words' && card && (
            <motion.div key={`w-${cardIdx}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-white/40 text-sm">{cardIdx + 1}/{TOTAL_CARDS}</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full">
                  <div className="h-2 bg-cobalt-gradient rounded-full" style={{ width: `${(cardIdx / TOTAL_CARDS) * 100}%` }} />
                </div>
                <span className="font-bold text-sm" style={{ color: timeLeft <= 8 ? '#FF4444' : '#FFD700' }}>⏱ {timeLeft}s</span>
                <span className="text-gold text-sm font-bold">⭐ {score}</span>
              </div>
              {/* Sign card */}
              <div className="glass-dark rounded-2xl p-8 mb-6 text-center border border-cobalt/20">
                <div className="text-7xl mb-3">{card.sign}</div>
                <div className="text-sm text-cobalt-bright font-bold mb-2">{card.category}</div>
                <p className="text-white/80 text-sm leading-relaxed max-w-sm mx-auto">{card.description}</p>
              </div>
              <p className="text-white/50 text-sm mb-3 text-center">Which word does this sign represent?</p>
              <div className="grid grid-cols-2 gap-3">
                {choices.map((ch, i) => {
                  let cls = 'glass border-white/10 text-white hover:border-cobalt/40';
                  if (chosen !== null) {
                    if (ch === card.word) cls = 'bg-green-500/20 border-green-400/50 text-green-300';
                    else if (ch === chosen && !correct) cls = 'bg-red-500/20 border-red-400/50 text-red-300';
                    else cls = 'glass border-white/5 text-white/30';
                  }
                  return (
                    <button key={ch} onClick={() => handleWordAnswer(ch)} disabled={chosen !== null}
                      className={`p-4 rounded-xl border-2 font-bold transition-all ${cls}`}>
                      {ch}
                    </button>
                  );
                })}
              </div>
              {chosen !== null && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-3 rounded-xl text-sm ${correct ? 'bg-green-500/10 border border-green-500/20 text-green-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
                  {correct ? '✓ Correct! ' : `✗ It was "${card.word}". `}Keep practicing!
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Fingerspelling */}
          {mode === 'fingerspell' && (
            <motion.div key="spell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/50 text-sm">Round {spellRound + 1}/{SPELL_ROUNDS}</span>
                <span className="text-gold font-bold">⭐ {spellScore}</span>
              </div>
              <div className="glass-dark rounded-2xl p-6 mb-5 text-center border border-cobalt/20">
                <div className="text-sm text-cobalt-bright font-bold mb-3">Spell this word using ASL fingerspelling:</div>
                <div className="text-4xl font-black text-white tracking-widest mb-4">{spellTarget}</div>
                {/* Show each letter's handshape */}
                <div className="flex justify-center gap-3 flex-wrap">
                  {spellTarget.split('').map((letter, i) => (
                    <div key={i} className="text-center">
                      <div className="text-3xl">{ALPHABET[letter]?.emoji ?? '?'}</div>
                      <div className="text-white/50 text-xs font-bold">{letter}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-dark rounded-xl p-3 mb-4 text-xs text-white/50">
                {spellTarget.split('').map(l => ALPHABET[l]?.desc ?? '').join(' → ')}
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={spellInput}
                  onChange={e => setSpellInput(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === 'Enter') handleSpellSubmit(); }}
                  placeholder="Type the word..."
                  maxLength={15}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-bold text-lg focus:outline-none focus:border-cobalt/60 placeholder-white/30 tracking-widest"
                />
                <button onClick={handleSpellSubmit} className="btn-cobalt px-6 py-3 rounded-xl font-bold">
                  ✓
                </button>
              </div>
              {spellFeedback && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-3 rounded-xl text-sm text-center font-bold ${spellFeedback === 'correct' ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'}`}>
                  {spellFeedback === 'correct' ? '✓ Perfect fingerspelling!' : `✗ The word was "${spellTarget}". Try the next one!`}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Phrases */}
          {mode === 'phrases' && phrase && (
            <motion.div key={`ph-${phraseIdx}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/50 text-sm">Phrase {phraseIdx + 1}/{TOTAL_PHRASES}</span>
              </div>
              <div className="glass-dark rounded-2xl p-6 mb-5 text-center border border-cobalt/20">
                <div className="flex justify-center gap-4 text-5xl mb-4">
                  {phrase.signs.map((s, i) => <span key={i}>{s}</span>)}
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{phrase.description}</p>
              </div>
              <p className="text-white/50 text-sm mb-3 text-center">Which phrase is this?</p>
              <div className="space-y-3">
                {phraseChoices.slice(0, 4).map((ch, i) => {
                  let cls = 'glass border-white/10 text-white hover:border-cobalt/40';
                  if (phraseChosen !== null) {
                    if (ch === phrase.answer) cls = 'bg-green-500/20 border-green-400/50 text-green-300';
                    else if (ch === phraseChosen) cls = 'bg-red-500/20 border-red-400/50 text-red-300';
                    else cls = 'glass border-white/5 text-white/30';
                  }
                  return (
                    <button key={ch} disabled={phraseChosen !== null}
                      onClick={() => {
                        setPhraseChosen(ch);
                        if (ch === phrase.answer) sfx.success(); else sfx.fail();
                        setTimeout(() => {
                          if (phraseIdx + 1 >= TOTAL_PHRASES) {
                            saveLocalScore('signs', 400);
                            setMode('results');
                          } else {
                            setPhraseIdx(i => i + 1);
                            setPhraseChosen(null);
                          }
                        }, 1500);
                      }}
                      className={`w-full p-4 rounded-xl border-2 font-semibold transition-all ${cls}`}>
                      {ch}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Results */}
          {mode === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">🤟</div>
                <h2 className="text-2xl font-black text-white">
                  {correctCount >= TOTAL_CARDS * 0.8 ? 'ASL Master!' : 'Keep Signing!'}
                </h2>
                <div className="text-4xl font-black text-gold mt-2">{formatNumber(score)}</div>
                <p className="text-white/50 mt-1">{correctCount}/{TOTAL_CARDS} correct</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setMode('menu')} className="flex-1 btn-glass py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  <RotateCcw size={16} /> Menu
                </button>
                <button onClick={() => startWords(difficulty)} className="flex-1 btn-cobalt py-3 rounded-xl font-bold">
                  Play Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
