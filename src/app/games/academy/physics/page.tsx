'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Atom, ChevronLeft, RotateCcw, Trophy, Target } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import Link from 'next/link';
import { saveLocalScore, formatNumber } from '@/lib/utils';

interface Projectile {
  x: number; y: number;
  vx: number; vy: number;
  trail: { x: number; y: number }[];
  active: boolean;
}

interface TargetObj {
  x: number; y: number;
  radius: number;
  hit: boolean;
  points: number;
  vx: number; // some targets move
}

interface Level {
  gravity: number;
  wind: number;
  targets: Omit<TargetObj, 'hit'>[];
  description: string;
  name: string;
}

const LEVELS: Level[] = [
  {
    name: 'Lunar Lob',
    description: 'Low gravity. Hit all 3 targets.',
    gravity: 0.08,
    wind: 0,
    targets: [
      { x: 500, y: 250, radius: 30, points: 100, vx: 0 },
      { x: 650, y: 180, radius: 25, points: 150, vx: 0 },
      { x: 750, y: 300, radius: 20, points: 200, vx: 0 },
    ],
  },
  {
    name: 'Earth Range',
    description: 'Standard gravity. 4 targets.',
    gravity: 0.18,
    wind: 0,
    targets: [
      { x: 420, y: 270, radius: 28, points: 100, vx: 0 },
      { x: 560, y: 200, radius: 22, points: 150, vx: 0 },
      { x: 680, y: 280, radius: 24, points: 130, vx: 0 },
      { x: 760, y: 160, radius: 18, points: 200, vx: 0 },
    ],
  },
  {
    name: 'Wind Tunnel',
    description: 'Strong wind from the right.',
    gravity: 0.16,
    wind: -0.06,
    targets: [
      { x: 600, y: 300, radius: 30, points: 120, vx: 0 },
      { x: 700, y: 200, radius: 22, points: 160, vx: 0 },
      { x: 550, y: 150, radius: 20, points: 200, vx: 0 },
    ],
  },
  {
    name: 'Moving Targets',
    description: 'Targets are moving. Time your shot!',
    gravity: 0.16,
    wind: 0,
    targets: [
      { x: 500, y: 250, radius: 26, points: 200, vx: 1.5 },
      { x: 650, y: 180, radius: 22, points: 220, vx: -1.2 },
      { x: 720, y: 320, radius: 20, points: 250, vx: 2 },
    ],
  },
  {
    name: 'Jupiter Pull',
    description: 'Extreme gravity. Shoot almost vertical!',
    gravity: 0.38,
    wind: 0,
    targets: [
      { x: 350, y: 200, radius: 32, points: 150, vx: 0 },
      { x: 500, y: 280, radius: 26, points: 200, vx: 0 },
      { x: 650, y: 220, radius: 22, points: 250, vx: 0 },
    ],
  },
];

const CANVAS_W = 900;
const CANVAS_H = 400;
const CANNON_X = 60;
const CANNON_Y = 350;

