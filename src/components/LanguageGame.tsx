'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Trophy, Star, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { saveLocalScore, formatNumber } from '@/lib/utils';
import { grantXP } from '@/lib/progression';
import { sfx, initAudio } from '@/lib/audio';
import { LangCode, LangLesson, LangWord, LangPhrase, LANG_META } from '@/lib/languages';

type Phase = 'menu' | 'lesson' | 'quiz' | 'practice' | 'results';
type QuizType = 'en2native' | 'native2en' | 'transliteration';

interface QuizQuestion {
  word: LangWord;
  questionText: string;
  correctAnswer: string;
  choices: string[];
  type: QuizType;
}

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

function makeQuizQuestion(word: LangWord, allWords: LangWord[], type: QuizType): QuizQuestion {
  let questionText = '';
  let correctAnswer = '';
  let choicePool: string[] = [];

  if (type === 'en2native') {
    questionText = `How do you say "${word.english}" ?`;
    correctAnswer = word.original;
    choicePool = allWords.filter(w => w.id !== word.id).map(w => w.original);
  } else if (type === 'native2en') {
    questionText = `What does "${word.original}" mean?`;
    correctAnswer = word.english;
    choicePool = allWords.filter(w => w.id !== word.id).map(w => w.english);
  } else {
    questionText = `What is the pronunciation of "${word.original}"?`;
    correctAnswer = word.transliteration;
    choicePool = allWords.filter(w => w.id !== word.id).map(w => w.transliteration);
  }

  const distractors = shuffle(choicePool).slice(0, 3);
  const choices = shuffle([correctAnswer, ...distractors]);
  return { word, questionText, correctAnswer, choices, type };
}

interface LanguageGameProps {
  lang: LangCode;
}

