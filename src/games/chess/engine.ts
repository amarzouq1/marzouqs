// ════════════════════════════════════════════════════════════════════════════
// Marzouq's Gaming Center — Full Chess Engine
// Complete rules: castling, en passant, promotion, check, checkmate, stalemate
// AI: minimax with alpha-beta pruning, depth 3, piece-square tables
// ════════════════════════════════════════════════════════════════════════════

export type Color = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface Piece {
  type: PieceType;
  color: Color;
}

export type Square = Piece | null;

export interface Move {
  from: number;       // 0–63 (rank*8+file, rank0=rank1)
  to: number;
  piece: Piece;
  capture: Piece | null;
  promotion: PieceType | null;
  isCastling: boolean;
  isEnPassant: boolean;
  notation: string;
}

export interface GameState {
  board: Square[];
  turn: Color;
  castling: { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean };
  enPassant: number | null;
  halfMoves: number;
  fullMoves: number;
  status: 'active' | 'checkmate' | 'stalemate' | 'draw';
  winner: Color | null;
  history: Move[];
  capturedPieces: { w: Piece[]; b: Piece[] };
}

// ─── Board indices ────────────────────────────────────────────────────────
// sq = rank*8 + file
// rank 0 = rank 1 (white's back rank), file 0 = a-file
const SQ = (rank: number, file: number) => rank * 8 + file;
const RANK = (sq: number) => Math.floor(sq / 8);
const FILE = (sq: number) => sq % 8;

// Starting position FEN squares
function createInitialBoard(): Square[] {
  const b: Square[] = new Array(64).fill(null);
  const place = (sq: number, type: PieceType, color: Color) => { b[sq] = { type, color }; };

  // White pieces (rank 0-1)
  const backRank: PieceType[] = ['r','n','b','q','k','b','n','r'];
  backRank.forEach((t, f) => place(SQ(0, f), t, 'w'));
  for (let f = 0; f < 8; f++) place(SQ(1, f), 'p', 'w');

  // Black pieces (rank 6-7)
  for (let f = 0; f < 8; f++) place(SQ(6, f), 'p', 'b');
  backRank.forEach((t, f) => place(SQ(7, f), t, 'b'));

  return b;
}

export function createGame(): GameState {
  return {
    board: createInitialBoard(),
    turn: 'w',
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    enPassant: null,
    halfMoves: 0,
    fullMoves: 1,
    status: 'active',
    winner: null,
    history: [],
    capturedPieces: { w: [], b: [] },
  };
}

// ─── Move generation ──────────────────────────────────────────────────────

function isOnBoard(sq: number): boolean {
  return sq >= 0 && sq < 64;
}

function isEnemy(board: Square[], sq: number, color: Color): boolean {
  return board[sq] !== null && board[sq]!.color !== color;
}

function isEmpty(board: Square[], sq: number): boolean {
  return board[sq] === null;
}

