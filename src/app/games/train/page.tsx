'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Zap, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { saveLocalScore, formatNumber } from '@/lib/utils';
import { grantXP } from '@/lib/progression';
import { sfx, initAudio, startMusic, stopMusic } from '@/lib/audio';
import {
  makeState, stepTrain, LANE_X, GROUND_Y, PLAYER_W, PLAYER_H,
  type TrainState, type TrainInput,
} from '@/games/train/engine';

const CW = 680, CH = 480;

// ─── Colors ───────────────────────────────────────────────────────────────────
const THEME = {
  sky:     '#0e1a2b',
  skyHigh: '#0a0f1a',
  train:   '#1a2540',
  trainHL: '#2a3860',
  rail:    '#3a4a6a',
  ground:  '#0d1420',
  lane:    ['#1e3050', '#162840', '#1e3050'],
  barrier: '#FF4444',
  lowbar:  '#FFD700',
  box:     '#FF8C00',
  gap:     '#000820',
  coin:    '#FFD700',
  player:  '#00AAFF',
  text:    '#FFFFFF',
};

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function drawTrain(ctx: CanvasRenderingContext2D) {
  // Train roof (playing surface)
  ctx.fillStyle = THEME.train;
  ctx.fillRect(100, GROUND_Y - 12, CW - 200, 24);

  // Lane dividers
  for (let i = 0; i < 3; i++) {
    const lx = LANE_X[i];
    ctx.fillStyle = THEME.lane[i];
    ctx.fillRect(lx - 55, GROUND_Y - 12, 110, 16);
    // Rail edges
    ctx.fillStyle = THEME.rail;
    ctx.fillRect(lx - 58, GROUND_Y + 4, 116, 6);
  }

  // Side walls
  ctx.fillStyle = THEME.trainHL;
  ctx.fillRect(100, GROUND_Y - 60, 18, 64);
  ctx.fillRect(CW - 118, GROUND_Y - 60, 18, 64);

  // Windows
  for (let i = 0; i < 5; i++) {
    const wx = 130 + i * 88;
    ctx.fillStyle = '#0a1830';
    ctx.strokeStyle = '#2a4080';
    ctx.lineWidth = 2;
    ctx.fillRect(wx, GROUND_Y - 58, 52, 32);
    ctx.strokeRect(wx, GROUND_Y - 58, 52, 32);
    // Light flicker
    if ((Date.now() / 200 + i) % 1 < 0.85) {
      ctx.fillStyle = 'rgba(80, 160, 255, 0.08)';
      ctx.fillRect(wx + 2, GROUND_Y - 56, 48, 28);
    }
  }
}