export default function LanguageGame({ lang }: LanguageGameProps) {
  const meta = LANG_META[lang];
  const [phase, setPhase]         = useState<Phase>('menu');
  const [lessonIdx, setLessonIdx] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIdx, setQIdx]           = useState(0);
  const [chosen, setChosen]       = useState<string | null>(null);
  const [correct, setCorrect]     = useState<boolean | null>(null);
  const [score, setScore]         = useState(0);
  const [streak, setStreak]       = useState(0);
  const [timeLeft, setTimeLeft]   = useState(20);
  const [results, setResults]     = useState<boolean[]>([]);
  const [learnedWords, setLearnedWords] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lesson = meta.lessons[lessonIdx];
  const allWords = meta.lessons.flatMap(l => l.words);

  const startQuiz = useCallback((selectedLesson: LangLesson) => {
    initAudio();
    const pool = selectedLesson.words;
    const allW = allWords.length >= 4 ? allWords : pool;
    const types: QuizType[] = ['native2en', 'en2native', 'native2en', 'en2native', 'transliteration', 'native2en', 'en2native', 'native2en'];
    const qs = shuffle(pool).slice(0, 8).map((word, i) =>
      makeQuizQuestion(word, allW, types[i % types.length])
    );
    setQuestions(qs);
    setQIdx(0);
    setScore(0);
    setStreak(0);
    setResults([]);
    setChosen(null);
    setCorrect(null);
    setTimeLeft(20);
    setPhase('quiz');
  }, [allWords]);

  // Timer
  useEffect(() => {
    if (phase !== 'quiz') return;
    if (chosen !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleAnswer('__timeout__');
          return 20;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, qIdx, chosen]); // eslint-disable-line

  const handleAnswer = useCallback((answer: string) => {
    if (chosen !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const q = questions[qIdx];
    const isCorrect = answer === q.correctAnswer;
    const timeBonus = answer !== '__timeout__' ? Math.round(timeLeft * 4) : 0;
    const pts = isCorrect ? 100 + timeBonus + streak * 10 : 0;
    setChosen(answer === '__timeout__' ? q.correctAnswer : answer);
    setCorrect(isCorrect);
    setResults(r => [...r, isCorrect]);
    if (isCorrect) {
      sfx.success();
      setScore(s => s + pts);
      setStreak(s => s + 1);
      setLearnedWords(lw => { const s = new Set(lw); s.add(q.word.id); return s; });
    } else {
      sfx.fail();
      setStreak(0);
    }
    setTimeout(() => {
      if (qIdx + 1 >= questions.length) {
        const final = score + pts;
        saveLocalScore(lang, final);
        grantXP('language', final);
        if (final >= 700) sfx.levelUp();
        setScore(final);
        setPhase('results');
      } else {
        setQIdx(i => i + 1);
        setTimeLeft(20);
        setChosen(null);
        setCorrect(null);
      }
    }, 1600);
  }, [chosen, questions, qIdx, timeLeft, streak, score, lang]);

  const q = questions[qIdx];
  const correctCount = results.filter(Boolean).length;

  return (
    <div className="min-h-dvh pt-16 pb-24 bg-midnight">
      <div className="fluid-container max-w-2xl py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/games/academy" className="glass p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} className="text-white/70" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">{meta.flag} {meta.name}</h1>
            <p className="text-white/40 text-sm">{meta.nativeName} — Language Academy</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* MENU */}
          {phase === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass-dark rounded-2xl p-5 mb-5 border border-white/10">
                <div className="text-4xl mb-2">{meta.flag}</div>
                <p className="text-white/60 text-sm">{meta.funFact}</p>
              </div>

              <h2 className="text-white font-bold text-lg mb-3">Choose a Lesson</h2>
              <div className="space-y-3 mb-6">
                {meta.lessons.map((lesson, i) => (
                  <div key={lesson.id} className="glass rounded-2xl p-4 border border-white/10">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="text-white font-bold">{lesson.title}</div>
                        <div className="text-white/50 text-sm mt-0.5">{lesson.description}</div>
                        <div className="text-white/30 text-xs mt-1">{lesson.words.length} words · {lesson.phrases.length} phrases</div>
                      </div>
                      <div className="text-2xl">{i === 0 ? '⭐' : i === 1 ? '🔢' : '👨‍👩‍👧'}</div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { setLessonIdx(i); setPhase('lesson'); }}
                        className="flex-1 py-2 glass border border-white/10 rounded-xl text-white text-sm font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                        <BookOpen size={14} /> Study
                      </button>
                      <button onClick={() => { setLessonIdx(i); startQuiz(lesson); }}
                        className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                        style={{ background: `${meta.color}22`, border: `1px solid ${meta.color}44`, color: meta.color }}>
                        ⚡ Quiz
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {learnedWords.size > 0 && (
                <div className="glass-dark rounded-xl p-3 border border-white/10 text-center">
                  <span className="text-gold font-bold">⭐ {learnedWords.size}</span>
                  <span className="text-white/40 text-sm"> words learned this session</span>
                </div>
              )}
            </motion.div>
          )}

          {/* LESSON (Study mode) */}
          {phase === 'lesson' && (
            <motion.div key="lesson" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setPhase('menu')} className="text-white/40 hover:text-white text-sm">← Back</button>
                <h2 className="text-white font-bold text-lg">{lesson.title}</h2>
              </div>

              {/* Script note */}
              <div className="glass-dark rounded-xl p-3 mb-4 border border-white/10">
                <div className="text-xs text-cobalt-bright font-bold mb-1">📚 Script Note</div>
                <p className="text-white/60 text-sm">{lesson.script_note}</p>
              </div>

              {/* Word cards */}
              <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Vocabulary</h3>
              <div className="space-y-2 mb-5">
                {lesson.words.map(word => (
                  <div key={word.id} className="glass rounded-xl p-3 border border-white/10 flex items-center gap-4">
                    <div className="text-xl font-bold text-white min-w-[80px]" style={{ color: meta.color }}>{word.original}</div>
                    <div className="flex-1">
                      <div className="text-white/80 text-sm">{word.english}</div>
                      <div className="text-white/40 text-xs italic">{word.transliteration}</div>
                      {word.audio_hint && <div className="text-white/30 text-xs">🔊 {word.audio_hint}</div>}
                    </div>
                    <div className="text-white/30 text-xs">{word.category}</div>
                  </div>
                ))}
              </div>

              {/* Phrases */}
              <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Phrases</h3>
              <div className="space-y-2 mb-5">
                {lesson.phrases.map(ph => (
                  <div key={ph.id} className="glass rounded-xl p-3 border border-white/10">
                    <div className="text-white font-bold">{ph.original}</div>
                    <div className="text-white/50 text-sm italic">{ph.transliteration}</div>
                    <div className="text-white/70 text-sm">{ph.english}</div>
                    <div className="text-white/30 text-xs mt-1">💬 {ph.context}</div>
                  </div>
                ))}
              </div>

              <button onClick={() => startQuiz(lesson)}
                className="w-full btn-cobalt py-3 rounded-xl font-bold text-lg">
                ⚡ Quiz This Lesson
              </button>
            </motion.div>
          )}

          {/* QUIZ */}
          {phase === 'quiz' && q && (
            <motion.div key={`q-${qIdx}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              {/* Progress */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-white/40 text-sm">{qIdx + 1}/{questions.length}</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${(qIdx / questions.length) * 100}%`, background: meta.color }} />
                </div>
                <span className="font-bold text-sm" style={{ color: timeLeft <= 8 ? '#FF4444' : '#FFD700' }}>⏱ {timeLeft}s</span>
                <span className="text-gold font-bold text-sm">⭐ {score}</span>
              </div>

              {/* Question */}
              <div className="glass-dark rounded-2xl p-6 mb-5 text-center border border-white/10">
                {streak >= 3 && <div className="text-sm font-bold text-orange-400 mb-2">🔥 {streak} streak!</div>}
                <div className="text-white/60 text-sm mb-2">{q.type === 'native2en' ? 'Translation' : q.type === 'en2native' ? 'Write in ' + meta.name : 'Pronunciation'}</div>
                <div className="text-2xl font-black text-white leading-relaxed">{q.questionText}</div>
                {q.type === 'en2native' && (
                  <div className="text-white/40 text-sm mt-2 italic">Hint: {q.word.transliteration}</div>
                )}
              </div>

              {/* Choices */}
              <div className="grid grid-cols-2 gap-3">
                {q.choices.map(ch => {
                  let cls = 'glass border-white/10 text-white hover:border-opacity-60';
                  if (chosen !== null) {
                    if (ch === q.correctAnswer) cls = 'bg-green-500/20 border-green-400/50 text-green-300';
                    else if (ch === chosen && !correct) cls = 'bg-red-500/20 border-red-400/50 text-red-300';
                    else cls = 'glass border-white/5 text-white/30';
                  }
                  return (
                    <button key={ch} onClick={() => handleAnswer(ch)} disabled={chosen !== null}
                      className={`p-4 rounded-xl border-2 font-semibold transition-all leading-snug ${cls}`}
                      style={chosen === null ? { borderColor: `${meta.color}33` } : {}}>
                      {ch}
                    </button>
                  );
                })}
              </div>

              {chosen !== null && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-3 rounded-xl text-sm ${correct ? 'bg-green-500/10 border border-green-500/20 text-green-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
                  {correct
                    ? `✓ Correct! "${q.word.original}" = ${q.word.english} (${q.word.transliteration})`
                    : `✗ Correct answer: "${q.correctAnswer}"`}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* RESULTS */}
          {phase === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">{meta.flag}</div>
                <h2 className="text-2xl font-black text-white">
                  {correctCount >= 7 ? 'Excellent! 🏆' : correctCount >= 5 ? 'Good work! 👍' : 'Keep practicing!'}
                </h2>
                <div className="text-4xl font-black text-gold mt-2">{formatNumber(score)}</div>
                <p className="text-white/50 mt-1">{correctCount}/{questions.length} correct</p>
              </div>

              {/* Per-question breakdown */}
              <div className="glass-dark rounded-2xl p-4 mb-5 border border-white/10">
                <div className="grid grid-cols-8 gap-1">
                  {results.map((r, i) => (
                    <div key={i} className={`h-3 rounded-full ${r ? 'bg-green-500' : 'bg-red-500/60'}`} />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-white/40">
                  <span>{correctCount} correct</span>
                  <span>{questions.length - correctCount} wrong</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPhase('menu')} className="flex-1 btn-glass py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  <RotateCcw size={16} /> Menu
                </button>
                <button onClick={() => startQuiz(lesson)} className="flex-1 py-3 rounded-xl font-bold transition-all"
                  style={{ background: `${meta.color}22`, border: `1px solid ${meta.color}44`, color: meta.color }}>
                  ⚡ Retry Quiz
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