// Generate pseudo-legal moves for a piece (may leave king in check)
function pseudoMoves(state: GameState, from: number): Move[] {
  const piece = state.board[from];
  if (!piece) return [];
  const { board, enPassant } = state;
  const { color, type } = piece;
  const moves: Move[] = [];

  const addMove = (to: number, promotion: PieceType | null = null) => {
    const capture = board[to];
    const isCastling = false;
    const isEP = false;
    moves.push({ from, to, piece, capture, promotion, isCastling, isEnPassant: isEP, notation: '' });
  };

  const addSliding = (deltas: [number, number][]) => {
    for (const [dr, df] of deltas) {
      let r = RANK(from) + dr;
      let f = FILE(from) + df;
      while (r >= 0 && r < 8 && f >= 0 && f < 8) {
        const sq = SQ(r, f);
        if (isEmpty(board, sq)) { addMove(sq); }
        else {
          if (isEnemy(board, sq, color)) addMove(sq);
          break;
        }
        r += dr; f += df;
      }
    }
  };

  switch (type) {
    case 'p': {
      const dir = color === 'w' ? 1 : -1;
      const startRank = color === 'w' ? 1 : 6;
      const promRank  = color === 'w' ? 7 : 0;

      // Forward
      const fwd = SQ(RANK(from) + dir, FILE(from));
      if (isOnBoard(fwd) && isEmpty(board, fwd)) {
        if (RANK(fwd) === promRank) {
          for (const p of ['q','r','b','n'] as PieceType[])
            moves.push({ from, to: fwd, piece, capture: null, promotion: p, isCastling: false, isEnPassant: false, notation: '' });
        } else {
          addMove(fwd);
          // Double push
          const dbl = SQ(RANK(from) + 2*dir, FILE(from));
          if (RANK(from) === startRank && isEmpty(board, dbl))
            addMove(dbl);
        }
      }
      // Captures
      for (const df of [-1, 1]) {
        const cr = RANK(from) + dir;
        const cf = FILE(from) + df;
        if (cr < 0 || cr > 7 || cf < 0 || cf > 7) continue;
        const csq = SQ(cr, cf);
        if (isEnemy(board, csq, color)) {
          if (cr === promRank) {
            for (const p of ['q','r','b','n'] as PieceType[])
              moves.push({ from, to: csq, piece, capture: board[csq], promotion: p, isCastling: false, isEnPassant: false, notation: '' });
          } else {
            addMove(csq);
          }
        }
        // En passant
        if (enPassant === csq) {
          moves.push({ from, to: csq, piece, capture: { type: 'p', color: color === 'w' ? 'b' : 'w' }, promotion: null, isCastling: false, isEnPassant: true, notation: '' });
        }
      }
      break;
    }
    case 'n': {
      const jumps: [number, number][] = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr,df] of jumps) {
        const r = RANK(from) + dr; const f = FILE(from) + df;
        if (r<0||r>7||f<0||f>7) continue;
        const sq = SQ(r,f);
        if (isEmpty(board, sq) || isEnemy(board, sq, color)) addMove(sq);
      }
      break;
    }
    case 'b': addSliding([[-1,-1],[-1,1],[1,-1],[1,1]]); break;
    case 'r': addSliding([[-1,0],[1,0],[0,-1],[0,1]]); break;
    case 'q': addSliding([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]); break;
    case 'k': {
      for (const [dr,df] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        const r = RANK(from)+dr; const f = FILE(from)+df;
        if (r<0||r>7||f<0||f>7) continue;
        const sq = SQ(r,f);
        if (isEmpty(board,sq) || isEnemy(board,sq,color)) addMove(sq);
      }
      // Castling
      const rank = color === 'w' ? 0 : 7;
      const c = state.castling;
      const kSq = SQ(rank, 4);
      if (from === kSq) {
        // Kingside
        const kR = color === 'w' ? c.wK : c.bK;
        if (kR && isEmpty(board, SQ(rank,5)) && isEmpty(board, SQ(rank,6)) && board[SQ(rank,7)]?.type === 'r') {
          if (!isSquareAttacked(board, kSq, color) && !isSquareAttacked(board, SQ(rank,5), color))
            moves.push({ from, to: SQ(rank,6), piece, capture: null, promotion: null, isCastling: true, isEnPassant: false, notation: '' });
        }
        // Queenside
        const qR = color === 'w' ? c.wQ : c.bQ;
        if (qR && isEmpty(board, SQ(rank,3)) && isEmpty(board, SQ(rank,2)) && isEmpty(board, SQ(rank,1)) && board[SQ(rank,0)]?.type === 'r') {
          if (!isSquareAttacked(board, kSq, color) && !isSquareAttacked(board, SQ(rank,3), color))
            moves.push({ from, to: SQ(rank,2), piece, capture: null, promotion: null, isCastling: true, isEnPassant: false, notation: '' });
        }
      }
      break;
    }
  }
  return moves;
}

// Check if a square is attacked by any piece of the given opponent color
function isSquareAttacked(board: Square[], sq: number, byOpponentOf: Color): boolean {
  const opp: Color = byOpponentOf === 'w' ? 'b' : 'w';
  // Check all opponent pieces
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p || p.color !== opp) continue;
    if (attacks(board, i, sq, p)) return true;
  }
  return false;
}

function attacks(board: Square[], from: number, to: number, piece: Piece): boolean {
  const { type, color } = piece;
  const dr = RANK(to) - RANK(from);
  const df = FILE(to) - FILE(from);

  switch (type) {
    case 'p': {
      const dir = color === 'w' ? 1 : -1;
      return dr === dir && (df === 1 || df === -1);
    }
    case 'n': {
      const adr = Math.abs(dr); const adf = Math.abs(df);
      return (adr === 2 && adf === 1) || (adr === 1 && adf === 2);
    }
    case 'b': {
      if (Math.abs(dr) !== Math.abs(df)) return false;
      return !hasPieceBetween(board, from, to);
    }
    case 'r': {
      if (dr !== 0 && df !== 0) return false;
      return !hasPieceBetween(board, from, to);
    }
    case 'q': {
      if (dr !== 0 && df !== 0 && Math.abs(dr) !== Math.abs(df)) return false;
      return !hasPieceBetween(board, from, to);
    }
    case 'k': {
      return Math.abs(dr) <= 1 && Math.abs(df) <= 1;
    }
  }
}

