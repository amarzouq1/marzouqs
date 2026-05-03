'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, RotateCcw, Flag, Brain, ChevronLeft, Clock, Trophy, Zap } from 'lucide-react';
import {
  createGame, applyMove, getMovesForSquare, getBestMove, isKingInCheck,
  PIECE_UNICODE,
  type GameState, type Move, type PieceType,
} from '@/games/chess/engine';
import { calculateElo, getEloTitle, saveLocalScore } from '@/lib/utils';
import GlassCard from '@/components/GlassCard';
import Link from 'next/link';

type Difficulty = 'novice' | 'adept' | 'master' | 'grandmaster';

const DEPTH: Record<Difficulty, number> = {
  novice: 1, adept: 2, master: 3, grandmaster: 4,
};
const AI_ELO: Record<Difficulty, number> = {
  novice: 800, adept: 1200, master: 1800, grandmaster: 2400,
};

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['1','2','3','4','5','6','7','8'];

function rankFile(sq: number) {
  return { rank: Math.floor(sq / 8), file: sq % 8 };
}

export default function ChessPage() {
  const [game, setGame] = useState<GameState>(createGame());
  const [selected, setSelected] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [playerColor] = useState<'w' | 'b'>('w');
  const [difficulty, setDifficulty] = useState<Difficulty>('master');
  const [playerElo, setPlayerElo] = useState<number>(() => {
    if (typeof window !== 'undefined') return +(localStorage.getItem('mgc_chess_elo') ?? '1200');
    return 1200;
  });
  const [thinking, setThinking] = useState(false);
  const [promotion, setPromotion] = useState<{ sq: number; color: 'w'|'b' } | null>(null);
  const [lastMove, setLastMove] = useState<[number,number] | null>(null);
  const [clock, setClock] = useState({ w: 600, b: 600 }); // 10 min each
  const [gameStarted, setGameStarted] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiWorkerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clock
  useEffect(() => {
    if (!gameStarted || game.status !== 'active') {
      if (clockRef.current) clearInterval(clockRef.current);
      return;
    }
    clockRef.current = setInterval(() => {
      setClock((c) => {
        const updated = { ...c, [game.turn]: Math.max(0, c[game.turn] - 1) };
        if (updated[game.turn] === 0) setGame((g) => ({ ...g, status: 'draw', winner: null }));
        return updated;
      });
    }, 1000);
    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, [game.turn, gameStarted, game.status]);

  const formatClock = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  // AI move
  useEffect(() => {
    if (game.turn !== (playerColor === 'w' ? 'b' : 'w')) return;
    if (game.status !== 'active') return;

    setThinking(true);
    // Run AI in a timeout to avoid blocking UI
    aiWorkerRef.current = setTimeout(() => {
      const best = getBestMove(game, DEPTH[difficulty]);
      if (best) {
        const next = applyMove(game, best);
        setLastMove([best.from, best.to]);
        setGame(next);
        if (next.status !== 'active') handleGameOver(next);
      }
      setThinking(false);
    }, 150);

    return () => { if (aiWorkerRef.current) clearTimeout(aiWorkerRef.current); };
  }, [game, playerColor, difficulty]);

  const handleGameOver = (state: GameState) => {
    if (state.status === 'checkmate' || state.status === 'stalemate' || state.status === 'draw') {
      let result: 1 | 0.5 | 0 = 0.5;
      if (state.status === 'checkmate') result = state.winner === playerColor ? 1 : 0;
      const aiElo = AI_ELO[difficulty];
      const newElo = calculateElo(playerElo, aiElo, result);
      setPlayerElo(newElo);
      localStorage.setItem('mgc_chess_elo', String(newElo));
      saveLocalScore('chess', newElo, { result: state.status, difficulty });
    }
  };

  const handleSquareClick = useCallback((sq: number) => {
    if (game.turn !== playerColor || game.status !== 'active' || thinking) return;

    const piece = game.board[sq];

    if (selected !== null) {
      // Try to move
      const mv = validMoves.find((m) => m.to === sq);
      if (mv) {
        if (mv.promotion !== null) {
          // Need to pick promotion piece
          setPromotion({ sq, color: playerColor });
          return;
        }
        const next = applyMove(game, mv);
        setLastMove([mv.from, mv.to]);
        setGame(next);
        setSelected(null);
        setValidMoves([]);
        if (!gameStarted) setGameStarted(true);
        if (next.status !== 'active') handleGameOver(next);
        return;
      }
      // Deselect or select another piece
      setSelected(null);
      setValidMoves([]);
    }

    if (piece && piece.color === playerColor) {
      setSelected(sq);
      setValidMoves(getMovesForSquare(game, sq));
    }
  }, [game, selected, validMoves, playerColor, thinking, gameStarted]);

  const handlePromotion = (type: PieceType) => {
    if (!promotion || selected === null) return;
    const mv = validMoves.find((m) => m.to === promotion.sq && m.promotion === type);
    if (mv) {
      const next = applyMove(game, mv);
      setLastMove([mv.from, mv.to]);
      setGame(next);
      if (next.status !== 'active') handleGameOver(next);
    }
    setPromotion(null);
    setSelected(null);
    setValidMoves([]);
  };

  const resetGame = () => {
    setGame(createGame());
    setSelected(null);
    setValidMoves([]);
    setLastMove(null);
    setGameStarted(false);
    setClock({ w: 600, b: 600 });
    setPromotion(null);
    setThinking(false);
  };

  const kingInCheck = game.status === 'active' && isKingInCheck(game);
  const kingSquare = kingInCheck
    ? game.board.findIndex((p) => p?.type === 'k' && p.color === game.turn)
    : -1;

  const renderBoard = () => {
    const squares = [];
    const ranks = flipped ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
    const files = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

    for (const rank of ranks) {
      for (const file of files) {
        const sq = rank * 8 + file;
        const piece = game.board[sq];
        const isLight = (rank + file) % 2 === 1;
        const isSelected = selected === sq;
        const isValid = validMoves.some((m) => m.to === sq);
        const isLast = lastMove && (lastMove[0] === sq || lastMove[1] === sq);
        const isCheck = sq === kingSquare;

        let bgClass = isLight ? 'bg-[#C8D8E8]' : 'bg-[#4A6FA5]';
        if (isSelected) bgClass = 'bg-yellow-300/80';
        else if (isCheck) bgClass = 'bg-red-500/70';
        else if (isLast) bgClass = isLight ? 'bg-yellow-200/60' : 'bg-yellow-600/40';

        squares.push(
          <div
            key={sq}
            className={`relative flex items-center justify-center cursor-pointer select-none ${bgClass} transition-colors duration-100`}
            style={{ aspectRatio: '1', fontSize: 'clamp(20px, 5vw, 42px)' }}
            onClick={() => handleSquareClick(sq)}
            role="button"
            tabIndex={0}
            aria-label={`${FILES[file]}${RANKS[rank]}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
            onKeyDown={(e) => e.key === 'Enter' && handleSquareClick(sq)}
          >
            {/* Rank/file labels */}
            {file === (flipped ? 7 : 0) && (
              <span className="absolute top-0.5 left-1 text-[9px] font-bold opacity-50 leading-none">
                {RANKS[rank]}
              </span>
            )}
            {rank === (flipped ? 7 : 0) && (
              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold opacity-50 leading-none">
                {FILES[file]}
              </span>
            )}

            {/* Valid move dot */}
            {isValid && !piece && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[28%] h-[28%] rounded-full bg-black/20" />
              </div>
            )}
            {isValid && piece && (
              <div className="absolute inset-0 rounded-full border-4 border-black/30 pointer-events-none" />
            )}

            {/* Piece */}
            {piece && (
              <span
                className="leading-none select-none pointer-events-none drop-shadow-lg"
                style={{
                  filter: piece.color === 'w'
                    ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))'
                    : 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                  WebkitTextStroke: piece.color === 'w' ? '0.5px rgba(0,0,0,0.3)' : '0',
                }}
              >
                {PIECE_UNICODE[piece.color][piece.type]}
              </span>
            )}
          </div>
        );
      }
    }
    return squares;
  };

  const statusMessage = () => {
    if (game.status === 'checkmate') {
      return game.winner === playerColor ? '♔ You Win! Checkmate!' : '♟ AI Wins! Checkmate!';
    }
    if (game.status === 'stalemate') return 'Stalemate — Draw';
    if (game.status === 'draw') return '½-½ Draw';
    if (thinking) return '🤖 AI is calculating...';
    if (game.turn === playerColor) return '⚡ Your move';
    return '⏳ Waiting for AI...';
  };

  return (
    <div className="min-h-dvh pt-16 md:pt-20 pb-24">
      <div className="fluid-container py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="p-2 glass rounded-xl text-white/50 hover:text-white transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-yellow-400" />
              <h1 className="text-xl font-bold text-white">Chess Arena</h1>
              <span className="text-xs text-white/30">Grandmaster Suite</span>
            </div>
            <p className="text-xs text-white/40 mt-0.5">Where strategy becomes legacy.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Left: Board + clocks */}
          <div>
            {/* Black clock */}
            <GlassCard className={`flex items-center justify-between p-3 mb-3 ${game.turn === 'b' && game.status === 'active' ? 'border-cobalt/40 shadow-cobalt' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-dark flex items-center justify-center">
                  <span className="text-sm">♟</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {difficulty === 'grandmaster' ? 'Grandmaster AI' : `${difficulty.charAt(0).toUpperCase()+difficulty.slice(1)} AI`}
                  </div>
                  <div className="text-xs text-white/40">ELO {AI_ELO[difficulty]}</div>
                </div>
              </div>
              <div className={`font-mono text-lg font-bold ${game.turn === 'b' && game.status === 'active' ? 'text-cobalt-light' : 'text-white/50'}`}>
                <Clock size={14} className="inline mr-1" />{formatClock(clock.b)}
              </div>
            </GlassCard>

            {/* Chess Board */}
            <div className="relative w-full">
              <div
                className="grid w-full rounded-xl overflow-hidden shadow-2xl border border-cobalt/20"
                style={{
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  maxWidth: 'min(100%, 560px)',
                  margin: '0 auto',
                }}
              >
                {renderBoard()}
              </div>

              {/* Thinking overlay */}
              {thinking && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl pointer-events-none">
                  <div className="glass px-4 py-2 flex items-center gap-2 text-cobalt-light text-sm font-medium">
                    <Brain size={14} className="animate-pulse" />
                    Analyzing position...
                  </div>
                </div>
              )}
            </div>

            {/* White clock */}
            <GlassCard className={`flex items-center justify-between p-3 mt-3 ${game.turn === 'w' && game.status === 'active' ? 'border-cobalt/40 shadow-cobalt' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="text-sm">♔</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">You (White)</div>
                  <div className="text-xs text-white/40 flex items-center gap-1">
                    <Trophy size={10} />
                    ELO {playerElo} · {getEloTitle(playerElo)}
                  </div>
                </div>
              </div>
              <div className={`font-mono text-lg font-bold ${game.turn === 'w' && game.status === 'active' ? 'text-cobalt-light' : 'text-white/50'}`}>
                <Clock size={14} className="inline mr-1" />{formatClock(clock.w)}
              </div>
            </GlassCard>

            {/* Status bar */}
            <div className={`text-center py-3 mt-3 rounded-xl text-sm font-medium glass ${
              game.status !== 'active' ? 'border-yellow-400/30 text-yellow-400' : 'text-white/70'
            }`}>
              {statusMessage()}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="space-y-4">
            {/* ELO Rating */}
            <GlassCard variant="cobalt" className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-yellow-400" />
                <span className="text-sm font-semibold text-white">Your ELO Rating</span>
              </div>
              <div className="text-3xl font-bold text-cobalt-gradient mb-1">{playerElo}</div>
              <div className="text-xs text-white/50 mb-3">{getEloTitle(playerElo)}</div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(100, (playerElo / 2500) * 100)}%` }}
                />
              </div>
              <div className="text-xs text-white/30 mt-1">Progress to Grandmaster (2500)</div>
            </GlassCard>

            {/* Difficulty */}
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={16} className="text-cobalt-light" />
                <span className="text-sm font-semibold text-white">AI Difficulty</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['novice','adept','master','grandmaster'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => { setDifficulty(d); resetGame(); }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      difficulty === d
                        ? 'bg-cobalt/30 text-cobalt-light border border-cobalt/40'
                        : 'glass text-white/50 hover:text-white border border-transparent'
                    }`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                    <div className="text-[10px] opacity-60 mt-0.5">ELO {AI_ELO[d]}</div>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={resetGame} className="btn-glass text-sm py-2.5 flex items-center gap-2 justify-center">
                <RotateCcw size={14} /> New Game
              </button>
              <button
                onClick={() => setFlipped((f) => !f)}
                className="btn-glass text-sm py-2.5 flex items-center gap-2 justify-center"
              >
                <Zap size={14} /> Flip Board
              </button>
            </div>

            {/* Resign */}
            {game.status === 'active' && gameStarted && (
              <button
                onClick={() => setGame((g) => ({ ...g, status: 'checkmate', winner: g.turn === 'w' ? 'b' : 'w' }))}
                className="w-full py-2.5 rounded-xl glass border border-red-500/20 text-red-400 text-sm flex items-center gap-2 justify-center hover:border-red-500/40 transition-colors"
              >
                <Flag size={14} /> Resign
              </button>
            )}

            {/* Move history */}
            <GlassCard className="p-4">
              <div className="text-sm font-semibold text-white mb-3">Move History</div>
              <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs">
                {game.history.length === 0 ? (
                  <div className="text-white/30 text-center py-4">No moves yet</div>
                ) : (
                  Array.from({ length: Math.ceil(game.history.length / 2) }, (_, i) => {
                    const w = game.history[i * 2];
                    const b = game.history[i * 2 + 1];
                    return (
                      <div key={i} className="flex gap-2 text-white/60">
                        <span className="text-white/30 w-5">{i + 1}.</span>
                        <span className="text-white/80">{w?.notation ?? ''}</span>
                        <span>{b?.notation ?? ''}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Promotion Modal */}
      <AnimatePresence>
        {promotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-dark rounded-2xl p-6 border border-cobalt/30"
            >
              <h3 className="text-lg font-bold text-white mb-4 text-center">Promote Pawn</h3>
              <div className="flex gap-3">
                {(['q','r','b','n'] as PieceType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => handlePromotion(t)}
                    className="w-16 h-16 flex items-center justify-center rounded-xl glass border border-white/10 hover:border-cobalt/40 hover:bg-cobalt/10 transition-all text-3xl"
                  >
                    {PIECE_UNICODE[promotion.color][t]}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {game.status !== 'active' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              className="glass-dark rounded-2xl p-8 border border-cobalt/30 max-w-sm w-full text-center"
            >
              <div className="text-5xl mb-4">
                {game.status === 'checkmate' && game.winner === playerColor ? '🏆' : '♟'}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {game.status === 'checkmate'
                  ? game.winner === playerColor ? 'Victory!' : 'Defeated'
                  : 'Draw'}
              </h2>
              <p className="text-white/50 mb-2 text-sm">{statusMessage()}</p>
              <div className="elo-badge mx-auto mb-6">ELO: {playerElo}</div>
              <button onClick={resetGame} className="btn-cobalt w-full">
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
