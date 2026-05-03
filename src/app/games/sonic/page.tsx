'use client';

import {
  useRef, useEffect, useState, useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronLeft, RotateCcw, Trophy, Star, Heart } from 'lucide-react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import OSController from '@/components/OSController';
import { saveLocalScore, formatNumber } from '@/lib/utils';
import {
  ZONES, TILE_SIZE, ZONE_W, ZONE_H,
  createPlayer, createEnemy, createRing, createParticle,
  JUMP_POWER, AIR_RESISTANCE, SPIN_DASH_MAX,
  type Player, type Enemy, type Particle, type RingCollectible, type Zone,
} from '@/games/sonic/engine';

// Canvas size
const CW = 896;
const CH = 504;

export default function VelocityRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const stateRef = useRef({
    player: createPlayer(64, 400),
    enemies: [] as Enemy[],
    rings: [] as RingCollectible[],
    particles: [] as Particle[],
    camX: 0,
    lives: 3,
    score: 0,
    time: 0,
    zone: 0,
    paused: false,
    gameOver: false,
    levelComplete: false,
    keys: new Set<string>(),
    touchLeft: false,
    touchRight: false,
    touchJump: false,
    touchSpin: false,
    frameCount: 0,
  });

  const [uiState, setUiState] = useState({
    lives: 3, rings: 0, score: 0, zone: 0, gameOver: false,
    levelComplete: false, paused: false, started: false,
  });

  const initZone = useCallback((zoneIdx: number) => {
    const zone = ZONES[zoneIdx];
    const s = stateRef.current;
    s.zone = zoneIdx;
    s.player = createPlayer(64, 400);
    s.enemies = zone.enemies.map(createEnemy);
    s.rings = zone.rings.map(createRing);
    s.particles = [];
    s.camX = 0;
    s.time = 0;
    s.gameOver = false;
    s.levelComplete = false;
    setUiState((u) => ({ ...u, lives: s.lives, rings: 0, score: s.score, zone: zoneIdx, gameOver: false, levelComplete: false }));
  }, []);

  useEffect(() => { initZone(0); }, [initZone]);

  // ─── Input ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      stateRef.current.keys[down ? 'add' : 'delete'](e.code);
      if (down && (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') && e.target === document.body)
        e.preventDefault();
    };
    document.addEventListener('keydown', (e) => onKey(e, true));
    document.addEventListener('keyup', (e) => onKey(e, false));
    return () => {
      document.removeEventListener('keydown', (e) => onKey(e, true));
      document.removeEventListener('keyup', (e) => onKey(e, false));
    };
  }, []);

  // ─── OSC handlers ──────────────────────────────────────────────────────
  const handleOSC = useCallback((action: string, active: boolean) => {
    const s = stateRef.current;
    if (action === 'left')  s.touchLeft  = active;
    if (action === 'right') s.touchRight = active;
    if (action === 'A')     s.touchJump  = active;
    if (action === 'B')     s.touchSpin  = active;
  }, []);

  // ─── Game Loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const getTile = (zone: Zone, tx: number, ty: number): number => {
      if (ty < 0 || ty >= ZONE_H || tx < 0 || tx >= ZONE_W) return 1; // solid border
      return zone.tilemap[ty]?.[tx] ?? 0;
    };

    const isSolid = (zone: Zone, tx: number, ty: number) => {
      const t = getTile(zone, tx, ty);
      return t === 1 || t === 2 || t === 3;
    };

    const loop = () => {
      const s = stateRef.current;
      if (s.gameOver || s.levelComplete) { animRef.current = requestAnimationFrame(loop); return; }
      const zone = ZONES[s.zone];
      const p = s.player;
      s.frameCount++;
      s.time++;

      // ── Player physics ────────────────────────────────────────────────
      const left  = s.keys.has('ArrowLeft')  || s.keys.has('KeyA') || s.touchLeft;
      const right = s.keys.has('ArrowRight') || s.keys.has('KeyD') || s.touchRight;
      const jump  = s.keys.has('ArrowUp')    || s.keys.has('KeyW') || s.keys.has('Space') || s.touchJump;
      const spin  = s.keys.has('KeyX')       || s.keys.has('ShiftLeft') || s.touchSpin;

      if (!p.dead) {
        // Horizontal movement
        if (left)  { p.vx -= zone.boost; p.facingRight = false; }
        if (right) { p.vx += zone.boost; p.facingRight = true; }
        if (!left && !right) p.vx *= zone.friction;
        p.vx = Math.max(-zone.maxSpeed, Math.min(zone.maxSpeed, p.vx));
        p.speed = Math.abs(p.vx);

        // Spin dash
        if (spin && p.grounded) {
          p.spinCharge = Math.min(1, p.spinCharge + 0.05);
        } else if (!spin && p.spinCharge > 0.1) {
          // Release spin dash
          p.vx = (p.facingRight ? 1 : -1) * p.spinCharge * SPIN_DASH_MAX;
          p.spinCharge = 0;
          s.particles.push(...createParticle(p.x, p.y + 16, zone.accentColor, 10));
        }

        // Jump
        if (jump && p.grounded) {
          p.vy = JUMP_POWER;
          p.grounded = false;
          s.particles.push(...createParticle(p.x, p.y + 28, '#FFFFFF', 4));
        }
        // Variable jump height
        if (!jump && p.vy < -4) p.vy += 0.8;

        // Gravity
        p.vy += zone.gravity;
        p.vy = Math.min(p.vy, 18); // terminal velocity
        p.vx *= AIR_RESISTANCE;

        // Move X
        p.x += p.vx;

        // X collision
        const tx = Math.floor(p.x / TILE_SIZE);
        const tyMid = Math.floor((p.y + 16) / TILE_SIZE);
        if (p.vx > 0 && isSolid(zone, Math.floor((p.x + 12) / TILE_SIZE), tyMid)) {
          p.x = Math.floor((p.x + 12) / TILE_SIZE) * TILE_SIZE - 13;
          p.vx = 0;
        }
        if (p.vx < 0 && isSolid(zone, Math.floor((p.x - 12) / TILE_SIZE), tyMid)) {
          p.x = (Math.floor((p.x - 12) / TILE_SIZE) + 1) * TILE_SIZE + 12;
          p.vx = 0;
        }

        // Move Y
        p.y += p.vy;
        p.grounded = false;

        // Y collision (feet)
        const tyFeet = Math.floor((p.y + 28) / TILE_SIZE);
        const txFeet = Math.floor((p.x) / TILE_SIZE);
        const footTile = getTile(zone, txFeet, tyFeet);

        if (p.vy > 0 && isSolid(zone, txFeet, tyFeet)) {
          p.y = tyFeet * TILE_SIZE - 28;
          p.vy = 0;
          p.grounded = true;
        }
        // Spring
        if (p.vy >= 0 && footTile === 4) {
          p.vy = JUMP_POWER * 1.8;
          p.grounded = false;
          s.particles.push(...createParticle(p.x, p.y + 28, '#FFD700', 8));
        }
        // Spike — lose rings
        if (footTile === 5 && p.invincible === 0) {
          s.particles.push(...createParticle(p.x, p.y, '#FF4444', 12));
          p.rings = 0;
          p.invincible = 120;
          if (s.lives <= 1) {
            p.dead = true;
            s.gameOver = true;
            setUiState((u) => ({ ...u, gameOver: true }));
            saveLocalScore('sonic', s.score);
          } else {
            s.lives--;
            p.x = 64; p.y = 400;
            setUiState((u) => ({ ...u, lives: s.lives }));
          }
        }
        // Goal
        if (footTile === 6) {
          const timeBonus = Math.max(0, 5000 - s.time * 5);
          s.score += 5000 + timeBonus;
          s.levelComplete = true;
          setUiState((u) => ({ ...u, levelComplete: true, score: s.score }));
        }

        // Y ceiling
        const tyHead = Math.floor((p.y - 4) / TILE_SIZE);
        if (p.vy < 0 && isSolid(zone, txFeet, tyHead)) {
          p.y = (tyHead + 1) * TILE_SIZE + 4;
          p.vy = 0;
        }

        // Invincibility frames
        if (p.invincible > 0) p.invincible--;

        // Screen bounds
        p.x = Math.max(12, p.x);
        if (p.y > ZONE_H * TILE_SIZE + 100) {
          // Fell off world
          if (s.lives <= 1) { s.gameOver = true; setUiState((u) => ({ ...u, gameOver: true })); }
          else { s.lives--; p.x = 64; p.y = 400; p.vy = 0; setUiState((u) => ({ ...u, lives: s.lives })); }
        }

        // Animation
        p.animTimer++;
        if (p.grounded && Math.abs(p.vx) > 0.5) {
          if (p.animTimer > Math.max(2, 8 - p.speed)) { p.animFrame = (p.animFrame + 1) % 6; p.animTimer = 0; }
        } else if (!p.grounded) { p.animFrame = 4; }
        else { p.animFrame = 0; }
      }

      // ── Camera ───────────────────────────────────────────────────────
      const targetCam = p.x - CW * 0.35;
      s.camX += (targetCam - s.camX) * 0.12;
      s.camX = Math.max(0, Math.min(s.camX, ZONE_W * TILE_SIZE - CW));

      // ── Enemies ──────────────────────────────────────────────────────
      for (const e of s.enemies) {
        if (!e.alive) continue;
        if (e.type === 'walker') {
          e.x += e.vx;
          e.vy += zone.gravity;
          e.y += e.vy;
          const etx = Math.floor(e.x / TILE_SIZE);
          const ety = Math.floor((e.y + 20) / TILE_SIZE);
          if (isSolid(zone, etx, ety)) { e.y = ety * TILE_SIZE - 20; e.vy = 0; }
          // Turn at walls
          if (isSolid(zone, Math.floor((e.x + e.vx * 10) / TILE_SIZE), Math.floor((e.y + 10) / TILE_SIZE))) e.vx *= -1;
          // Turn at edges
          const ahead = Math.floor((e.x + e.vx * 20) / TILE_SIZE);
          if (!isSolid(zone, ahead, ety + 1)) e.vx *= -1;
          e.animFrame = Math.floor(s.frameCount / 8) % 2;
        } else if (e.type === 'flyer') {
          e.x += e.vx;
          e.y = ZONES[s.zone].checkpoint.y - 80 + Math.sin(s.frameCount * 0.05) * 30;
          if (e.x < 100 || e.x > ZONE_W * TILE_SIZE - 100) e.vx *= -1;
        }

        // Player vs enemy collision
        if (p.invincible === 0 && !p.dead) {
          const dx = p.x - e.x; const dy = p.y - e.y;
          if (Math.abs(dx) < 28 && Math.abs(dy) < 28) {
            // Stomping from above kills enemy
            if (p.vy > 0 && p.y < e.y) {
              e.alive = false;
              s.score += 200;
              p.vy = JUMP_POWER * 0.7;
              s.particles.push(...createParticle(e.x, e.y, '#FFD700', 12));
              setUiState((u) => ({ ...u, score: s.score }));
            } else {
              // Take hit
              p.rings = 0;
              p.invincible = 120;
              p.vx = (p.x < e.x ? -1 : 1) * 5;
              p.vy = -6;
              s.particles.push(...createParticle(p.x, p.y, '#FF4444', 8));
            }
          }
        }
      }

      // ── Rings ─────────────────────────────────────────────────────────
      for (const r of s.rings) {
        if (r.collected) continue;
        r.animFrame = Math.floor(s.frameCount / 4) % 8;
        const dx = p.x - r.x; const dy = p.y - r.y;
        if (Math.abs(dx) < 24 && Math.abs(dy) < 24) {
          r.collected = true;
          p.rings++;
          s.score += 10;
          s.particles.push(...createParticle(r.x, r.y, '#FFD700', 4));
          setUiState((u) => ({ ...u, rings: p.rings, score: s.score }));
        }
      }

      // ── Particles ────────────────────────────────────────────────────
      for (const pt of s.particles) {
        pt.x += pt.vx; pt.y += pt.vy;
        pt.vy += 0.2;
        pt.life--;
      }
      s.particles = s.particles.filter((pt) => pt.life > 0);

      // ── Draw ──────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, CW, CH);

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, CH);
      bg.addColorStop(0, zone.bgColors[0]);
      bg.addColorStop(1, zone.bgColors[1]);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CW, CH);

      // Stars / BG details
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      for (let i = 0; i < 60; i++) {
        const sx = ((i * 127 + s.frameCount * 0.1) % (CW + 50)) - 25;
        const sy = (i * 89) % CH;
        ctx.beginPath(); ctx.arc(sx, sy, 0.8, 0, Math.PI * 2); ctx.fill();
      }

      // Parallax hills
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      for (let i = 0; i < 8; i++) {
        const hx = (i * 180 - (s.camX * 0.3) % 180) - 90;
        ctx.beginPath();
        ctx.ellipse(hx, CH - 60, 80, 50, 0, Math.PI, 0);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(-s.camX, 0);

      // ── Draw tiles ───────────────────────────────────────────────────
      const startTX = Math.floor(s.camX / TILE_SIZE);
      const endTX = Math.min(ZONE_W, startTX + Math.ceil(CW / TILE_SIZE) + 2);

      for (let ty = 0; ty < ZONE_H; ty++) {
        for (let tx = startTX; tx < endTX; tx++) {
          const t = zone.tilemap[ty]?.[tx] ?? 0;
          if (t === 0) continue;
          const px = tx * TILE_SIZE;
          const py = ty * TILE_SIZE;

          if (t === 1) {
            // Solid ground
            const grad = ctx.createLinearGradient(px, py, px, py + TILE_SIZE);
            grad.addColorStop(0, zone.tileColor);
            grad.addColorStop(1, 'rgba(0,0,0,0.3)');
            ctx.fillStyle = grad;
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            // Top shine
            ctx.fillStyle = zone.accentColor + '33';
            ctx.fillRect(px, py, TILE_SIZE, 3);
          } else if (t === 4) {
            // Spring
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(px + 4, py + 20, TILE_SIZE - 8, TILE_SIZE - 20);
            ctx.fillStyle = '#FFA500';
            ctx.fillRect(px + 2, py + 14, TILE_SIZE - 4, 8);
          } else if (t === 5) {
            // Spike
            ctx.fillStyle = '#FF4444';
            for (let si = 0; si < 3; si++) {
              ctx.beginPath();
              ctx.moveTo(px + si * 10 + 5, py + TILE_SIZE);
              ctx.lineTo(px + si * 10, py + 4);
              ctx.lineTo(px + si * 10 + 10, py + 4);
              ctx.fill();
            }
          } else if (t === 6) {
            // Goal post
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(px + 12, py - TILE_SIZE * 2, 8, TILE_SIZE * 3);
            ctx.fillStyle = '#FF8800';
            ctx.fillRect(px + 4, py - TILE_SIZE * 2, 28, 16);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText('GOAL', px + 3, py - TILE_SIZE * 2 + 12);
          }
        }
      }

      // ── Draw enemies ─────────────────────────────────────────────────
      for (const e of s.enemies) {
        if (!e.alive) continue;
        ctx.fillStyle = e.type === 'flyer' ? '#FF8800' : '#CC2200';
        // Body
        ctx.beginPath();
        ctx.ellipse(e.x, e.y, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(e.x + (e.vx > 0 ? 5 : -5), e.y - 3, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(e.x + (e.vx > 0 ? 6 : -6), e.y - 3, 2, 0, Math.PI * 2); ctx.fill();
        // Flyer wings
        if (e.type === 'flyer') {
          ctx.fillStyle = 'rgba(255,200,0,0.5)';
          ctx.beginPath();
          ctx.ellipse(e.x - 18, e.y - 5, 12, 6, Math.sin(s.frameCount * 0.2) * 0.3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath();
          ctx.ellipse(e.x + 18, e.y - 5, 12, 6, -Math.sin(s.frameCount * 0.2) * 0.3, 0, Math.PI * 2); ctx.fill();
        }
      }

      // ── Draw rings ───────────────────────────────────────────────────
      for (const r of s.rings) {
        if (r.collected) continue;
        const pulse = 0.8 + Math.sin(s.frameCount * 0.15 + r.x * 0.1) * 0.2;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, 10 * pulse, 10, Math.sin(s.frameCount * 0.1) * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        // Inner shine
        ctx.fillStyle = 'rgba(255,215,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, 7 * pulse, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Draw player ───────────────────────────────────────────────────
      if (!p.dead && (p.invincible === 0 || Math.floor(p.invincible / 5) % 2 === 0)) {
        ctx.save();
        ctx.translate(p.x, p.y);
        if (!p.facingRight) ctx.scale(-1, 1);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 28, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (circle when spinning, oval when running)
        const isRunning = p.grounded && p.speed > 1;
        if (p.spinning || p.spinCharge > 0) {
          // Spin dash ball
          const spokes = 8;
          ctx.strokeStyle = zone.accentColor;
          ctx.lineWidth = 2;
          for (let i = 0; i < spokes; i++) {
            const a = (s.frameCount * 0.4 + (i / spokes) * Math.PI * 2);
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
            ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
            ctx.stroke();
          }
          ctx.fillStyle = zone.accentColor;
          ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
        } else {
          // Body
          ctx.fillStyle = zone.accentColor;
          ctx.beginPath();
          ctx.ellipse(0, 0, 12, isRunning ? 10 : 12, 0, 0, Math.PI * 2);
          ctx.fill();
          // Highlight
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.beginPath();
          ctx.ellipse(-3, -5, 5, 4, -0.5, 0, Math.PI * 2);
          ctx.fill();
          // Eyes
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(7, -4, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#0047FF';
          ctx.beginPath(); ctx.arc(8, -4, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.beginPath(); ctx.arc(9, -4, 1.5, 0, Math.PI * 2); ctx.fill();
          // Spiky hair quills
          ctx.fillStyle = '#007700';
          const quills = [[-4, -14], [2, -16], [8, -12]];
          for (const [qx, qy] of quills) {
            ctx.beginPath();
            ctx.moveTo(qx - 4, -8);
            ctx.lineTo(qx, qy);
            ctx.lineTo(qx + 4, -8);
            ctx.closePath(); ctx.fill();
          }
          // Legs animation
          if (isRunning) {
            const legPhase = (s.frameCount * 0.25) % (Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath(); ctx.ellipse(Math.sin(legPhase) * 6, 14, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(-Math.sin(legPhase) * 6, 14, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
          } else {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath(); ctx.ellipse(-5, 14, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(5, 14, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
          }
        }

        // Speed lines
        if (p.speed > 8) {
          ctx.strokeStyle = zone.accentColor + '60';
          ctx.lineWidth = 1.5;
          for (let i = 0; i < 3; i++) {
            const ly = -8 + i * 8;
            ctx.beginPath();
            ctx.moveTo(-14, ly);
            ctx.lineTo(-14 - p.speed * 2, ly);
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      // ── Draw particles ───────────────────────────────────────────────
      for (const pt of s.particles) {
        const alpha = pt.life / pt.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.restore(); // un-translate camera

      // ── HUD ───────────────────────────────────────────────────────────
      // Speed indicator
      const speedPct = p.speed / zone.maxSpeed;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(10, CH - 32, 120, 16);
      ctx.fillStyle = zone.accentColor;
      ctx.fillRect(10, CH - 32, speedPct * 120, 16);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`SPEED ${p.speed.toFixed(1)}`, 14, CH - 19);

      // Zone name
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(zone.name, CW - 10, 20);
      ctx.textAlign = 'left';

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const restart = () => {
    const s = stateRef.current;
    s.lives = 3;
    s.score = 0;
    initZone(0);
    setUiState((u) => ({ ...u, started: true, gameOver: false, levelComplete: false }));
  };

  const nextZone = () => {
    const s = stateRef.current;
    const next = s.zone + 1;
    if (next >= ZONES.length) {
      s.gameOver = true;
      setUiState((u) => ({ ...u, gameOver: true }));
      return;
    }
    initZone(next);
    setUiState((u) => ({ ...u, levelComplete: false, started: true }));
  };

  return (
    <div className="min-h-dvh pt-16 md:pt-20 pb-24 flex flex-col">
      <div className="fluid-container py-4 flex-1">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-2 glass rounded-xl text-white/50 hover:text-white">
            <ChevronLeft size={18} />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Zap size={18} className="text-cobalt-light" />
            <h1 className="text-xl font-bold text-white">Velocity Runner</h1>
            <span className="text-xs text-white/30">Legendary Icons</span>
          </div>
          {/* HUD */}
          <div className="flex items-center gap-3 text-sm">
            <div className="glass px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <span className="text-yellow-400">⭕</span>
              <span className="font-bold">{uiState.rings}</span>
            </div>
            <div className="glass px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Heart size={13} className="text-red-400" />
              <span className="font-bold">{uiState.lives}</span>
            </div>
            <div className="glass px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Trophy size={13} className="text-yellow-400" />
              <span className="font-bold">{formatNumber(uiState.score)}</span>
            </div>
          </div>
        </div>

        {/* Controls hint */}
        <div className="text-xs text-white/30 mb-2 text-center">
          ← → Move &nbsp;|&nbsp; ↑ / Space Jump &nbsp;|&nbsp; X / Shift Spin Dash &nbsp;|&nbsp; Stomp enemies from above
        </div>

        {/* Canvas */}
        <div className="game-viewport game-viewport-3d game-scanlines game-neon-border mb-4" onClick={() => setUiState((u) => ({ ...u, started: true }))}>
          <canvas ref={canvasRef} width={CW} height={CH} className="w-full h-full block" />
          {!uiState.started && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="text-center">
                <div className="text-4xl mb-2">⚡</div>
                <div className="text-xl font-bold text-white mb-1">Velocity Runner</div>
                <div className="text-sm text-white/60 mb-4">Zone 1: {ZONES[0].name}</div>
                <button className="btn-cobalt" onClick={restart}>Start Running</button>
              </div>
            </div>
          )}
        </div>

        {/* OSC for mobile */}
        <OSController onAction={handleOSC} />
      </div>

      {/* Level Complete */}
      <AnimatePresence>
        {uiState.levelComplete && !uiState.gameOver && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div initial={{scale:0.8,y:30}} animate={{scale:1,y:0}} className="glass-dark rounded-2xl p-8 text-center border border-cobalt/30 max-w-sm w-full">
              <div className="text-5xl mb-3">⚡</div>
              <h2 className="text-2xl font-bold text-white mb-2">Zone Clear!</h2>
              <div className="elo-badge mx-auto mb-6">Score: {formatNumber(uiState.score)}</div>
              <button onClick={nextZone} className="btn-cobalt w-full">
                {stateRef.current.zone + 1 < ZONES.length ? 'Next Zone →' : 'Final Lap!'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over */}
      <AnimatePresence>
        {uiState.gameOver && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div initial={{scale:0.8}} animate={{scale:1}} className="glass-dark rounded-2xl p-8 text-center border border-red-500/20 max-w-sm w-full">
              <div className="text-5xl mb-3">💀</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {uiState.score > 5000 ? 'Legendary Run!' : 'Game Over'}
              </h2>
              <div className="text-3xl font-bold text-cobalt-gradient mb-6">{formatNumber(uiState.score)}</div>
              <div className="flex gap-3">
                <button onClick={restart} className="btn-cobalt flex-1"><RotateCcw size={14} /> Retry</button>
                <Link href="/" className="btn-glass flex-1 text-sm flex items-center justify-center">Hub</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