function hasPieceBetween(board: Square[], from: number, to: number): boolean {
  const dr = Math.sign(RANK(to) - RANK(from));
  const df = Math.sign(FILE(to) - FILE(from));
  let r = RANK(from) + dr;
  let f = FILE(from) + df;
  while (r !== RANK(to) || f !== FILE(to)) {
    if (board[SQ(r, f)] !== null) return true;
    r += dr; f += df;
  }
  return false;
}

function findKing(board: Square[], color: Color): number {
  for (let i = 0; i < 64; i++)
    if (board[i]?.type === 'k' && board[i]?.color === color) return i;
  return -1;
}

function isInCheck(board: Square[], color: Color): boolean {
  const kSq = findKing(board, color);
  if (kSq === -1) return false;
  return isSquareAttacked(board, kSq, color);
}

// Apply a move and return the new board state
function applyMoveToBoard(board: Square[], move: Move): Square[] {
  const nb = [...board];
  const { from, to, piece, promotion, isCastling, isEnPassant } = move;

  nb[to] = promotion ? { type: promotion, color: piece.color } : piece;
  nb[from] = null;

  if (isEnPassant) {
    const dir = piece.color === 'w' ? -1 : 1;
    nb[SQ(RANK(to) + dir, FILE(to))] = null;
  }

  if (isCastling) {
    const rank = RANK(from);
    if (FILE(to) === 6) { // Kingside
      nb[SQ(rank, 5)] = nb[SQ(rank, 7)];
      nb[SQ(rank, 7)] = null;
    } else { // Queenside
      nb[SQ(rank, 3)] = nb[SQ(rank, 0)];
      nb[SQ(rank, 0)] = null;
    }
  }

  return nb;
}

// Get all legal moves for a color
function getLegalMoves(state: GameState, color: Color): Move[] {
  const legal: Move[] = [];
  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (!p || p.color !== color) continue;
    const candidates = pseudoMoves(state, i);
    for (const mv of candidates) {
      const nb = applyMoveToBoard(state.board, mv);
      if (!isInCheck(nb, color)) {
        mv.notation = toAlgebraic(state, mv);
        legal.push(mv);
      }
    }
  }
  return legal;
}

// Apply a move to the game state
export function applyMove(state: GameState, move: Move): GameState {
  const nb = applyMoveToBoard(state.board, move);
  const next: Color = state.turn === 'w' ? 'b' : 'w';

  // Update castling rights
  const c = { ...state.castling };
  if (move.piece.type === 'k') {
    if (state.turn === 'w') { c.wK = false; c.wQ = false; }
    else { c.bK = false; c.bQ = false; }
  }
  if (move.from === SQ(0,0) || move.to === SQ(0,0)) c.wQ = false;
  if (move.from === SQ(0,7) || move.to === SQ(0,7)) c.wK = false;
  if (move.from === SQ(7,0) || move.to === SQ(7,0)) c.bQ = false;
  if (move.from === SQ(7,7) || move.to === SQ(7,7)) c.bK = false;

  // En passant target
  let ep: number | null = null;
  if (move.piece.type === 'p' && Math.abs(RANK(move.to) - RANK(move.from)) === 2) {
    ep = SQ((RANK(move.from) + RANK(move.to)) / 2, FILE(move.from));
  }

  // Captured pieces
  const captured = { w: [...state.capturedPieces.w], b: [...state.capturedPieces.b] };
  if (move.capture) {
    const capturedBy = state.turn;
    captured[capturedBy] = [...captured[capturedBy], move.capture];
  }

  const newState: GameState = {
    board: nb,
    turn: next,
    castling: c,
    enPassant: ep,
    halfMoves: (move.capture || move.piece.type === 'p') ? 0 : state.halfMoves + 1,
    fullMoves: state.turn === 'b' ? state.fullMoves + 1 : state.fullMoves,
    status: 'active',
    winner: null,
    history: [...state.history, move],
    capturedPieces: captured,
  };

  // Check game-ending conditions for next player
  const nextMoves = getLegalMoves(newState, next);
  if (nextMoves.length === 0) {
    if (isInCheck(nb, next)) {
      newState.status = 'checkmate';
      newState.winner = state.turn;
    } else {
      newState.status = 'stalemate';
    }
  } else if (newState.halfMoves >= 100) {
    newState.status = 'draw';
  }

  return newState;
}