function drawBg(ctx: CanvasRenderingContext2D, distance: number) {
  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y - 80);
  grad.addColorStop(0, THEME.skyHigh);
  grad.addColorStop(1, THEME.sky);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  const starSeed = Math.floor(distance / 300);
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 137 + starSeed * 31) % CW);
    const sy = ((i * 83 + starSeed * 17) % (GROUND_Y - 120));
    const sz = (i % 3 === 0) ? 1.5 : 0.8;
    ctx.beginPath();
    ctx.arc(sx, sy, sz, 0, Math.PI * 2);
    ctx.fill();
  }

  // Moving city silhouette
  ctx.fillStyle = '#080f1c';
  const off = (distance * 0.3) % CW;
  const buildings = [60, 100, 45, 130, 75, 90, 55, 110, 85, 70, 120, 50];
  let bx = -off;
  for (const bh of buildings) {
    ctx.fillRect(bx, GROUND_Y - 80 - bh, 55, bh + 2);
    bx += 68;
    if (bx < CW + 100) continue;
  }

  // Ground below train
  ctx.fillStyle = THEME.ground;
  ctx.fillRect(0, GROUND_Y + 12, CW, CH - GROUND_Y - 12);

  // Track blur lines (speed effect)
  ctx.strokeStyle = 'rgba(0, 100, 255, 0.12)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const lx = 105 + i * 78;
    ctx.beginPath();
    ctx.moveTo(lx, GROUND_Y + 8);
    ctx.lineTo(lx + 8, CH);
    ctx.stroke();
  }
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: TrainState['obstacles'][number]) {
  const cx = LANE_X[obs.lane];
  const y  = obs.y;

  if (obs.type === 'barrier') {
    ctx.fillStyle = THEME.barrier;
    ctx.strokeStyle = '#FF8888';
    ctx.lineWidth = 2;
    ctx.fillRect(cx - obs.w / 2, y - obs.h, obs.w, obs.h);
    ctx.strokeRect(cx - obs.w / 2, y - obs.h, obs.w, obs.h);
    // Stripe
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(cx - obs.w / 2 + 4, y - obs.h + 4, obs.w - 8, 8);
  } else if (obs.type === 'lowbar') {
    ctx.fillStyle = THEME.lowbar;
    ctx.fillRect(cx - 65, y - obs.h, 130, obs.h);
    // Pole supports
    ctx.fillStyle = '#CC9900';
    ctx.fillRect(cx - 65, y - obs.h, 8, obs.h);
    ctx.fillRect(cx + 57, y - obs.h, 8, obs.h);
  } else if (obs.type === 'box') {
    ctx.fillStyle = THEME.box;
    ctx.strokeStyle = '#FFAA00';
    ctx.lineWidth = 2;
    ctx.fillRect(cx - obs.w / 2, y - obs.h, obs.w, obs.h);
    ctx.strokeRect(cx - obs.w / 2, y - obs.h, obs.w, obs.h);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', cx, y - obs.h / 2 + 8);
  } else if (obs.type === 'gap') {
    // Dark gap in the train roof
    ctx.fillStyle = THEME.gap;
    ctx.fillRect(cx - 55, y - 60, 110, 60);
    ctx.strokeStyle = '#FF000033';
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - 55, y - 60, 110, 60);
  }
}

