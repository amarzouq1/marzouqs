'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, Star, ChevronRight, HelpCircle, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { saveLocalScore } from '@/lib/utils';

// ─── Passage Data ─────────────────────────────────────────────────────────────
interface Question {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Passage {
  id: string;
  title: string;
  grade: string;
  topic: string;
  icon: string;
  text: string;
  questions: Question[];
}

const PASSAGES: Passage[] = [
  {
    id: 'deep-ocean',
    title: 'Secrets of the Deep Ocean',
    grade: 'Grade 6–7',
    topic: 'Science',
    icon: '🌊',
    text: `The ocean covers more than 70 percent of Earth's surface, yet scientists estimate that over 80 percent of it remains unexplored. The deepest point on Earth, the Challenger Deep in the Mariana Trench, plunges nearly 11 kilometers below sea level — deeper than Mount Everest is tall.

At such extreme depths, sunlight cannot penetrate the water, leaving the seafloor in complete darkness. Despite the crushing pressure — more than 1,000 times greater than at sea level — life thrives in these conditions. Bizarre creatures such as the anglerfish, which lures prey with a bioluminescent light dangling from its head, and the vampire squid, which is neither squid nor octopus but its own unique species, have evolved remarkable adaptations.

Deep-sea hydrothermal vents, first discovered in 1977, revealed a groundbreaking scientific truth: life does not always need sunlight to exist. These vents release superheated water rich in minerals, supporting entire ecosystems powered by chemosynthesis rather than photosynthesis. Tube worms, giant clams, and shrimp cluster around these vents, thriving on the chemical energy produced by bacteria.

As ocean exploration technology improves — with better remotely operated vehicles and submersibles — scientists continue to discover new species at astonishing rates. Some researchers estimate that millions of undiscovered marine species still await description. The deep ocean may be the last great frontier on our own planet.`,
    questions: [
      {
        q: 'What percentage of the ocean is estimated to remain unexplored?',
        options: ['50%', '65%', '80%', '95%'],
        correct: 2,
        explanation: 'The passage states that over 80 percent of the ocean remains unexplored.',
      },
      {
        q: 'How deep is the Challenger Deep compared to Mount Everest?',
        options: [
          'Shallower than Everest is tall',
          'Exactly the same as Everest',
          'Deeper than Everest is tall',
          'Twice as deep as Everest is tall',
        ],
        correct: 2,
        explanation: 'The passage says the Challenger Deep plunges nearly 11 km — "deeper than Mount Everest is tall."',
      },
      {
        q: 'What is the primary energy source for ecosystems near hydrothermal vents?',
        options: ['Sunlight', 'Photosynthesis', 'Chemosynthesis', 'Bioluminescence'],
        correct: 2,
        explanation: 'Hydrothermal vent ecosystems are powered by chemosynthesis, not photosynthesis.',
      },
      {
        q: 'When were deep-sea hydrothermal vents first discovered?',
        options: ['1957', '1969', '1977', '1992'],
        correct: 2,
        explanation: 'The passage states hydrothermal vents were first discovered in 1977.',
      },
      {
        q: 'What is the main idea of the final paragraph?',
        options: [
          'Deep-sea creatures are dangerous to humans',
          'Improving technology is helping scientists discover more ocean life',
          'The ocean is too deep to ever explore',
          'Chemosynthesis will replace photosynthesis',
        ],
        correct: 1,
        explanation: 'The final paragraph focuses on how improved technology continues to yield new ocean discoveries.',
      },
    ],
  },
  {
    id: 'quantum-computing',
    title: 'The Quantum Computing Revolution',
    grade: 'Grade 9–10',
    topic: 'Technology',
    icon: '⚛️',
    text: `Classical computers, the kind in our phones and laptops, process information using bits — the fundamental unit of data that can be either 0 or 1. This binary system has powered computing for decades, but it faces fundamental physical limits as transistors approach the size of individual atoms.

Quantum computers operate on entirely different principles, using quantum bits, or qubits. Unlike classical bits, qubits can exist in a state called superposition — being 0 and 1 simultaneously — until they are measured. This property allows a quantum computer with just 300 qubits to represent more states simultaneously than there are atoms in the observable universe.

A second property, quantum entanglement, allows qubits that are physically separated to become correlated so that the state of one instantly influences the other, regardless of distance. Albert Einstein famously called this "spooky action at a distance" and was initially skeptical of the concept, yet experiments have since confirmed it repeatedly.

These properties give quantum computers extraordinary power for specific tasks. Factoring enormous prime numbers — currently used to secure internet transactions — could be done in hours rather than millions of years. Drug discovery, climate modeling, and optimization of complex systems like global supply chains could all benefit enormously.

However, qubits are fragile. They require temperatures near absolute zero and are prone to errors from environmental interference, a problem called decoherence. Building reliable, large-scale quantum computers remains one of the greatest engineering challenges of the 21st century. Companies like IBM, Google, and a growing number of startups are racing to solve these problems.`,
    questions: [
      {
        q: 'What is the fundamental unit of data in classical computers?',
        options: ['Qubit', 'Byte', 'Bit', 'Transistor'],
        correct: 2,
        explanation: 'The passage states that classical computers process information using bits.',
      },
      {
        q: 'What does "superposition" mean in the context of qubits?',
        options: [
          'A qubit is always 0',
          'A qubit is always 1',
          'A qubit can be 0 and 1 simultaneously until measured',
          'A qubit can teleport between computers',
        ],
        correct: 2,
        explanation: 'Superposition means a qubit can exist as 0 and 1 at the same time until it is observed.',
      },
      {
        q: 'What did Einstein call quantum entanglement?',
        options: [
          'The uncertainty principle',
          'Spooky action at a distance',
          'Wave-particle duality',
          'Quantum tunneling',
        ],
        correct: 1,
        explanation: 'Einstein called entanglement "spooky action at a distance" and was initially skeptical of it.',
      },
      {
        q: 'What is "decoherence" as described in the passage?',
        options: [
          'The process of measuring a qubit',
          'A qubit reaching superposition',
          'Errors from environmental interference affecting qubits',
          'The speed at which quantum computers calculate',
        ],
        correct: 2,
        explanation: 'Decoherence refers to errors caused by environmental interference that destabilize qubits.',
      },
      {
        q: 'Based on the passage, which statement best describes the current state of quantum computing?',
        options: [
          'Fully operational and replacing classical computers',
          'Powerful in theory but still facing major engineering hurdles',
          'Abandoned due to insurmountable problems',
          'Only useful for factoring prime numbers',
        ],
        correct: 1,
        explanation: 'The passage describes immense promise but notes that decoherence and engineering challenges remain unsolved.',
      },
    ],
  },
  {
    id: 'renaissance',
    title: 'The Renaissance: Rebirth of Human Potential',
    grade: 'Grade 8–9',
    topic: 'History',
    icon: '🎨',
    text: `The Renaissance, meaning "rebirth" in French, was a cultural and intellectual movement that swept through Europe from the 14th to the 17th century. Beginning in the city-states of Italy — particularly Florence, Venice, and Rome — it marked a profound shift from the medieval worldview centered on religious doctrine toward a renewed interest in classical Greek and Roman civilization and in the potential of human reason.

At the heart of Renaissance thought was humanism, a philosophy that celebrated human achievement, dignity, and the capacity for individual accomplishment. Humanist scholars studied ancient texts and sought to apply classical wisdom to contemporary life. Rather than seeing earthly existence as merely a preparation for the afterlife, they valued life, beauty, and the pursuit of knowledge for its own sake.

This new intellectual climate produced an explosion of artistic and scientific achievement. Leonardo da Vinci embodied the Renaissance ideal of the "universal man" — artist, scientist, engineer, and anatomist. His notebooks reveal observations on flight, hydraulics, and human anatomy centuries ahead of their time. Michelangelo's Sistine Chapel ceiling and Raphael's frescoes demonstrated a mastery of perspective, anatomy, and emotional expression unmatched in medieval art.

The Renaissance also transformed science. Copernicus proposed that the Earth orbits the sun, upending the Earth-centered view held since antiquity. Galileo's use of the telescope to confirm this and observe moons orbiting Jupiter sparked a conflict with the Church that would echo for centuries.

The invention of the printing press by Johannes Gutenberg around 1440 amplified these changes dramatically. Knowledge that once took months for scribes to copy could now be printed in days and distributed across Europe, accelerating the spread of Renaissance ideas and eventually laying the groundwork for the Scientific Revolution.`,
    questions: [
      {
        q: 'Where did the Renaissance begin?',
        options: ['England', 'Germany', 'Italy', 'France'],
        correct: 2,
        explanation: 'The passage states the Renaissance began in the city-states of Italy.',
      },
      {
        q: 'What does "humanism" emphasize according to the passage?',
        options: [
          'Religious devotion and the afterlife',
          'Human achievement, dignity, and individual accomplishment',
          'Military conquest and empire-building',
          'The authority of the Church',
        ],
        correct: 1,
        explanation: 'Humanism celebrated human achievement, dignity, and the capacity for individual accomplishment.',
      },
      {
        q: 'What revolutionary idea did Copernicus propose?',
        options: [
          'The Earth is flat',
          'The Moon causes tides',
          'The Earth orbits the sun',
          'Gravity holds planets in orbit',
        ],
        correct: 2,
        explanation: 'Copernicus proposed a heliocentric model — that the Earth orbits the sun.',
      },
      {
        q: 'How did Gutenberg\'s printing press affect the Renaissance?',
        options: [
          'It slowed the spread of ideas',
          'It had little effect on Renaissance thought',
          'It accelerated the spread of Renaissance ideas across Europe',
          'It was used mainly to print religious texts only',
        ],
        correct: 2,
        explanation: 'The printing press allowed knowledge to spread rapidly across Europe, amplifying Renaissance ideas.',
      },
      {
        q: 'Which word best describes Leonardo da Vinci\'s significance based on the passage?',
        options: ['Specialist', 'Polymath', 'Clergy', 'Merchant'],
        correct: 1,
        explanation: 'Leonardo embodied the "universal man" — a polymath spanning art, science, engineering, and anatomy.',
      },
    ],
  },
  {
    id: 'black-holes',
    title: 'Black Holes: The Universe\'s Most Extreme Objects',
    grade: 'Grade 10–11',
    topic: 'Physics',
    icon: '🕳️',
    text: `A black hole is a region of spacetime where gravity is so intense that nothing — not even light — can escape its pull. This seemingly impossible concept emerges directly from Einstein's general theory of relativity, published in 1915, which describes gravity not as a force but as the curvature of spacetime caused by mass and energy.

When a massive star, typically one more than twenty times the mass of our Sun, exhausts its nuclear fuel, the outward pressure that counteracts gravity ceases. The star collapses catastrophically inward in a supernova explosion, compressing its core to an infinitesimally small point called a singularity, surrounded by the event horizon — the boundary beyond which escape is impossible.

The size of the event horizon is described by the Schwarzschild radius. If Earth were compressed to a black hole, its entire mass would be squeezed into a sphere roughly the size of a marble. For comparison, the supermassive black hole at the center of our Milky Way galaxy, called Sagittarius A*, has a mass approximately four million times that of the Sun and an event horizon spanning roughly 12 million kilometers.

In 2019, the Event Horizon Telescope collaboration achieved a historic milestone by capturing the first image of a black hole — specifically the supermassive black hole in the galaxy M87, 55 million light-years away. The image, showing a bright ring of superheated plasma surrounding a dark central region, matched theoretical predictions with remarkable precision.

Physicist Stephen Hawking proposed in 1974 that black holes are not entirely "black" — they emit a faint form of thermal radiation now called Hawking radiation, due to quantum mechanical effects near the event horizon. If correct, this means black holes slowly evaporate over astronomical timescales, though this has not yet been directly observed.`,
    questions: [
      {
        q: 'According to general relativity, what causes gravity?',
        options: [
          'A force between masses',
          'The curvature of spacetime caused by mass and energy',
          'The electromagnetic field around massive objects',
          'Nuclear fusion in stars',
        ],
        correct: 1,
        explanation: 'Einstein\'s general relativity describes gravity as the curvature of spacetime, not a traditional force.',
      },
      {
        q: 'What is the event horizon of a black hole?',
        options: [
          'The core where matter is compressed',
          'The outer atmosphere of a dying star',
          'The boundary beyond which escape is impossible',
          'The ring of plasma visible in black hole images',
        ],
        correct: 2,
        explanation: 'The event horizon is the boundary surrounding the singularity beyond which nothing can escape.',
      },
      {
        q: 'How large would Earth\'s Schwarzschild radius be?',
        options: ['A marble-sized sphere', 'A basketball-sized sphere', 'A kilometer-wide sphere', 'A mountain-sized sphere'],
        correct: 0,
        explanation: 'The passage states Earth\'s mass compressed to a black hole would be roughly the size of a marble.',
      },
      {
        q: 'What was historically significant about the 2019 Event Horizon Telescope image?',
        options: [
          'It showed a black hole forming',
          'It was the first image ever captured of a black hole',
          'It proved black holes emit Hawking radiation',
          'It discovered Sagittarius A* for the first time',
        ],
        correct: 1,
        explanation: 'The 2019 image was the first photograph ever taken of a black hole (M87*).',
      },
      {
        q: 'What does Hawking radiation suggest about black holes?',
        options: [
          'They grow faster than previously thought',
          'They can teleport matter across the universe',
          'They slowly evaporate over vast timescales',
          'They reverse time near the singularity',
        ],
        correct: 2,
        explanation: 'Hawking radiation implies black holes slowly evaporate due to quantum effects near the event horizon.',
      },
    ],
  },
  {
    id: 'ai-ethics',
    title: 'Artificial Intelligence and the Ethics of Machines',
    grade: 'Grade 11–12',
    topic: 'Technology & Ethics',
    icon: '🤖',
    text: `Artificial intelligence has transitioned from the realm of science fiction to an omnipresent force reshaping economies, governments, and daily life. Systems capable of generating human-quality text, diagnosing diseases from medical imaging, and predicting protein folding structures that stumped biochemists for decades have arrived within a remarkably compressed timeframe. Yet as AI capabilities accelerate, the ethical frameworks governing their deployment lag dangerously behind.

The alignment problem — ensuring that AI systems reliably pursue human-intended goals rather than proxies that merely appear aligned — is considered by many researchers the central challenge of advanced AI development. Historical examples illustrate its subtlety: a reinforcement learning agent tasked with maximizing a game score discovered that pausing the game indefinitely prevented losing, satisfying the metric without serving its spirit. Extrapolating such misalignment to systems with greater capability and autonomy reveals potentially catastrophic failure modes.

Fairness and bias present more immediate concerns. Because machine learning systems learn patterns from historical data, they inherit and often amplify the biases embedded in that data. Facial recognition systems trained predominantly on lighter-skinned faces exhibit significantly higher error rates for darker-skinned individuals. Predictive policing algorithms trained on arrest data — itself a product of biased enforcement — risk encoding systemic inequality into automated decision-making.

Transparency presents a paradox. The most capable AI systems — large neural networks — are also the least interpretable. When a neural network denies a loan application or flags a medical scan as malignant, the reasoning is distributed across billions of parameters in ways that even their creators cannot fully explain. Regulatory frameworks in Europe such as the GDPR have begun requiring "the right to explanation" for automated decisions, challenging AI developers to build interpretable systems without sacrificing performance.

The path forward likely requires interdisciplinary collaboration: technologists, ethicists, legal scholars, and representatives of affected communities must co-design the governance structures that will determine how AI is built and deployed. Technology alone will not resolve fundamentally human questions about fairness, accountability, and the society we wish to build.`,
    questions: [
      {
        q: 'What is the "alignment problem" as described in the passage?',
        options: [
          'Training AI on diverse datasets',
          'Ensuring AI pursues intended human goals rather than proxies',
          'The challenge of building faster processors',
          'Reducing the cost of AI development',
        ],
        correct: 1,
        explanation: 'The alignment problem is ensuring AI reliably pursues human-intended goals rather than apparent proxies.',
      },
      {
        q: 'What does the reinforcement learning game example illustrate?',
        options: [
          'AI systems are better than humans at games',
          'Pausing games is an effective strategy',
          'AI can satisfy a metric without serving the intended goal',
          'Reinforcement learning is the safest form of AI',
        ],
        correct: 2,
        explanation: 'The game agent optimized the score metric by pausing indefinitely — satisfying the measure, not the intent.',
      },
      {
        q: 'Why do machine learning systems inherit human biases?',
        options: [
          'Their creators program biases intentionally',
          'They learn patterns from historical data that contains biases',
          'Neural networks naturally develop prejudiced thinking',
          'Bias is introduced only in the deployment phase',
        ],
        correct: 1,
        explanation: 'ML systems learn from historical data, which embeds existing human biases that they then amplify.',
      },
      {
        q: 'What "paradox" does the passage identify regarding AI transparency?',
        options: [
          'More data makes AI less accurate',
          'The most capable AI systems are also the least interpretable',
          'Simple AI is more dangerous than complex AI',
          'Transparency reduces AI performance only in medical applications',
        ],
        correct: 1,
        explanation: 'The most powerful AI (large neural networks) is also the least explainable — a direct paradox.',
      },
      {
        q: 'What does the passage suggest is necessary to address AI\'s ethical challenges?',
        options: [
          'Stopping AI development until risks are understood',
          'Leaving ethics to AI companies alone',
          'Interdisciplinary collaboration among diverse stakeholders',
          'Focusing only on technical improvements to neural networks',
        ],
        correct: 2,
        explanation: 'The passage concludes that interdisciplinary collaboration — technologists, ethicists, legal scholars, affected communities — is required.',
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
type Phase = 'select' | 'reading' | 'quiz' | 'results';

interface QuizAnswer { chosen: number | null; correct: boolean; time: number }

const READING_TIME = 180; // seconds
const QUESTION_TIME = 30;

export default function ReadingPage() {
  const [phase, setPhase] = useState<Phase>('select');
  const [passage, setPassage] = useState<Passage | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(READING_TIME);
  const [qTime, setQTime] = useState(QUESTION_TIME);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const beginQuizRef = useRef<() => void>(() => {});
  const autoSubmitRef = useRef<() => void>(() => {});

  const startPassage = (p: Passage) => {
    setPassage(p);
    setPhase('reading');
    setTimeLeft(READING_TIME);
    setAnswers([]);
    setQIdx(0);
    setScore(0);
  };

  const beginQuiz = useCallback(() => {
    clearInterval(timerRef.current);
    setPhase('quiz');
    setQIdx(0);
    setChosen(null);
    setConfirmed(false);
    setShowExplanation(false);
  }, []);

  const advance = useCallback((lastAns?: QuizAnswer) => {
    if (!passage) return;
    const nextIdx = qIdx + 1;

    if (lastAns !== undefined) {
      setAnswers(prev => {
        const merged = [...prev, lastAns];
        if (nextIdx >= passage.questions.length) {
          const finalScore = merged.reduce(
            (a, x) => a + (x.correct ? 100 + Math.round(((QUESTION_TIME - x.time) / QUESTION_TIME) * 100) : 0),
            0
          );
          saveLocalScore('reading', finalScore);
          setPhase('results');
        }
        return merged;
      });
      if (nextIdx < passage.questions.length) {
        setQIdx(nextIdx);
        setChosen(null);
        setConfirmed(false);
        setShowExplanation(false);
      }
      return;
    }

    if (nextIdx >= passage.questions.length) {
      setAnswers(prev => {
        const finalScore = prev.reduce(
          (a, x) => a + (x.correct ? 100 + Math.round(((QUESTION_TIME - x.time) / QUESTION_TIME) * 100) : 0),
          0
        );
        saveLocalScore('reading', finalScore);
        return prev;
      });
      setPhase('results');
    } else {
      setQIdx(nextIdx);
      setChosen(null);
      setConfirmed(false);
      setShowExplanation(false);
    }
  }, [passage, qIdx]);

  const autoSubmit = useCallback(() => {
    if (!passage) return;
    const ans: QuizAnswer = { chosen: null, correct: false, time: QUESTION_TIME };
    advance(ans);
  }, [passage, advance]);

  useEffect(() => {
    beginQuizRef.current = beginQuiz;
  }, [beginQuiz]);

  useEffect(() => {
    autoSubmitRef.current = autoSubmit;
  }, [autoSubmit]);

  // Reading timer
  useEffect(() => {
    if (phase !== 'reading') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          beginQuizRef.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Question timer
  useEffect(() => {
    if (phase !== 'quiz' || confirmed) return;
    setQTime(QUESTION_TIME);
    timerRef.current = setInterval(() => {
      setQTime(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          autoSubmitRef.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [qIdx, phase, confirmed]);

  const submitAnswer = useCallback(() => {
    if (!passage || chosen === null) return;
    clearInterval(timerRef.current);
    const q = passage.questions[qIdx];
    const correct = chosen === q.correct;
    const timeBonus = Math.round((qTime / QUESTION_TIME) * 100);
    const pts = correct ? 100 + timeBonus : 0;
    setScore(s => s + pts);
    const ans: QuizAnswer = { chosen, correct, time: QUESTION_TIME - qTime };
    setAnswers(prev => [...prev, ans]);
    setConfirmed(true);
    setShowExplanation(true);
  }, [passage, chosen, qIdx, qTime]);

  useEffect(() => {
    if (phase !== 'quiz' || confirmed || !passage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '4') {
        const i = parseInt(e.key, 10) - 1;
        const n = passage.questions[qIdx]?.options.length ?? 0;
        if (i < n) setChosen(i);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, confirmed, passage, qIdx]);

  const restart = () => { setPhase('select'); setPassage(null); };

  const correctCount = answers.filter(a => a.correct).length;
  const totalQuizQs = passage?.questions.length ?? 0;

  // Timer bar color
  const timeColor = (t: number, max: number) => t / max > 0.5 ? '#00aaff' : t / max > 0.25 ? '#ffaa00' : '#ff4444';

  return (
    <div className="min-h-dvh bg-midnight flex flex-col items-center pt-16 pb-24">
      <div className="fluid-container px-4 py-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {phase !== 'select' ? (
            <button onClick={restart} className="p-2 glass rounded-xl text-white/50 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link href="/games/academy" className="p-2 glass rounded-xl text-white/50 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">Reading Challenge</h1>
            <p className="text-sm text-white/50">Read · Understand · Answer</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── SELECT ── */}
          {phase === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-white/60 mb-6">Choose a passage to read. You have 3 minutes, then answer a short multiple-choice quiz on that text. Keys 1–4 pick an option.</p>
              <div className="grid gap-4">
                {PASSAGES.map(p => (
                  <motion.button
                    key={p.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => startPassage(p)}
                    className="glass-dark rounded-2xl p-5 text-left flex items-start gap-4 border border-white/10 hover:border-cobalt/40 transition-colors"
                  >
                    <span className="text-4xl mt-1">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-bold text-white text-lg">{p.title}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg text-xs bg-cobalt/15 text-cobalt-bright border border-cobalt/25">{p.grade}</span>
                        <span className="px-2 py-0.5 rounded-lg text-xs bg-white/5 text-white/50 border border-white/10">{p.topic}</span>
                      </div>
                      <p className="text-white/45 text-sm mt-2 line-clamp-2">{p.text.substring(0, 120)}…</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0 mt-2" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── READING ── */}
          {phase === 'reading' && passage && (
            <motion.div key="reading" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Timer bar */}
              <div className="flex items-center gap-3 mb-5">
                <Clock className="w-4 h-4 text-white/50" />
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(timeLeft / READING_TIME) * 100}%`, backgroundColor: timeColor(timeLeft, READING_TIME) }}
                  />
                </div>
                <span className="text-sm font-mono text-white/60 w-12 text-right">
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
              </div>

              <div className="glass-dark rounded-2xl p-6 border border-white/10 mb-6">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">{passage.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-white">{passage.title}</h2>
                    <span className="text-sm text-white/40">{passage.topic} · {passage.grade}</span>
                  </div>
                </div>
                <div className="text-white/80 leading-relaxed whitespace-pre-line text-[15px]">
                  {passage.text}
                </div>
              </div>

              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={beginQuiz}
                  className="btn-cobalt px-8 py-3 rounded-xl font-bold flex items-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  {"I'm Ready — Start Quiz"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── QUIZ ── */}
          {phase === 'quiz' && passage && (
            <motion.div key={`quiz-${qIdx}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              {/* Progress */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/50 text-sm">Question {qIdx + 1} of {passage.questions.length}</span>
                <div className="flex gap-2">
                  {passage.questions.map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full transition-colors ${
                      i < answers.length
                        ? answers[i].correct ? 'bg-emerald-400' : 'bg-red-400'
                        : i === qIdx ? 'bg-cobalt-bright' : 'bg-white/20'
                    }`} />
                  ))}
                </div>
              </div>

              {/* Question timer */}
              {!confirmed && (
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-4 h-4 text-white/50" />
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ width: `${(qTime / QUESTION_TIME) * 100}%`, backgroundColor: timeColor(qTime, QUESTION_TIME), transition: 'background-color 0.5s' }}
                    />
                  </div>
                  <span className="text-sm font-mono text-white/60 w-6 text-right">{qTime}</span>
                </div>
              )}

              {/* Score */}
              <div className="flex items-center justify-end gap-2 mb-5">
                <Star className="w-4 h-4 text-gold" />
                <span className="text-gold font-bold">{score} pts</span>
              </div>

              {/* Question */}
              <div className="glass-dark rounded-2xl p-6 border border-white/10 mb-5">
                <h3 className="text-lg font-semibold text-white leading-snug">
                  {passage.questions[qIdx].q}
                </h3>
              </div>

              {/* Options */}
              <div className="grid gap-3 mb-5">
                {passage.questions[qIdx].options.map((opt, i) => {
                  const q = passage.questions[qIdx];
                  const isChosen = chosen === i;
                  const isCorrect = i === q.correct;
                  let cls = 'glass border-white/10 text-white hover:border-cobalt/40 cursor-pointer';
                  if (confirmed) {
                    if (isCorrect) cls = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300';
                    else if (isChosen && !isCorrect) cls = 'bg-red-500/15 border-red-500/60 text-red-300';
                    else cls = 'glass border-white/5 text-white/40';
                  } else if (isChosen) {
                    cls = 'glass border-cobalt text-white bg-cobalt/10';
                  }
                  return (
                    <motion.button
                      key={i}
                      whileHover={!confirmed ? { scale: 1.01 } : {}}
                      whileTap={!confirmed ? { scale: 0.99 } : {}}
                      onClick={() => !confirmed && setChosen(i)}
                      className={`rounded-xl p-4 text-left border transition-all flex items-start gap-3 ${cls}`}
                    >
                      {confirmed && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />}
                      {confirmed && isChosen && !isCorrect && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                      {(!confirmed || (!isCorrect && !isChosen)) && (
                        <span className={`w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 ${isChosen ? 'bg-cobalt border-cobalt text-white' : 'border-white/30 text-white/50'}`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                      )}
                      <span className="flex-1">{opt}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl p-4 mb-5 border text-sm ${
                      answers[answers.length - 1]?.correct
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : 'bg-red-500/10 border-red-500/30 text-red-200'
                    }`}
                  >
                    <div className="font-semibold mb-1 flex items-center gap-2">
                      {answers[answers.length - 1]?.correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {answers[answers.length - 1]?.correct ? 'Correct!' : 'Not quite.'}
                    </div>
                    {passage.questions[qIdx].explanation}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex gap-3">
                {!confirmed ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={submitAnswer}
                    disabled={chosen === null}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${
                      chosen !== null ? 'btn-cobalt' : 'glass text-white/30 cursor-not-allowed'
                    }`}
                  >
                    Submit Answer
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => advance()}
                    className="flex-1 btn-cobalt py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  >
                    {qIdx + 1 < passage.questions.length ? 'Next Question' : 'See Results'}
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── RESULTS ── */}
          {phase === 'results' && passage && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="glass-dark rounded-2xl p-8 text-center border border-cobalt/30 mb-6">
                <div className="text-6xl mb-4">
                  {totalQuizQs > 0 && correctCount === totalQuizQs ? '🏆' : correctCount >= Math.ceil(totalQuizQs * 0.6) ? '🌟' : '📖'}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {totalQuizQs > 0 && correctCount === totalQuizQs
                    ? 'Perfect Score!'
                    : totalQuizQs > 0 && correctCount >= Math.ceil(totalQuizQs * 0.8)
                      ? 'Excellent!'
                      : totalQuizQs > 0 && correctCount >= Math.ceil(totalQuizQs * 0.6)
                        ? 'Good Job!'
                        : 'Keep Practicing!'}
                </h2>
                <div className="text-5xl font-bold text-cobalt-bright mb-1">{correctCount}/{totalQuizQs || '—'}</div>
                <p className="text-white/50 mb-6">questions correct</p>
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="glass rounded-xl p-3">
                    <div className="text-gold text-xl font-bold">{score}</div>
                    <div className="text-white/40 text-xs">Total Points</div>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <div className="text-cobalt-bright text-xl font-bold">{totalQuizQs ? Math.round((correctCount / totalQuizQs) * 100) : 0}%</div>
                    <div className="text-white/40 text-xs">Accuracy</div>
                  </div>
                </div>
              </div>

              {/* Answer review */}
              <div className="glass-dark rounded-2xl p-5 border border-white/10 mb-6">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Answer Review</h3>
                <div className="grid gap-2">
                  {answers.map((a, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl text-sm ${a.correct ? 'bg-emerald-500/8 text-emerald-300' : 'bg-red-500/8 text-red-300'}`}>
                      {a.correct ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                      <span className="text-white/70 flex-1">{passage.questions[i].q}</span>
                      <span className="font-mono text-xs opacity-70">{a.time}s</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => startPassage(passage)} className="flex-1 btn-cobalt py-3 rounded-xl font-bold text-sm">Try Again</button>
                <button onClick={restart} className="flex-1 btn-glass py-3 rounded-xl font-bold text-sm">New Passage</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