export default function PhysicsLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [levelIdx, setLevelIdx] = useState(0);
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(60);
  const [projectile, setProjectile] = useState<Projectile | null>(null);
  const [targets, setTargets] = useState<TargetObj[]>([]);
  const [score, setScore] = useState(0);
  const [shotsTaken, setShotsTaken] = useState(0);
  const [levelComplete, setLevelComplete] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const animRef = useRef<number>();
  const projRef = useRef<Projectile | null>(null);
  const targetsRef = useRef<TargetObj[]>([]);

  const level = LEVELS[levelIdx];

  const initLevel = useCallback(() => {
    const ts: TargetObj[] = LEVELS[levelIdx].targets.map((t) => ({ ...t, hit: false }));
    setTargets(ts);
    targetsRef.current = ts;
    setProjectile(null);
    projRef.current = null;
    setLevelComplete(false);
  }, [levelIdx]);

  useEffect(() => { initLevel(); }, [initLevel]);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    sky.addColorStop(0, '#0A0A1A');
    sky.addColorStop(1, '#1A1A2E');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 80; i++) {
      const sx = ((i * 127) % CANVAS_W);
      const sy = ((i * 89) % (CANVAS_H * 0.6));
      ctx.beginPath();
      ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground
    const ground = ctx.createLinearGradient(0, CANVAS_H - 40, 0, CANVAS_H);
    ground.addColorStop(0, '#1A2A1A');
    ground.addColorStop(1, '#0A1A0A');
    ctx.fillStyle = ground;
    ctx.fillRect(0, CANVAS_H - 40, CANVAS_W, 40);
    ctx.strokeStyle = 'rgba(0,200,80,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, CANVAS_H - 40); ctx.lineTo(CANVAS_W, CANVAS_H - 40); ctx.stroke();

    // Cannon
    ctx.save();
    ctx.translate(CANNON_X, CANNON_Y);
    // Base
    ctx.fillStyle = '#3A3A4A';
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0047FF'; ctx.lineWidth = 2; ctx.stroke();
    // Barrel
    ctx.rotate((-angle * Math.PI) / 180);
    const barrelGrad = ctx.createLinearGradient(0, -6, 40, -6);
    barrelGrad.addColorStop(0, '#5A5A6A');
    barrelGrad.addColorStop(1, '#3A3A4A');
    ctx.fillStyle = barrelGrad;
    ctx.fillRect(0, -7, 42, 14);
    ctx.strokeStyle = '#0047FF'; ctx.lineWidth = 1.5;
    ctx.strokeRect(0, -7, 42, 14);
    ctx.restore();

    // Wind indicator
    if (level.wind !== 0) {
      ctx.fillStyle = 'rgba(0, 170, 255, 0.7)';
      ctx.font = '12px monospace';
      ctx.fillText(`Wind: ${level.wind > 0 ? '→' : '←'} ${Math.abs(level.wind * 1000).toFixed(0)}`, 10, 20);
    }
    // Gravity indicator
    ctx.fillStyle = 'rgba(0, 170, 255, 0.5)';
    ctx.font = '11px monospace';
    ctx.fillText(`g = ${level.gravity.toFixed(2)} m/s²`, 10, 38);

    // Move and update projectile
    const proj = projRef.current;
    if (proj && proj.active) {
      proj.vx += level.wind;
      proj.vy += level.gravity;
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.trail.push({ x: proj.x, y: proj.y });
      if (proj.trail.length > 60) proj.trail.shift();

      // Ground collision
      if (proj.y >= CANVAS_H - 40) {
        proj.active = false;
      }

      // Target collisions
      const ts = targetsRef.current;
      let anyHit = false;
      for (const t of ts) {
        if (t.hit) continue;
        const dx = proj.x - t.x; const dy = proj.y - t.y;
        if (Math.sqrt(dx*dx + dy*dy) < t.radius + 6) {
          t.hit = true;
          anyHit = true;
          setScore((s) => s + t.points);
          // Explosion particles (via state would be complex, just mark hit)
        }
      }
      if (anyHit) {
        targetsRef.current = [...ts];
        setTargets([...ts]);
        const allHit = ts.every((t) => t.hit);
        if (allHit) setLevelComplete(true);
      }
    }

    // Move moving targets
    const ts = targetsRef.current;
    for (const t of ts) {
      if (t.vx !== 0 && !t.hit) {
        t.x += t.vx;
        if (t.x > CANVAS_W - 50 || t.x < 250) t.vx *= -1;
      }
    }

    // Draw trail
    if (proj) {
      ctx.beginPath();
      for (let i = 0; i < proj.trail.length; i++) {
        const pt = proj.trail[i];
        const alpha = i / proj.trail.length * 0.7;
        ctx.strokeStyle = `rgba(0, 170, 255, ${alpha})`;
        ctx.lineWidth = 2;
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Projectile ball
      if (proj.active) {
        const ballGrad = ctx.createRadialGradient(proj.x - 2, proj.y - 2, 1, proj.x, proj.y, 7);
        ballGrad.addColorStop(0, '#00AAFF');
        ballGrad.addColorStop(1, '#0047FF');
        ctx.fillStyle = ballGrad;
        ctx.beginPath(); ctx.arc(proj.x, proj.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,200,255,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }

    // Draw targets
    for (const t of ts) {
      if (t.hit) {
        // Explosion remnants
        ctx.fillStyle = 'rgba(255,200,0,0.3)';
        ctx.beginPath(); ctx.arc(t.x, t.y, t.radius * 1.5, 0, Math.PI * 2); ctx.fill();
        continue;
      }
      // Target ring
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
      ctx.beginPath(); ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Inner ring
      ctx.strokeStyle = 'rgba(255,215,0,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.radius * 0.5, 0, Math.PI * 2); ctx.stroke();
      // Crosshair
      ctx.strokeStyle = 'rgba(255,215,0,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(t.x - t.radius, t.y); ctx.lineTo(t.x + t.radius, t.y);
      ctx.moveTo(t.x, t.y - t.radius); ctx.lineTo(t.x, t.y + t.radius);
      ctx.stroke();
      // Points label
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`+${t.points}`, t.x, t.y - t.radius - 6);
    }

    // Trajectory preview
    if (!proj || !proj.active) {
      const rad = (-angle * Math.PI) / 180;
      const speed = power * 0.12;
      let px = CANNON_X + Math.cos(rad) * 42;
      let py = CANNON_Y + Math.sin(rad) * 42;
      let pvx = Math.cos(rad) * speed;
      let pvy = Math.sin(rad) * speed;

      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(0,71,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px, py);
      for (let i = 0; i < 80; i++) {
        pvx += level.wind;
        pvy += level.gravity;
        px += pvx; py += pvy;
        if (py > CANVAS_H - 40 || px > CANVAS_W) break;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    animRef.current = requestAnimationFrame(animate);
  }, [angle, power, level]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [animate]);

  const shoot = () => {
    if (projectile?.active) return;
    const rad = (-angle * Math.PI) / 180;
    const speed = power * 0.12;
    const proj: Projectile = {
      x: CANNON_X + Math.cos(rad) * 42,
      y: CANNON_Y + Math.sin(rad) * 42,
      vx: Math.cos(rad) * speed,
      vy: Math.sin(rad) * speed,
      trail: [],
      active: true,
    };
    projRef.current = proj;
    setProjectile(proj);
    setShotsTaken((s) => s + 1);
  };

  const nextLevel = () => {
    if (levelIdx + 1 >= LEVELS.length) { setGameOver(true); return; }
    setLevelIdx((i) => i + 1);
    setLevelComplete(false);
    setShotsTaken(0);
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
              <Atom size={18} className="text-cobalt-bright" />
              <h1 className="text-xl font-bold text-white">Physics Lab</h1>
              <span className="text-xs text-white/30">The Academy</span>
            </div>
            <p className="text-xs text-white/40">Level {levelIdx + 1}/{LEVELS.length} — {level.name}</p>
          </div>
          <div className="ml-auto glass px-3 py-1.5 rounded-xl flex items-center gap-2 text-sm">
            <Trophy size={13} className="text-yellow-400" />
            <span className="font-bold">{formatNumber(score)}</span>
          </div>
        </div>

        {/* Canvas */}
        <div className="game-viewport mb-6">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full h-full block"
          />
        </div>

        {/* Controls */}
        <GlassCard className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
            <div>
              <label className="block text-xs text-cobalt-light mb-1 font-medium">
                Launch Angle: {angle}°
              </label>
              <input
                type="range" min="5" max="85" value={angle}
                onChange={(e) => setAngle(+e.target.value)}
                className="w-full accent-cobalt"
              />
            </div>
            <div>
              <label className="block text-xs text-cobalt-light mb-1 font-medium">
                Launch Power: {power}%
              </label>
              <input
                type="range" min="10" max="100" value={power}
                onChange={(e) => setPower(+e.target.value)}
                className="w-full accent-cobalt"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={shoot}
                disabled={projectile?.active}
                className="btn-cobalt flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Target size={15} /> Launch
              </button>
              <button onClick={initLevel} className="btn-glass px-3">
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
          <div className="mt-3 text-xs text-white/30 flex gap-4">
            <span>Shots: {shotsTaken}</span>
            <span>Targets: {targets.filter(t => t.hit).length}/{targets.length}</span>
            <span className="italic">{level.description}</span>
          </div>
        </GlassCard>

        {/* Level complete */}
        <AnimatePresence>
          {levelComplete && !gameOver && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }}
                className="glass-dark rounded-2xl p-8 text-center border border-cobalt/30 max-w-sm w-full"
              >
                <div className="text-5xl mb-3">🎯</div>
                <h2 className="text-2xl font-bold text-white mb-2">Level Complete!</h2>
                <p className="text-white/50 text-sm mb-6">
                  All targets hit in {shotsTaken} shot{shotsTaken !== 1 ? 's' : ''}
                </p>
                <div className="elo-badge mx-auto mb-6">Score: {formatNumber(score)}</div>
                <button onClick={nextLevel} className="btn-cobalt w-full">
                  {levelIdx + 1 < LEVELS.length ? 'Next Level →' : 'Finish!'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                className="glass-dark rounded-2xl p-8 text-center border border-yellow-400/30 max-w-sm w-full"
              >
                <div className="text-5xl mb-3">🏆</div>
                <h2 className="text-2xl font-bold text-white mb-2">Physics Master!</h2>
                <p className="text-white/50 text-sm mb-6">All {LEVELS.length} levels conquered</p>
                <div className="text-3xl font-bold text-cobalt-gradient mb-6">{formatNumber(score)}</div>
                <div className="flex gap-3">
                  <button onClick={() => { setLevelIdx(0); setScore(0); setGameOver(false); }} className="btn-cobalt flex-1">
                    Play Again
                  </button>
                  <Link href="/" className="btn-glass flex-1 text-sm text-center flex items-center justify-center">
                    Hub
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