function drawCoin(ctx: CanvasRenderingContext2D, coin: TrainState['coins'][number]) {
  const cx = LANE_X[coin.lane];
  const t  = Date.now() / 300;
  ctx.save();
  ctx.translate(cx, coin.y - 16);
  ctx.rotate(Math.sin(t + coin.id) * 0.3);
  ctx.fillStyle = THEME.coin;
  ctx.strokeStyle = '#FFAA00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(-3, -3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: TrainState['player']) {
  if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 1) return;

  const px = player.x;
  const py = player.y;
  const isRolling = player.rolling;
  const h = isRolling ? PLAYER_H * 0.55 : PLAYER_H;

  ctx.save();
  ctx.translate(px, py);

  if (isRolling) {
    // Rolling ball
    ctx.fillStyle = THEME.player;
    ctx.strokeStyle = '#0088CC';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -h / 2, h / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Motion lines
    ctx.strokeStyle = 'rgba(0,180,255,0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-h / 2 - 4 - i * 5, -h / 2 + i * 5);
      ctx.lineTo(-h / 2 - 12 - i * 5, -h / 2 + i * 5);
      ctx.stroke();
    }
  } else {
    // Running character
    const frame = player.runFrame;
    // Body
    ctx.fillStyle = THEME.player;
    ctx.fillRect(-PLAYER_W / 2, -h, PLAYER_W, h * 0.55);
    // Head
    ctx.fillStyle = '#80DDFF';
    ctx.beginPath();
    ctx.arc(0, -h - 10, 14, 0, Math.PI * 2);
    ctx.fill();
    // Visor
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-8, -h - 17, 16, 6);
    // Legs (animated)
    ctx.fillStyle = '#0077AA';
    const legOff = Math.sin(frame * Math.PI * 0.5) * 8;
    ctx.fillRect(-12, -h * 0.45, 10, h * 0.48 + legOff);
    ctx.fillRect(2, -h * 0.45, 10, h * 0.48 - legOff);
    // Shoes
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(-14, -h * 0.45 + h * 0.48 + legOff - 4, 14, 8);
    ctx.fillRect(0, -h * 0.45 + h * 0.48 - legOff - 4, 14, 8);
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 4, PLAYER_W * 0.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHUD(ctx: CanvasRenderingContext2D, state: TrainState) {
  // Score
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.roundRect(12, 12, 180, 52, 12);
  ctx.fill();
  ctx.fillStyle = THEME.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 24, 30);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(formatNumber(state.score), 24, 54);

  // Distance
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.roundRect(CW - 150, 12, 138, 52, 12);
  ctx.fill();
  ctx.fillStyle = THEME.text;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('DISTANCE', CW - 20, 30);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`${Math.round(state.distance / 100) / 10}km`, CW - 20, 54);

  // Coins
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.roundRect(CW / 2 - 60, 12, 120, 40, 12);
  ctx.fill();
  ctx.fillStyle = THEME.coin;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`🪙 ${state.coins_collected}`, CW / 2, 38);

  // Speed bar
  const speedPct = (state.speed - 320) / 580;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(12, CH - 32, 120, 14);
  ctx.fillStyle = `hsl(${120 - speedPct * 120}, 100%, 50%)`;
  ctx.fillRect(12, CH - 32, 120 * speedPct, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SPEED ${Math.round(state.speed)}`, 14, CH - 20);
}

// ─── Game Component ───────────────────────────────────────────────────────────
export default function TrainSurfPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<TrainState | null>(null);
  const rafRef    = useRef(0);
  const lastRef   = useRef(0);
  const keysRef   = useRef<Record<string, boolean>>({});
  const touchRef  = useRef({ left: false, right: false, jump: false, roll: false });
  const [phase, setPhase] = useState<'menu' | 'playing' | 'dead'>('menu');
  const [finalScore, setFinalScore] = useState(0);
  const [bestScore, setBestScore]   = useState(0);

  useEffect(() => {
    try { setBestScore(parseInt(localStorage.getItem('mgc_train_best') ?? '0', 10)); } catch { /* ok */ }
  }, []);

  const startGame = useCallback(() => {
    initAudio();
    startMusic('racing');
    stateRef.current = makeState();
    lastRef.current = performance.now();
    setPhase('playing');
    sfx.countdownGo();
  }, []);

  // Game loop
  useEffect(() => {
    if (phase !== 'playing') { cancelAnimationFrame(rafRef.current); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (ts: number) => {
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;
      const S = stateRef.current;
      if (!S) return;

      const k = keysRef.current;
      const t = touchRef.current;
      const input: TrainInput = {
        left:  k['ArrowLeft']  || k['a'] || t.left,
        right: k['ArrowRight'] || k['d'] || t.right,
        jump:  k['ArrowUp']    || k['w'] || k[' ']  || t.jump,
        roll:  k['ArrowDown']  || k['s'] || t.roll,
      };

      stepTrain(S, input, dt);

      // Render
      ctx.clearRect(0, 0, CW, CH);
      drawBg(ctx, S.distance);
      drawTrain(ctx);
      for (const obs of S.obstacles) drawObstacle(ctx, obs);
      for (const coin of S.coins) drawCoin(ctx, coin);
      drawPlayer(ctx, S.player);
      drawHUD(ctx, S);

      if (S.player.dead) {
        stopMusic();
        sfx.fail();
        setFinalScore(S.score);
        saveLocalScore('train', S.score);
        grantXP('sonic', S.score);
        if (S.score > bestScore) {
          setBestScore(S.score);
          try { localStorage.setItem('mgc_train_best', String(S.score)); } catch { /* ok */ }
        }
        setPhase('dead');
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); stopMusic(); };
  }, [phase, bestScore]);

  // Keys
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  return (
    <div className="min-h-dvh bg-midnight flex flex-col items-center justify-start pt-16 pb-8">
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center gap-4 px-4 py-3">
        <Link href="/" className="glass p-2 rounded-xl hover:bg-white/10 transition-colors">
          <ArrowLeft size={20} className="text-white/70" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">🚂 Train Surf Runner</h1>
          <p className="text-white/40 text-sm">Dodge obstacles · Collect coins · Survive</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Trophy size={14} className="text-gold" />
          <span className="text-white/60 text-sm font-bold">{formatNumber(bestScore)}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{ width: CW, maxWidth: '100vw' }}>
        <canvas ref={canvasRef} width={CW} height={CH} className="block bg-midnight" />

        {/* Menu overlay */}
        <AnimatePresence>
          {phase === 'menu' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-midnight/90 backdrop-blur-sm">
              <div className="text-7xl mb-4">🚂</div>
              <h2 className="text-3xl font-black text-white mb-2">Train Surf Runner</h2>
              <p className="text-white/50 mb-6 text-center max-w-xs">
                Run on top of a speeding train. Dodge barriers, duck under low bars, jump over gaps.
              </p>
              <div className="glass rounded-xl p-4 mb-6 text-sm text-white/60 text-center">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-white font-bold">← →</span><br />Change Lane</div>
                  <div><span className="text-white font-bold">↑ / Space</span><br />Jump</div>
                  <div><span className="text-white font-bold">↓</span><br />Roll / Duck</div>
                  <div><span className="text-yellow-400 font-bold">🪙</span><br />Collect Coins</div>
                </div>
              </div>
              <button onClick={startGame} className="btn-cobalt px-10 py-3 text-lg font-black rounded-2xl">
                SURF! 🏄
              </button>
            </motion.div>
          )}

          {phase === 'dead' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-midnight/92 backdrop-blur-sm">
              <div className="text-6xl mb-3">💥</div>
              <h2 className="text-2xl font-black text-white mb-1">Wiped Out!</h2>
              <div className="text-4xl font-black text-gold mb-1">{formatNumber(finalScore)}</div>
              <p className="text-white/40 text-sm mb-4">
                {finalScore >= bestScore ? '🌟 New Best!' : `Best: ${formatNumber(bestScore)}`}
              </p>
              <div className="flex gap-3">
                <button onClick={startGame} className="btn-cobalt px-8 py-2.5 rounded-xl font-bold flex items-center gap-2">
                  <RotateCcw size={16} /> Play Again
                </button>
                <Link href="/" className="btn-glass px-8 py-2.5 rounded-xl font-bold">Hub</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile controls */}
      {phase === 'playing' && (
        <div className="mt-4 flex flex-col items-center gap-3 w-full max-w-sm px-4 md:hidden">
          <div className="flex gap-3 w-full">
            <button onPointerDown={() => { touchRef.current.left = true; sfx.click(); }}
              onPointerUp={() => { touchRef.current.left = false; }}
              className="flex-1 h-14 glass rounded-xl text-2xl font-bold text-white active:bg-white/20">◀</button>
            <div className="flex flex-col gap-1 flex-1">
              <button onPointerDown={() => { touchRef.current.jump = true; }}
                onPointerUp={() => { touchRef.current.jump = false; }}
                className="h-14 glass rounded-xl text-2xl font-bold text-white active:bg-white/20">▲ JUMP</button>
            </div>
            <button onPointerDown={() => { touchRef.current.right = true; sfx.click(); }}
              onPointerUp={() => { touchRef.current.right = false; }}
              className="flex-1 h-14 glass rounded-xl text-2xl font-bold text-white active:bg-white/20">▶</button>
          </div>
          <button onPointerDown={() => { touchRef.current.roll = true; }}
            onPointerUp={() => { touchRef.current.roll = false; }}
            className="w-full h-12 glass rounded-xl text-lg font-bold text-white active:bg-white/20">
            ▼ DUCK / ROLL
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 flex gap-4 text-white/40 text-xs">
        <span><Zap size={12} className="inline mr-1 text-cobalt-light" />Speed increases with distance</span>
        <span>🪙 Coins = bonus points</span>
      </div>
    </div>
  );
}
