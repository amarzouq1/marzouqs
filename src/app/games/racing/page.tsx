'use client';
import { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, Flag, Trophy, Timer } from 'lucide-react';
import Link from 'next/link';
import {
  TRACKS, TrackDef, Racer, AIRacer, Particle, Input,
  buildPath, buildNormals, stepRacer, stepAI, makeRacer, makeAI,
  spawnDrift, spawnNitro, stepParticles, Vec2,
} from '@/games/racing/engine';
import { saveLocalScore } from '@/lib/utils';
import { sfx, setEngineRpm, stopEngine, startMusic, stopMusic, initAudio } from '@/lib/audio';

const CW = 896, CH = 504;

// ─── Rendering Helpers ────────────────────────────────────────────────────────
function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3);
  return `${m}:${sec.padStart(6, '0')}`;
}

function drawBg(ctx: CanvasRenderingContext2D, theme: string, cx: number, cy: number) {
  ctx.fillStyle = theme === 'neon' ? '#07070f' : theme === 'desert' ? '#b8915a' : '#2c4a2c';
  ctx.fillRect(0, 0, CW, CH);
  if (theme === 'neon') {
    ctx.strokeStyle = 'rgba(0,71,255,0.055)';
    ctx.lineWidth = 1;
    const gs = 80, ox = (-cx) % gs, oy = (-cy) % gs;
    for (let x = ox; x < CW; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke(); }
    for (let y = oy; y < CH; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke(); }
  } else if (theme === 'desert') {
    // Sand texture dots
    ctx.fillStyle = 'rgba(180,130,80,0.3)';
    for (let i = 0; i < 200; i++) {
      ctx.beginPath();
      ctx.arc(
        ((i * 137 - cx * 0.3) % CW + CW) % CW,
        ((i * 97 - cy * 0.3) % CH + CH) % CH,
        1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawTrack(
  ctx: CanvasRenderingContext2D,
  path: Vec2[], norms: Vec2[], width: number, theme: string,
  cx: number, cy: number,
) {
  const half = width / 2;
  const left  = path.map((p, i) => ({ x: p.x + norms[i].x * half, y: p.y + norms[i].y * half }));
  const right = path.map((p, i) => ({ x: p.x - norms[i].x * half, y: p.y - norms[i].y * half }));
  const n = path.length;

  ctx.save();
  ctx.translate(-cx, -cy);

  // Road fill
  ctx.beginPath();
  ctx.moveTo(left[0].x, left[0].y);
  for (const p of left) ctx.lineTo(p.x, p.y);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
  ctx.closePath();
  ctx.fillStyle = theme === 'neon' ? '#12123a' : theme === 'desert' ? '#8a6e44' : '#3a3a3a';
  ctx.fill();

  // Rumble strips
  for (let i = 0; i < n; i += 4) {
    const isRed = Math.floor(i / 4) % 2 === 0;
    const c = isRed ? '#cc2222' : '#eeeeee';
    ctx.strokeStyle = c;
    ctx.lineWidth = 10;
    const j = Math.min(i + 4, n - 1);
    for (const side of [left, right]) {
      ctx.beginPath();
      ctx.moveTo(side[i].x, side[i].y);
      ctx.lineTo(side[j].x, side[j].y);
      ctx.stroke();
    }
  }

  // Road fill again (on top of rumble inner edge)
  ctx.beginPath();
  const innerOffset = 8;
  const il = path.map((p, i) => ({ x: p.x + norms[i].x * (half - innerOffset), y: p.y + norms[i].y * (half - innerOffset) }));
  const ir = path.map((p, i) => ({ x: p.x - norms[i].x * (half - innerOffset), y: p.y - norms[i].y * (half - innerOffset) }));
  ctx.moveTo(il[0].x, il[0].y);
  for (const p of il) ctx.lineTo(p.x, p.y);
  for (let i = ir.length - 1; i >= 0; i--) ctx.lineTo(ir[i].x, ir[i].y);
  ctx.closePath();
  ctx.fillStyle = theme === 'neon' ? '#12123a' : theme === 'desert' ? '#8a6e44' : '#3a3a3a';
  ctx.fill();

  // Center dashed line
  ctx.setLineDash([22, 18]);
  ctx.strokeStyle = theme === 'neon' ? 'rgba(0,180,255,0.4)' : 'rgba(255,250,190,0.55)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  path.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // White edge lines
  ctx.strokeStyle = theme === 'neon' ? 'rgba(60,120,255,0.7)' : 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2;
  for (const side of [il, ir]) {
    ctx.beginPath();
    side.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.stroke();
  }

  // Start / finish line (checkered)
  const sf = path[0], sfn = norms[0];
  const sfAngle = Math.atan2(sfn.y, sfn.x);
  ctx.save();
  ctx.translate(sf.x, sf.y);
  ctx.rotate(sfAngle);
  const sqW = (half * 2) / 8, sqH = 10;
  for (let col = 0; col < 8; col++) {
    for (let row = 0; row < 2; row++) {
      ctx.fillStyle = (col + row) % 2 === 0 ? '#ffffff' : '#000000';
      ctx.fillRect(-half + col * sqW, -sqH / 2 + row * (sqH / 2), sqW, sqH / 2);
    }
  }
  ctx.restore();

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, ps: Particle[], cx: number, cy: number) {
  ctx.save();
  ctx.translate(-cx, -cy);
  for (const p of ps) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha * 0.75;
    ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.8 + (1 - alpha) * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawBike(
  ctx: CanvasRenderingContext2D,
  wx: number, wy: number, angle: number, lean: number,
  bodyColor: string, accentColor: string, isPlayer: boolean,
  cx: number, cy: number, nitroOn: boolean,
) {
  const sx = wx - cx, sy = wy - cy;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(angle + lean * 0.18);

  if (isPlayer) { ctx.shadowColor = bodyColor; ctx.shadowBlur = nitroOn ? 22 : 9; }

  // Shadow
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(3, 5, 21, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Rear wheel
  ctx.fillStyle = '#222'; ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(-15, 0, 9, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Front wheel
  ctx.beginPath(); ctx.ellipse(15, 0, 8, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Body fairing
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(-19, -5);
  ctx.bezierCurveTo(-19, -10, -6, -13, 2, -10);
  ctx.bezierCurveTo(10, -7, 18, -4, 19, 0);
  ctx.bezierCurveTo(19, 4, 10, 7, 2, 7);
  ctx.bezierCurveTo(-6, 9, -19, 5, -19, -5);
  ctx.fill();

  // Accent stripe
  ctx.fillStyle = accentColor;
  ctx.fillRect(-14, -2, 27, 4);

  // Rider helmet
  ctx.fillStyle = '#0d0d28';
  ctx.beginPath(); ctx.arc(-1, -9, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = isPlayer ? '#00aaff' : '#ff6b6b';
  ctx.beginPath(); ctx.arc(-1, -8, 3, -0.8, 0.8); ctx.fill();

  // Nitro exhaust
  if (nitroOn) {
    const g = ctx.createLinearGradient(-19, 0, -42, 0);
    g.addColorStop(0, 'rgba(0,220,255,0.92)');
    g.addColorStop(0.5, 'rgba(80,0,255,0.65)');
    g.addColorStop(1, 'rgba(0,0,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-19, -5);
    ctx.lineTo(-38 - Math.random() * 10, 0);
    ctx.lineTo(-19, 5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawMiniMap(
  ctx: CanvasRenderingContext2D,
  path: Vec2[], player: Racer, ai: AIRacer,
  mx: number, my: number, mw: number, mh: number,
) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of path) {
    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
  }
  const sx = mw / (maxX - minX + 40), sy = mh / (maxY - minY + 40);
  const sc = Math.min(sx, sy);
  const ox = mx + (mw - (maxX - minX) * sc) / 2;
  const oy = my + (mh - (maxY - minY) * sc) / 2;
  const toM = (x: number, y: number) => ({ x: ox + (x - minX) * sc, y: oy + (y - minY) * sc });

  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.beginPath(); ctx.roundRect(mx - 5, my - 5, mw + 10, mh + 10, 8); ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 4;
  ctx.beginPath();
  path.forEach((p, i) => { const m = toM(p.x, p.y); i === 0 ? ctx.moveTo(m.x, m.y) : ctx.lineTo(m.x, m.y); });
  ctx.closePath(); ctx.stroke();

  const am = toM(ai.x, ai.y);
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath(); ctx.arc(am.x, am.y, 4, 0, Math.PI * 2); ctx.fill();

  const pm = toM(player.x, player.y);
  ctx.fillStyle = '#00ccff';
  ctx.beginPath(); ctx.arc(pm.x, pm.y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  p: Racer, track: TrackDef, pos: 1 | 2,
) {
  const spd = Math.round(p.speed * 0.175);
  const rpmR = (p.rpm - 800) / 7200;

  // Speed panel (bottom-left)
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.beginPath(); ctx.roundRect(14, CH - 120, 144, 108, 12); ctx.fill();

  // RPM bar
  const rpmC = rpmR > 0.85 ? '#ff4040' : rpmR > 0.7 ? '#ffaa00' : '#00aaff';
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.roundRect(18, CH - 118, 136, 11, 4); ctx.fill();
  ctx.fillStyle = rpmC;
  ctx.beginPath(); ctx.roundRect(18, CH - 118, 136 * rpmR, 11, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('RPM', 20, CH - 120);

  ctx.fillStyle = '#00aaff'; ctx.font = 'bold 40px "JetBrains Mono",monospace'; ctx.textAlign = 'center';
  ctx.fillText(`${spd}`, 86, CH - 72);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '11px sans-serif';
  ctx.fillText('KM/H', 86, CH - 56);
  ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = 'bold 13px monospace';
  ctx.fillText(`GEAR ${p.gear}`, 86, CH - 38);

  // Drift indicator
  if (p.drifting) {
    ctx.fillStyle = '#ff9900';
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('DRIFT!', 86, CH - 22);
  }

  // Nitro panel (bottom-right)
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.beginPath(); ctx.roundRect(CW - 158, CH - 96, 144, 84, 12); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('NITRO', CW - 86, CH - 78);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath(); ctx.roundRect(CW - 154, CH - 68, 136, 18, 6); ctx.fill();
  if (p.nitro > 0) {
    const nc = p.nitro > 60 ? '#00ccff' : p.nitro > 25 ? '#ffaa00' : '#ff4444';
    ctx.fillStyle = nc;
    ctx.beginPath(); ctx.roundRect(CW - 154, CH - 68, 136 * p.nitro / 100, 18, 6); ctx.fill();
  }
  ctx.fillStyle = p.nitroOn ? '#ffffff' : 'rgba(255,255,255,0.35)'; ctx.font = '22px sans-serif';
  ctx.fillText('⚡', CW - 86, CH - 28);

  // Lap counter (top-center)
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.beginPath(); ctx.roundRect(CW / 2 - 84, 10, 168, 54, 10); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`LAP ${Math.min(p.lap, track.totalLaps)} / ${track.totalLaps}`, CW / 2, 34);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '13px monospace';
  ctx.fillText(fmtTime(p.lapTime), CW / 2, 54);

  // Best lap (top-left)
  if (p.bestLap < Infinity) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.roundRect(10, 10, 162, 38, 8); ctx.fill();
    ctx.fillStyle = '#ffd700'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('BEST LAP', 18, 26);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace';
    ctx.fillText(fmtTime(p.bestLap), 18, 42);
  }

  // Position badge (top-right)
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.roundRect(CW - 96, 10, 86, 52, 8); ctx.fill();
  ctx.fillStyle = pos === 1 ? '#ffd700' : '#cccccc'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`${pos}${pos === 1 ? 'ST' : 'ND'}`, CW - 53, 48);
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px sans-serif';
  ctx.fillText('POSITION', CW - 53, 61);
}

// ─── Main Component ───────────────────────────────────────────────────────────
type Phase = 'select' | 'countdown' | 'racing' | 'finished';

interface RaceState {
  player: Racer;
  ai: AIRacer;
  particles: Particle[];
  path: Vec2[];
  norms: Vec2[];
  track: TrackDef;
}

export default function RacingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RaceState | null>(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const touchRef = useRef({ left: false, right: false, accel: false, brake: false, nitro: false });

  const [phase, setPhase] = useState<Phase>('select');
  const [countdown, setCountdown] = useState(3);
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [result, setResult] = useState<{ time: number; best: number; pos: 1 | 2 } | null>(null);

  const startRace = useCallback((trackIdx: number) => {
    const track = TRACKS[trackIdx];
    const path = buildPath(track.waypoints);
    const norms = buildNormals(path);
    const sp = path[0];
    const a = track.startAngle;
    const offset = track.width * 0.28;
    const sideX = norms[0].x * offset, sideY = norms[0].y * offset;

    stateRef.current = {
      player: makeRacer(sp.x + sideX, sp.y + sideY, a),
      ai: makeAI(sp.x - sideX, sp.y - sideY, a),
      particles: [],
      path, norms, track,
    };

    initAudio();
    startMusic('racing');
    setPhase('countdown');
    setCountdown(3);
    let c = 3;
    sfx.countdown();
    const interval = setInterval(() => {
      c--;
      if (c <= 0) { clearInterval(interval); setPhase('racing'); sfx.countdownGo(); }
      else { setCountdown(c); sfx.countdown(); }
    }, 1000);
  }, []);

  // Game loop
  useEffect(() => {
    if (phase !== 'racing') { cancelAnimationFrame(rafRef.current); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (ts: number) => {
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;
      const S = stateRef.current;
      if (!S) return;

      const keys = keysRef.current;
      const touch = touchRef.current;
      const inp: Input = {
        left:  keys['ArrowLeft']  || keys['a'] || touch.left,
        right: keys['ArrowRight'] || keys['d'] || touch.right,
        accel: keys['ArrowUp']    || keys['w'] || touch.accel,
        brake: keys['ArrowDown']  || keys['s'] || touch.brake,
        nitro: keys[' '] || keys['Shift'] || touch.nitro,
      };

      S.player = stepRacer(S.player, inp, dt, S.path, S.norms, S.track.width, S.track.totalLaps);
      S.ai = stepAI(S.ai, dt, S.path, S.norms, S.track.width, S.track.totalLaps, 0.82);

      // Engine sound
      setEngineRpm(S.player.rpm);

      // Spawn particles
      if (S.player.drifting && Math.random() < 0.5) {
        S.particles.push(...spawnDrift(S.player.x, S.player.y, S.player.angle));
      }
      if (S.player.nitroOn && Math.random() < 0.7) {
        S.particles.push(...spawnNitro(S.player.x, S.player.y, S.player.angle));
      }
      S.particles = stepParticles(S.particles, dt);
      if (S.particles.length > 300) S.particles = S.particles.slice(-300);

      // Finished check
      if (S.player.finished || S.ai.finished) {
        const pos: 1 | 2 = S.player.finished && !S.ai.finished ? 1
          : !S.player.finished && S.ai.finished ? 2
          : S.player.totalTime <= S.ai.totalTime ? 1 : 2;
        cancelAnimationFrame(rafRef.current);
        stopEngine();
        stopMusic();
        setResult({ time: S.player.totalTime, best: S.player.bestLap, pos });
        setPhase('finished');
        if (pos === 1) { saveLocalScore('racing', Math.round(10000 / S.player.totalTime)); sfx.success(); }
        else sfx.fail();
        return;
      }

      // Camera — follow player
      const camX = S.player.x - CW / 2;
      const camY = S.player.y - CH / 2;

      // Render
      drawBg(ctx, S.track.theme, camX, camY);
      drawTrack(ctx, S.path, S.norms, S.track.width, S.track.theme, camX, camY);
      drawParticles(ctx, S.particles, camX, camY);

      // AI bike
      drawBike(ctx, S.ai.x, S.ai.y, S.ai.angle, S.ai.lean, '#ff4444', '#ff9999', false, camX, camY, S.ai.nitroOn);
      // Player bike
      drawBike(ctx, S.player.x, S.player.y, S.player.angle, S.player.lean, '#0047FF', '#00aaff', true, camX, camY, S.player.nitroOn);

      // Position: compare path progress
      const pProg = S.player.prevIdx + S.player.lap * S.path.length;
      const aProg = S.ai.prevIdx + S.ai.lap * S.path.length;
      const pos: 1 | 2 = pProg >= aProg ? 1 : 2;

      drawHUD(ctx, S.player, S.track, pos);
      drawMiniMap(ctx, S.path, S.player, S.ai, CW - 200, CH - 164, 186, 150);

      rafRef.current = requestAnimationFrame(loop);
    };

    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      stopEngine();
      stopMusic();
    };
  }, [phase]);

  // Keyboard handlers
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

  // Touch controls
  const setTouch = (key: keyof typeof touchRef.current, val: boolean) => { touchRef.current[key] = val; };

  return (
    <div className="min-h-dvh bg-midnight flex flex-col items-center pt-16 pb-24">
      <div className="fluid-container px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="p-2 glass rounded-xl text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Motorcycle Racing</h1>
            <p className="text-sm text-white/50">High-speed circuit racing · Drift · Nitro</p>
          </div>
        </div>

        {/* Game Area */}
        <div className="relative w-full" style={{ maxWidth: CW, margin: '0 auto' }}>
          <div className="relative rounded-2xl overflow-hidden game-viewport-3d game-scanlines game-neon-border" style={{ aspectRatio: `${CW}/${CH}` }}>
            <canvas
              ref={canvasRef}
              width={CW}
              height={CH}
              className="w-full h-full block"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Select Screen */}
            <AnimatePresence>
              {phase === 'select' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-midnight/95"
                >
                  <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="text-center mb-10">
                    <div className="text-6xl mb-4">🏍️</div>
                    <h2 className="text-3xl font-bold text-white mb-2">Choose Your Circuit</h2>
                    <p className="text-white/50">Race against an AI opponent — 3 laps to glory</p>
                  </motion.div>
                  <div className="grid grid-cols-2 gap-4 w-full max-w-lg px-4">
                    {TRACKS.map((t, i) => (
                      <motion.button
                        key={t.id}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setSelectedTrack(i); startRace(i); }}
                        className={`glass-dark rounded-2xl p-6 text-left border transition-all ${
                          i === 0 ? 'border-cobalt/40 hover:border-cobalt' : 'border-gold/40 hover:border-gold'
                        }`}
                      >
                        <div className="text-3xl mb-3">{t.theme === 'neon' ? '🌆' : '🏜️'}</div>
                        <div className="font-bold text-white text-lg">{t.name}</div>
                        <div className="text-white/50 text-sm mt-1">{t.totalLaps} Laps · {t.theme === 'neon' ? 'Night' : 'Day'}</div>
                        <div className="flex gap-2 mt-3">
                          {t.theme === 'neon' && <span className="px-2 py-0.5 rounded text-xs bg-cobalt/20 text-cobalt-bright border border-cobalt/30">NEON</span>}
                          {t.theme === 'desert' && <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">DESERT</span>}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-white/30 text-sm mt-8">Arrow Keys / WASD · Space = Nitro</p>
                </motion.div>
              )}

              {/* Countdown */}
              {phase === 'countdown' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/60"
                >
                  <motion.div
                    key={countdown}
                    initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="text-9xl font-bold text-cobalt-bright"
                    style={{ textShadow: '0 0 60px #00aaff' }}
                  >
                    {countdown}
                  </motion.div>
                </motion.div>
              )}

              {/* Finished */}
              {phase === 'finished' && result && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/80"
                >
                  <motion.div
                    initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
                    className="glass-dark rounded-2xl p-10 text-center border border-cobalt/30 max-w-sm w-full mx-4"
                  >
                    <div className="text-6xl mb-4">{result.pos === 1 ? '🏆' : '🥈'}</div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {result.pos === 1 ? '1st Place!' : '2nd Place'}
                    </h2>
                    <p className="text-white/50 mb-6">
                      {result.pos === 1 ? 'You beat the AI!' : 'So close — try again!'}
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="glass rounded-xl p-3">
                        <div className="text-cobalt-bright text-lg font-bold">{fmtTime(result.time)}</div>
                        <div className="text-white/40 text-xs">Total Time</div>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <div className="text-gold text-lg font-bold">{result.best < Infinity ? fmtTime(result.best) : '—'}</div>
                        <div className="text-white/40 text-xs">Best Lap</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => startRace(selectedTrack)}
                        className="flex-1 btn-cobalt py-3 rounded-xl text-sm font-bold"
                      >
                        Race Again
                      </button>
                      <button
                        onClick={() => setPhase('select')}
                        className="flex-1 btn-glass py-3 rounded-xl text-sm font-bold"
                      >
                        Change Track
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Touch Controls */}
          {phase === 'racing' && (
            <div className="mt-4 flex items-center justify-between gap-4 select-none md:hidden">
              {/* Left cluster */}
              <div className="flex gap-3">
                <button
                  onPointerDown={() => setTouch('left', true)} onPointerUp={() => setTouch('left', false)}
                  className="w-16 h-16 glass rounded-2xl flex items-center justify-center text-2xl active:bg-cobalt/30 touch-none"
                >◀</button>
                <button
                  onPointerDown={() => setTouch('right', true)} onPointerUp={() => setTouch('right', false)}
                  className="w-16 h-16 glass rounded-2xl flex items-center justify-center text-2xl active:bg-cobalt/30 touch-none"
                >▶</button>
              </div>
              {/* Nitro */}
              <button
                onPointerDown={() => setTouch('nitro', true)} onPointerUp={() => setTouch('nitro', false)}
                className="w-16 h-16 rounded-full bg-cobalt/20 border border-cobalt/50 flex items-center justify-center active:bg-cobalt/60 touch-none"
              >
                <Zap className="w-7 h-7 text-cobalt-bright" />
              </button>
              {/* Right cluster */}
              <div className="flex gap-3">
                <button
                  onPointerDown={() => setTouch('brake', true)} onPointerUp={() => setTouch('brake', false)}
                  className="w-16 h-16 glass rounded-2xl flex items-center justify-center text-sm font-bold text-red-400 active:bg-red-500/30 touch-none"
                >BRAKE</button>
                <button
                  onPointerDown={() => setTouch('accel', true)} onPointerUp={() => setTouch('accel', false)}
                  className="w-16 h-16 glass rounded-2xl flex items-center justify-center text-sm font-bold text-cobalt-bright active:bg-cobalt/30 touch-none"
                >GAS</button>
              </div>
            </div>
          )}

          {/* Controls hint */}
          {phase === 'racing' && (
            <div className="hidden md:flex items-center justify-center gap-6 mt-4 text-white/30 text-xs">
              <span>← → Steer</span>
              <span>↑ Accelerate</span>
              <span>↓ Brake</span>
              <span>Space / Shift = Nitro</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
