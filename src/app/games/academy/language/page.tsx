'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronLeft, RotateCcw, Trophy, Star, CheckCircle, XCircle, Clock } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import Link from 'next/link';
import { saveLocalScore, formatNumber } from '@/lib/utils';

type GameMode = 'menu' | 'scramble' | 'hangman' | 'anagram' | 'gameover';

// ─── Word Bank ────────────────────────────────────────────────────────────
const WORD_SETS: Record<string, { word: string; hint: string }[]> = {
  science: [
    { word: 'QUANTUM', hint: 'Smallest discrete unit of energy' },
    { word: 'NEURON', hint: 'Nerve cell in the brain' },
    { word: 'PHOTON', hint: 'Particle of light' },
    { word: 'ENTROPY', hint: 'Measure of disorder in a system' },
    { word: 'CATALYST', hint: 'Speeds up a chemical reaction' },
    { word: 'NUCLEUS', hint: 'Core of an atom or cell' },
    { word: 'VELOCITY', hint: 'Speed in a given direction' },
    { word: 'PLASMA', hint: 'Fourth state of matter' },
    { word: 'POLYMER', hint: 'Large molecule of repeated units' },
    { word: 'ISOTOPE', hint: 'Same element, different neutrons' },
  ],
  language: [
    { word: 'ELOQUENT', hint: 'Fluent and persuasive in speech' },
    { word: 'VERBOSE', hint: 'Using more words than needed' },
    { word: 'SYNTAX', hint: 'Rules for arranging words in a sentence' },
    { word: 'METAPHOR', hint: 'A figure of speech comparing two things' },
    { word: 'LEXICON', hint: 'The vocabulary of a person or language' },
    { word: 'DICTION', hint: 'The choice and use of words' },
    { word: 'PROSODY', hint: 'The patterns of rhythm in poetry' },
    { word: 'EPITHET', hint: 'Describing phrase for a person or thing' },
    { word: 'RHETORIC', hint: 'The art of effective speaking or writing' },
    { word: 'CADENCE', hint: 'Rhythmic rise and fall of the voice' },
  ],
  elite: [
    { word: 'ALGORITHM', hint: 'Step-by-step procedure for solving a problem' },
    { word: 'BYZANTINE', hint: 'Excessively complicated and detailed' },
    { word: 'EPHEMERAL', hint: 'Lasting for a very short time' },
    { word: 'JUXTAPOSE', hint: 'Place side by side for contrast' },
    { word: 'LABYRINTH', hint: 'Intricate network of paths' },
    { word: 'MELANCHOLY', hint: 'Deep pensive sadness' },
    { word: 'OMNISCIENT', hint: 'Knowing everything' },
    { word: 'PARADOX', hint: 'Seemingly absurd yet true statement' },
    { word: 'RESILIENCE', hint: 'Ability to recover from difficulties' },
    { word: 'SYNTHESIS', hint: 'Combining elements to form a whole' },
  ],
};