// Get legal moves for a specific square
export function getMovesForSquare(state: GameState, sq: number): Move[] {
  const p = state.board[sq];
  if (!p || p.color !== state.turn) return [];
  const candidates = pseudoMoves(state, sq);
  const legal: Move[] = [];
  for (const mv of candidates) {
    const nb = applyMoveToBoard(state.board, mv);
    if (!isInCheck(nb, p.color)) {
      mv.notation = toAlgebraic(state, mv);
      legal.push(mv);
    }
  }
  return legal;
}

export function isKingInCheck(state: GameState): boolean {
  return isInCheck(state.board, state.turn);
}

// ─── Algebraic Notation ───────────────────────────────────────────────────
function toAlgebraic(state: GameState, move: Move): string {
  if (move.isCastling) return FILE(move.to) === 6 ? 'O-O' : 'O-O-O';
  const { piece, from, to, capture, promotion } = move;
  const files = 'abcdefgh';
  const toStr = files[FILE(to)] + (RANK(to) + 1);
  const fromFile = files[FILE(from)];
  const fromRank = RANK(from) + 1;
  let s = '';
  if (piece.type !== 'p') s += piece.type.toUpperCase();
  else if (capture) s += fromFile;
  if (capture) s += 'x';
  s += toStr;
  if (promotion) s += '=' + promotion.toUpperCase();
  return s;
}

// ─── AI (Minimax + Alpha-Beta) ────────────────────────────────────────────

const MATERIAL: Record<PieceType, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
};

// Piece-square tables (from white's perspective, rank 0 = rank 1)
const PST: Record<PieceType, number[]> = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0,
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  k: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20,
  ],
};

function getPSTValue(piece: Piece, sq: number): number {
  const rank = RANK(sq);
  const file = FILE(sq);
  // For black pieces, mirror the rank
  const idx = piece.color === 'w' ? rank * 8 + file : (7 - rank) * 8 + file;
  return PST[piece.type][idx] ?? 0;
}

function evaluate(state: GameState): number {
  if (state.status === 'checkmate') return state.winner === 'w' ? 100000 : -100000;
  if (state.status === 'stalemate' || state.status === 'draw') return 0;

  let score = 0;
  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (!p) continue;
    const val = MATERIAL[p.type] + getPSTValue(p, i);
    score += p.color === 'w' ? val : -val;
  }
  return score;
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || state.status !== 'active') return evaluate(state);

  const color: Color = isMaximizing ? 'w' : 'b';
  const moves = getLegalMoves(state, color);

  // Move ordering: captures first
  moves.sort((a, b) => {
    const aVal = a.capture ? MATERIAL[a.capture.type] : 0;
    const bVal = b.capture ? MATERIAL[b.capture.type] : 0;
    return bVal - aVal;
  });

  if (isMaximizing) {
    let best = -Infinity;
    for (const mv of moves) {
      const next = applyMove(state, mv);
      const val = minimax(next, depth - 1, alpha, beta, false);
      best = Math.max(best, val);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const mv of moves) {
      const next = applyMove(state, mv);
      const val = minimax(next, depth - 1, alpha, beta, true);
      best = Math.min(best, val);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function getBestMove(state: GameState, depth = 3): Move | null {
  const moves = getLegalMoves(state, state.turn);
  if (moves.length === 0) return null;

  let best: Move | null = null;
  let bestVal = state.turn === 'b' ? Infinity : -Infinity;

  // Move ordering: captures first
  moves.sort((a, b) => {
    const aVal = a.capture ? MATERIAL[a.capture.type] : 0;
    const bVal = b.capture ? MATERIAL[b.capture.type] : 0;
    return bVal - aVal;
  });

  const isMaximizing = state.turn === 'w';

  for (const mv of moves) {
    const next = applyMove(state, mv);
    const val = minimax(next, depth - 1, -Infinity, Infinity, !isMaximizing);
    if (isMaximizing ? val > bestVal : val < bestVal) {
      bestVal = val;
      best = mv;
    }
  }

  return best;
}

// Piece display symbols
export const PIECE_UNICODE: Record<Color, Record<PieceType, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

export { getLegalMoves, isInCheck };