function shuffleWord(word: string): string {
  const arr = word.split('');
  let shuffled: string;
  do {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    shuffled = arr.join('');
  } while (shuffled === word);
  return shuffled;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function LanguageDojo() {
  const [mode, setMode] = useState<GameMode>('menu');
  const [category, setCategory] = useState<string>('science');
  const [currentMode, setCurrentMode] = useState<'scramble' | 'hangman' | 'anagram'>('scramble');
  const [wordEntry, setWordEntry] = useState<{ word: string; hint: string } | null>(null);
  const [scrambled, setScrambled] = useState('');
  const [input, setInput] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(10);
  const [timeLeft, setTimeLeft] = useState(30);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const MAX_WRONG = 6;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getWordPool = useCallback(() => {
    return WORD_SETS[category] ?? WORD_SETS.science;
  }, [category]);

  const startRound = useCallback((roundMode: 'scramble' | 'hangman' | 'anagram') => {
    const entry = pickRandom(getWordPool());
    setWordEntry(entry);
    setCurrentMode(roundMode);
    setFeedback(null);
    setInput('');
    setGuessedLetters([]);
    setWrongGuesses(0);
    setTimeLeft(roundMode === 'hangman' ? 60 : 30);

    if (roundMode === 'scramble') setScrambled(shuffleWord(entry.word));
    if (roundMode === 'anagram') {
      // Show all letters jumbled
      setScrambled(shuffleWord(entry.word));
    }
    setMode(roundMode);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [getWordPool]);

  const startGame = () => {
    setScore(0);
    setRound(1);
    startRound('scramble');
  };

  // Timer
  useEffect(() => {
    if (mode === 'menu' || mode === 'gameover' || feedback !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setFeedback('wrong');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode, wordEntry, feedback]);

  // Auto-advance
  useEffect(() => {
    if (feedback === null) return;
    const t = setTimeout(() => {
      if (round >= totalRounds) {
        setMode('gameover');
        saveLocalScore('language', score);
      } else {
        setRound((r) => r + 1);
        const modes = ['scramble', 'hangman', 'anagram'] as const;
        startRound(modes[Math.floor(Math.random() * modes.length)]);
      }
    }, 1800);
    return () => clearTimeout(t);
  }, [feedback, round, totalRounds, score, startRound]);

  const checkAnswer = () => {
    if (!wordEntry || !input.trim()) return;
    if (input.toUpperCase() === wordEntry.word) {
      const bonus = Math.ceil((timeLeft / 30) * 50);
      setScore((s) => s + 200 + bonus);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }
  };

  const guessLetter = (letter: string) => {
    if (!wordEntry || guessedLetters.includes(letter) || feedback !== null) return;
    const updated = [...guessedLetters, letter];
    setGuessedLetters(updated);

    if (!wordEntry.word.includes(letter)) {
      const newWrong = wrongGuesses + 1;
      setWrongGuesses(newWrong);
      if (newWrong >= MAX_WRONG) setFeedback('wrong');
    } else {
      // Check if word is fully revealed
      const revealed = wordEntry.word.split('').every((c) => updated.includes(c));
      if (revealed) {
        const bonus = Math.ceil((timeLeft / 60) * 100);
        setScore((s) => s + 300 + bonus);
        setFeedback('correct');
      }
    }
  };

  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Hangman SVG figure
  const renderHangman = () => {
    const parts = [
      // Gallows
      <line key="g1" x1="20" y1="120" x2="80" y2="120" stroke="#4A6FA5" strokeWidth="3"/>,
      <line key="g2" x1="50" y1="120" x2="50" y2="20" stroke="#4A6FA5" strokeWidth="3"/>,
      <line key="g3" x1="50" y1="20" x2="90" y2="20" stroke="#4A6FA5" strokeWidth="3"/>,
      <line key="g4" x1="90" y1="20" x2="90" y2="35" stroke="#4A6FA5" strokeWidth="2"/>,
      // Body parts appear with wrong guesses
      wrongGuesses >= 1 && <circle key="head" cx="90" cy="45" r="10" stroke="#00AAFF" strokeWidth="2" fill="none"/>,
      wrongGuesses >= 2 && <line key="body" x1="90" y1="55" x2="90" y2="85" stroke="#00AAFF" strokeWidth="2"/>,
      wrongGuesses >= 3 && <line key="larm" x1="90" y1="65" x2="75" y2="78" stroke="#00AAFF" strokeWidth="2"/>,
      wrongGuesses >= 4 && <line key="rarm" x1="90" y1="65" x2="105" y2="78" stroke="#00AAFF" strokeWidth="2"/>,
      wrongGuesses >= 5 && <line key="lleg" x1="90" y1="85" x2="75" y2="100" stroke="#00AAFF" strokeWidth="2"/>,
      wrongGuesses >= 6 && <line key="rleg" x1="90" y1="85" x2="105" y2="100" stroke="#00AAFF" strokeWidth="2"/>,
    ];
    return (
      <svg width="130" height="130" className="mx-auto">
        {parts}
      </svg>
    );
  };

  return (
    <div className="min-h-dvh pt-16 md:pt-20 pb-24">
      <div className="fluid-container py-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="p-2 glass rounded-xl text-white/50 hover:text-white transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-cobalt-bright" />
              <h1 className="text-xl font-bold text-white">Language Dojo</h1>
              <span className="text-xs text-white/30">The Academy</span>
            </div>
            <p className="text-xs text-white/40">Master the architecture of language.</p>
          </div>
        </div>

        {/* MENU */}
        {mode === 'menu' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-8 text-center mb-6">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-white mb-2">Language Dojo</h2>
              <p className="text-white/50 text-sm">
                10 rounds mixing Word Scramble, Hangman, and Anagram. Three word categories.
              </p>
            </GlassCard>
            <GlassCard className="p-5 mb-4">
              <h3 className="text-sm font-semibold text-white mb-3">Word Category</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.keys(WORD_SETS).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`p-3 rounded-xl text-sm font-medium capitalize transition-all border ${
                      category === cat ? 'bg-cobalt/20 border-cobalt/40 text-cobalt-light' : 'glass border-transparent text-white/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </GlassCard>
            <button onClick={startGame} className="btn-cobalt w-full py-4">Begin Training</button>
          </motion.div>
        )}

        {/* SCRAMBLE / ANAGRAM */}
        {(mode === 'scramble' || mode === 'anagram') && wordEntry && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-white/50">Round {round}/{totalRounds}</span>
              <div className="glass px-3 py-1 rounded-xl flex items-center gap-1.5 text-sm">
                <Clock size={12} className="text-cobalt-light" />{timeLeft}s
              </div>
              <div className="glass px-3 py-1 rounded-xl text-sm font-bold">
                <Trophy size={12} className="inline mr-1 text-yellow-400" />{formatNumber(score)}
              </div>
            </div>

            <GlassCard className={`p-8 text-center mb-4 ${
              feedback === 'correct' ? 'border-green-400/30' : feedback === 'wrong' ? 'border-red-400/30' : ''
            }`}>
              <div className="text-xs text-cobalt-light mb-3 uppercase tracking-wider font-medium">
                {mode === 'scramble' ? 'Unscramble the word' : 'Rearrange the letters'}
              </div>
              <div className="text-4xl font-bold tracking-[0.25em] text-white mb-4">{scrambled}</div>
              <div className="text-xs text-white/40 italic mb-4">💡 {wordEntry.hint}</div>

              {feedback && (
                <div className={`text-sm font-medium ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                  {feedback === 'correct' ? (
                    <><CheckCircle size={16} className="inline mr-1" />Correct! +{200 + Math.ceil((timeLeft/30)*50)} pts</>
                  ) : (
                    <><XCircle size={16} className="inline mr-1" />Answer: {wordEntry.word}</>
                  )}
                </div>
              )}
            </GlassCard>

            {feedback === null && (
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                  placeholder="Type your answer..."
                  className="flex-1 px-4 py-3 rounded-xl glass border border-white/10 text-white bg-transparent focus:border-cobalt/40 outline-none uppercase tracking-wider text-lg"
                  maxLength={20}
                  autoComplete="off"
                />
                <button onClick={checkAnswer} className="btn-cobalt px-6">Submit</button>
              </div>
            )}
          </motion.div>
        )}

        {/* HANGMAN */}
        {mode === 'hangman' && wordEntry && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-white/50">Round {round}/{totalRounds}</span>
              <div className="glass px-3 py-1 rounded-xl flex items-center gap-1.5 text-sm">
                <Clock size={12} className="text-cobalt-light" />{timeLeft}s
              </div>
              <div className="glass px-3 py-1 rounded-xl text-sm font-bold">
                <Trophy size={12} className="inline mr-1 text-yellow-400" />{formatNumber(score)}
              </div>
            </div>

            <GlassCard className={`p-6 mb-4 ${
              feedback === 'correct' ? 'border-green-400/30' : feedback === 'wrong' ? 'border-red-400/30' : ''
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-cobalt-light mb-2 uppercase tracking-wider">Hangman</div>
                  {/* Word display */}
                  <div className="flex gap-2 mb-3">
                    {wordEntry.word.split('').map((c, i) => (
                      <div key={i} className="w-8 border-b-2 border-cobalt/50 text-center text-lg font-bold text-white pb-1">
                        {guessedLetters.includes(c) ? c : ''}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-white/40 italic">💡 {wordEntry.hint}</div>
                  <div className="text-xs text-red-400 mt-2">{wrongGuesses}/{MAX_WRONG} mistakes</div>
                  {feedback && (
                    <div className={`text-sm mt-2 font-medium ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                      {feedback === 'correct' ? '✓ Excellent!' : `Answer: ${wordEntry.word}`}
                    </div>
                  )}
                </div>
                {renderHangman()}
              </div>
            </GlassCard>

            {/* Keyboard */}
            {feedback === null && (
              <div className="flex flex-wrap gap-1.5 justify-center">
                {ALPHABET.map((letter) => {
                  const guessed = guessedLetters.includes(letter);
                  const correct = wordEntry.word.includes(letter) && guessed;
                  const wrong = !wordEntry.word.includes(letter) && guessed;
                  return (
                    <button
                      key={letter}
                      onClick={() => guessLetter(letter)}
                      disabled={guessed}
                      className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                        correct ? 'bg-green-500/30 text-green-400 border border-green-400/40' :
                        wrong ? 'bg-red-500/10 text-red-400/40 border border-red-400/20' :
                        'glass text-white hover:bg-cobalt/20 hover:text-cobalt-light'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* GAME OVER */}
        {mode === 'gameover' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <GlassCard variant="cobalt" className="p-8 text-center">
              <div className="text-5xl mb-4">🎓</div>
              <h2 className="text-2xl font-bold text-white mb-1">Training Complete!</h2>
              <p className="text-white/50 text-sm mb-6">{totalRounds} rounds of linguistic mastery</p>
              <div className="text-3xl font-bold text-cobalt-gradient mb-2">{formatNumber(score)}</div>
              <div className="flex justify-center gap-1 mb-6">
                {[1,2,3].map((s) => (
                  <Star key={s} size={20} className={score >= s * 2000 ? 'text-yellow-400' : 'text-white/20'} fill={score >= s * 2000 ? '#FFD700' : 'none'} />
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={startGame} className="btn-cobalt flex-1">
                  <RotateCcw size={14} /> Play Again
                </button>
                <Link href="/" className="btn-glass flex-1 text-sm flex items-center justify-center">
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
