'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronLeft, RotateCcw, Trophy, Heart } from 'lucide-react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import OSController from '@/components/OSController';
import { saveLocalScore, formatNumber } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Rect { x: number; y: number; w: number; h: number; }
function rectsOverlap(a: Rect, b: Rect) {
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

const CW = 896, CH = 504;
const TILE = 40;
const GRAVITY = 0.55;
const JUMP = -13;
const SPEED = 4.5;
const FRICTION = 0.82;

// ─── Level Map ──────────────────────────────────────────────────────────────
// 0=air, 1=brick, 2=grass, 3=coin, 4=enemy-spawn, 5=pipe, 6=flag, 7=spike
const LEVELS = [
  {
    name: 'World 1-1: Cobalt Fields',
    bgColor: ['#0A0A1E', '#1A1A3E'],
    tileColor: '#2A5A2A',
    accentColor: '#00FF88',
    map: [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,3,3,0,0,0,0,0,0,3,0,0,3,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,1,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0],
      [0,0,1,1,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,1,1,1],
      [0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,7,7,0,0,0,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6,1,1],
    ],
  },
  {
    name: 'World 1-2: Night Canyon',
    bgColor: ['#050510', '#0A0A20'],
    tileColor: '#3A3A8A',
    accentColor: '#0047FF',
    map: [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,3,3,0,0,0,0],
      [0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0],
      [0,0,0,4,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0],
      [0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,4,0],
      [0,0,0,0,0,0,7,7,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
      [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,7,0,0,0,0,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6,1,1],
    ],
  },
];

export default function ApexPlatformer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();

  const stateRef = useRef({
    // Player
    px: TILE * 1.5, py: 200, pvx: 0, pvy: 0,
    grounded: false, facingRight: true, animFrame: 0, animTimer: 0,
    lives: 3, dead: false, invincible: 0,
    // World
    coins: 0, score: 0, levelIdx: 0, camX: 0,
    // Enemies
    enemies: [] as {x:number;y:number;vx:number;alive:boolean;animFrame:number}[],
    // Coins
    coinObjs: [] as {x:number;y:number;collected:boolean}[],
    // Goal
    goalReached: false, gameOver: false,
    // Input
    keys: new Set<string>(),
    touchLeft: false, touchRight: false, touchJump: false,
    frameCount: 0,
  });

  const [uiState, setUiState] = useState({ lives: 3, coins: 0, score: 0, levelIdx: 0, gameOver: false, levelComplete: false, started: false });

  const initLevel = useCallback((idx: number) => {
    const lvl = LEVELS[idx % LEVELS.length];
    const s = stateRef.current;
    s.levelIdx = idx;
    s.px = TILE * 1.5; s.py = 200;
    s.pvx = 0; s.pvy = 0;
    s.grounded = false; s.dead = false; s.invincible = 0;
    s.camX = 0;
    s.goalReached = false; s.gameOver = false;
    s.enemies = [];
    s.coinObjs = [];

    for (let row = 0; row < lvl.map.length; row++) {
      for (let col = 0; col < lvl.map[row].length; col++) {
        const t = lvl.map[row][col];
        const wx = col * TILE; const wy = row * TILE;
        if (t === 4) s.enemies.push({ x: wx + TILE/2, y: wy, vx: -1.8, alive: true, animFrame: 0 });
        if (t === 3) s.coinObjs.push({ x: wx + TILE/2, y: wy + TILE/2, collected: false });
      }
    }
    setUiState((u) => ({ ...u, levelIdx: idx, coins: s.coins, score: s.score, gameOver: false, levelComplete: false }));
  }, []);

  useEffect(() => { initLevel(0); }, [initLevel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      stateRef.current.keys[down ? 'add' : 'delete'](e.code);
      if (down && ['ArrowUp','Space','KeyW'].includes(e.code) && e.target === document.body) e.preventDefault();
    };
    document.addEventListener('keydown', (e) => onKey(e, true));
    document.addEventListener('keyup', (e) => onKey(e, false));
    return () => {
      document.removeEventListener('keydown', (e) => onKey(e, true));
      document.removeEventListener('keyup', (e) => onKey(e, false));
    };
  }, []);

  const handleOSC = useCallback((action: string, active: boolean) => {
    const s = stateRef.current;
    if (action === 'left')  s.touchLeft  = active;
    if (action === 'right') s.touchRight = active;
    if (action === 'A')     s.touchJump  = active;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const getTile = (col: number, row: number, map: number[][]): number => {
      if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) return 0;
      return map[row][col];
    };

    const isSolidTile = (t: number) => t === 1 || t === 2 || t === 5;

    const loop = () => {
      const s = stateRef.current;
      if (s.goalReached || s.gameOver) { animRef.current = requestAnimationFrame(loop); return; }
      const lvl = LEVELS[s.levelIdx % LEVELS.length];
      s.frameCount++;

      const left  = s.keys.has('ArrowLeft')  || s.keys.has('KeyA') || s.touchLeft;
      const right = s.keys.has('ArrowRight') || s.keys.has('KeyD') || s.touchRight;
      const jump  = s.keys.has('ArrowUp')    || s.keys.has('Space') || s.keys.has('KeyW') || s.touchJump;

      if (!s.dead) {
        // Horizontal
        if (left)  { s.pvx -= 0.6; s.facingRight = false; }
        if (right) { s.pvx += 0.6; s.facingRight = true; }
        if (!left && !right) s.pvx *= FRICTION;
        s.pvx = Math.max(-SPEED, Math.min(SPEED, s.pvx));

        // Jump
        if (jump && s.grounded) { s.pvy = JUMP; s.grounded = false; }
        if (!jump && s.pvy < -4) s.pvy += 0.8;

        // Gravity
        s.pvy += GRAVITY;
        s.pvy = Math.min(s.pvy, 20);

        // Move X
        s.px += s.pvx;
        // Tile X collision
        const pRect = (): Rect => ({ x: s.px - 14, y: s.py - 20, w: 28, h: 38 });
        const colL = Math.floor((s.px - 14) / TILE);
        const colR = Math.floor((s.px + 14) / TILE);
        const rowM = Math.floor((s.py - 1) / TILE);
        if (s.pvx > 0 && isSolidTile(getTile(colR, rowM, lvl.map))) {
          s.px = colR * TILE - 15; s.pvx = 0;
        }
        if (s.pvx < 0 && isSolidTile(getTile(colL, rowM, lvl.map))) {
          s.px = (colL + 1) * TILE + 15; s.pvx = 0;
        }

        // Move Y
        s.py += s.pvy;
        s.grounded = false;
        const rowFoot = Math.floor((s.py + 18) / TILE);
        const rowHead = Math.floor((s.py - 20) / TILE);
        const colMid = Math.floor(s.px / TILE);

        if (s.pvy > 0 && isSolidTile(getTile(colMid, rowFoot, lvl.map))) {
          s.py = rowFoot * TILE - 19; s.pvy = 0; s.grounded = true;
        }
        if (s.pvy < 0 && isSolidTile(getTile(colMid, rowHead, lvl.map))) {
          s.py = (rowHead + 1) * TILE + 20; s.pvy = 1;
        }

        // Spike collision
        const spikeRow = Math.floor((s.py + 18) / TILE);
        if (getTile(colMid, spikeRow, lvl.map) === 7 && s.invincible === 0) {
          s.lives--;
          s.invincible = 120;
          s.pvy = JUMP * 0.6;
          if (s.lives <= 0) { s.gameOver = true; setUiState((u) => ({ ...u, gameOver: true })); saveLocalScore('platformer', s.score); }
          else setUiState((u) => ({ ...u, lives: s.lives }));
        }

        // Goal flag
        const goalRow = Math.floor((s.py + 10) / TILE);
        if (getTile(colMid, goalRow, lvl.map) === 6 || getTile(Math.floor((s.px+1)/TILE), goalRow, lvl.map) === 6) {
          s.goalReached = true;
          s.score += 2000;
          setUiState((u) => ({ ...u, levelComplete: true, score: s.score }));
        }

        if (s.invincible > 0) s.invincible--;

        // Fell off
        if (s.py > CH + 200) {
          s.lives--;
          if (s.lives <= 0) { s.gameOver = true; setUiState((u) => ({ ...u, gameOver: true })); }
          else { s.px = TILE * 1.5; s.py = 200; s.pvx = 0; s.pvy = 0; s.camX = 0; setUiState((u) => ({ ...u, lives: s.lives })); }
        }

        // Animation
        s.animTimer++;
        if (s.grounded && Math.abs(s.pvx) > 0.5) {
          if (s.animTimer > 6) { s.animFrame = (s.animFrame + 1) % 4; s.animTimer = 0; }
        } else { s.animFrame = s.grounded ? 0 : 2; }
      }

      // Camera
      const targetCam = s.px - CW * 0.35;
      s.camX += (targetCam - s.camX) * 0.1;
      s.camX = Math.max(0, s.camX);

      // Enemies
      for (const e of s.enemies) {
        if (!e.alive) continue;
        e.x += e.vx;
        const ec = Math.floor(e.x / TILE); const er = Math.floor((e.y + 30) / TILE);
        // Turn at walls/edges
        if (isSolidTile(getTile(Math.floor((e.x + e.vx*20)/TILE), er, lvl.map))) e.vx *= -1;
        if (!isSolidTile(getTile(ec, er + 1, lvl.map))) e.vx *= -1;
        e.y = er * TILE - 30;
        // Clamp to ground
        const groundRow = Math.floor((e.y + 32) / TILE);
        if (isSolidTile(getTile(ec, groundRow, lvl.map))) e.y = groundRow * TILE - 32;
        e.animFrame = Math.floor(s.frameCount / 8) % 2;

        // Player hit
        if (s.invincible === 0 && !s.dead) {
          const dx = s.px - e.x; const dy = s.py - e.y;
          if (Math.abs(dx) < 28 && Math.abs(dy) < 36) {
            if (s.pvy > 0 && s.py < e.y - 10) {
              e.alive = false;
              s.score += 300;
              s.pvy = JUMP * 0.65;
              setUiState((u) => ({ ...u, score: s.score }));
            } else if (s.invincible === 0) {
              s.lives--;
              s.invincible = 120;
              s.pvy = JUMP * 0.5;
              s.pvx = (s.px < e.x ? -1 : 1) * 3;
              if (s.lives <= 0) { s.gameOver = true; setUiState((u) => ({ ...u, gameOver: true })); }
              else setUiState((u) => ({ ...u, lives: s.lives }));
            }
          }
        }
      }

      // Coins
      for (const c of s.coinObjs) {
        if (c.collected) continue;
        const dx = s.px - c.x; const dy = s.py - c.y;
        if (Math.abs(dx) < 22 && Math.abs(dy) < 22) {
          c.collected = true;
          s.coins++; s.score += 50;
          setUiState((u) => ({ ...u, coins: s.coins, score: s.score }));
        }
      }

      // ── Draw ──────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, CW, CH);

      // BG
      const bg = ctx.createLinearGradient(0, 0, 0, CH);
      bg.addColorStop(0, lvl.bgColor[0]); bg.addColorStop(1, lvl.bgColor[1]);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH);

      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      for (let i = 0; i < 50; i++) {
        ctx.beginPath(); ctx.arc((i*137)%CW, (i*89)%(CH*0.7), 0.9, 0, Math.PI*2); ctx.fill();
      }

      ctx.save(); ctx.translate(-s.camX, 0);

      // Tiles
      for (let row = 0; row < lvl.map.length; row++) {
        for (let col = 0; col < lvl.map[row].length; col++) {
          const t = lvl.map[row][col];
          if (t === 0) continue;
          const tx = col * TILE; const ty = row * TILE;
          if (tx + TILE < s.camX || tx > s.camX + CW) continue;

          if (t === 1) {
            // Brick
            const g = ctx.createLinearGradient(tx, ty, tx, ty+TILE);
            g.addColorStop(0, lvl.tileColor); g.addColorStop(1, 'rgba(0,0,0,0.4)');
            ctx.fillStyle = g; ctx.fillRect(tx, ty, TILE, TILE);
            ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
            ctx.strokeRect(tx, ty, TILE, TILE);
            // Mortar lines
            ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(tx, ty+TILE*0.5); ctx.lineTo(tx+TILE, ty+TILE*0.5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(tx+TILE*0.5, ty); ctx.lineTo(tx+TILE*0.5, ty+TILE*0.5); ctx.stroke();
            // Top shine
            ctx.fillStyle = lvl.accentColor + '22';
            ctx.fillRect(tx, ty, TILE, 3);
          } else if (t === 5) {
            // Pipe
            ctx.fillStyle = '#1A6A1A';
            ctx.fillRect(tx+4, ty, TILE-8, TILE);
            ctx.fillStyle = '#2A8A2A';
            ctx.fillRect(tx, ty, TILE, 12);
          } else if (t === 6) {
            // Flag / Goal pole
            ctx.fillStyle = '#888888';
            ctx.fillRect(tx+TILE/2-2, ty-TILE*3, 4, TILE*4);
            ctx.fillStyle = lvl.accentColor;
            ctx.fillRect(tx+TILE/2+2, ty-TILE*3, 18, 14);
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 8px sans-serif';
            ctx.fillText('WIN', tx+TILE/2+4, ty-TILE*3+11);
          } else if (t === 7) {
            // Spike
            ctx.fillStyle = '#FF3333';
            ctx.beginPath();
            ctx.moveTo(tx+TILE/2, ty);
            ctx.lineTo(tx, ty+TILE);
            ctx.lineTo(tx+TILE, ty+TILE);
            ctx.closePath(); ctx.fill();
          }
        }
      }

      // Coins
      for (const c of s.coinObjs) {
        if (c.collected) continue;
        const pulse = 0.85 + Math.sin(s.frameCount * 0.1 + c.x) * 0.15;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 10);
        g.addColorStop(0, '#FFEE44'); g.addColorStop(1, '#FFB800');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(c.x, c.y, 9 * pulse, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Enemies
      for (const e of s.enemies) {
        if (!e.alive) continue;
        // Body
        ctx.fillStyle = '#CC2200';
        ctx.beginPath(); ctx.arc(e.x, e.y+15, 14, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#AA1A00';
        ctx.beginPath(); ctx.arc(e.x, e.y+20, 14, 0, Math.PI, false); ctx.fill();
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        const eyeOff = e.vx > 0 ? 4 : -4;
        ctx.beginPath(); ctx.arc(e.x+eyeOff, e.y+11, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(e.x+eyeOff+1, e.y+11, 2, 0, Math.PI*2); ctx.fill();
        // Feet
        const footSwing = Math.sin(s.frameCount * 0.2) * 5;
        ctx.fillStyle = '#CC2200';
        ctx.beginPath(); ctx.ellipse(e.x-6+footSwing, e.y+29, 6, 4, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(e.x+6-footSwing, e.y+29, 6, 4, 0, 0, Math.PI*2); ctx.fill();
      }

      // Player
      if (!s.dead && (s.invincible === 0 || Math.floor(s.invincible/5)%2===0)) {
        ctx.save();
        ctx.translate(s.px, s.py);
        if (!s.facingRight) ctx.scale(-1, 1);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath(); ctx.ellipse(0, 20, 14, 4, 0, 0, Math.PI*2); ctx.fill();

        // Body
        ctx.fillStyle = lvl.accentColor;
        ctx.beginPath(); ctx.roundRect(-12, -18, 24, 30, 6); ctx.fill();
        // Hat
        ctx.fillStyle = '#CC0000';
        ctx.beginPath(); ctx.roundRect(-13, -20, 26, 8, 3); ctx.fill();
        ctx.beginPath(); ctx.roundRect(-8, -26, 20, 8, 2); ctx.fill();
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(6, -12, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(7, -12, 2, 0, Math.PI*2); ctx.fill();
        // Mustache
        ctx.fillStyle = '#4A2800';
        ctx.beginPath();
        ctx.arc(3, -6, 5, 0, Math.PI, false); ctx.fill();
        ctx.beginPath();
        ctx.arc(10, -6, 5, 0, Math.PI, false); ctx.fill();
        // Overalls
        ctx.fillStyle = '#0000CC';
        ctx.beginPath(); ctx.roundRect(-10, -2, 20, 14, 4); ctx.fill();
        // Buttons
        ctx.fillStyle = '#FFAA00';
        ctx.beginPath(); ctx.arc(-4, 4, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(4, 4, 2, 0, Math.PI*2); ctx.fill();
        // Legs
        const run = s.grounded && Math.abs(s.pvx) > 0.5;
        const legSwing = run ? Math.sin(s.frameCount * 0.25) * 6 : 0;
        ctx.fillStyle = '#CC0000';
        ctx.beginPath(); ctx.ellipse(-6+legSwing, 18, 5, 7, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(6-legSwing, 18, 5, 7, 0, 0, Math.PI*2); ctx.fill();
        // Shoes
        ctx.fillStyle = '#3A2000';
        ctx.beginPath(); ctx.ellipse(-6+legSwing, 25, 7, 4, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(6-legSwing, 25, 7, 4, 0, 0, Math.PI*2); ctx.fill();

        ctx.restore();
      }

      ctx.restore();

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const restart = () => {
    const s = stateRef.current;
    s.lives = 3; s.coins = 0; s.score = 0;
    initLevel(0);
    setUiState((u) => ({ ...u, started: true, gameOver: false, levelComplete: false }));
  };

  const nextLevel = () => {
    const s = stateRef.current;
    const next = s.levelIdx + 1;
    if (next >= LEVELS.length) {
      s.gameOver = true;
      setUiState((u) => ({ ...u, gameOver: true }));
      saveLocalScore('platformer', s.score);
    } else {
      initLevel(next);
      setUiState((u) => ({ ...u, started: true, levelComplete: false }));
    }
  };

  return (
    <div className="min-h-dvh pt-16 md:pt-20 pb-24 flex flex-col">
      <div className="fluid-container py-4 flex-1">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-2 glass rounded-xl text-white/50 hover:text-white"><ChevronLeft size={18} /></Link>
          <div className="flex items-center gap-2 flex-1">
            <Shield size={18} className="text-cobalt-light" />
            <h1 className="text-xl font-bold text-white">Apex Platformer</h1>
            <span className="text-xs text-white/30">Legendary Icons</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="glass px-3 py-1.5 rounded-xl">🪙 {uiState.coins}</div>
            <div className="glass px-3 py-1.5 rounded-xl flex items-center gap-1"><Heart size={12} className="text-red-400" />{uiState.lives}</div>
            <div className="glass px-3 py-1.5 rounded-xl"><Trophy size={12} className="inline mr-1 text-yellow-400" />{formatNumber(uiState.score)}</div>
          </div>
        </div>

        <div className="text-xs text-white/30 mb-2 text-center">
          ← → Move &nbsp;|&nbsp; ↑ / Space Jump &nbsp;|&nbsp; Stomp enemies from above &nbsp;|&nbsp; Collect coins
        </div>

        <div className="game-viewport game-viewport-3d game-scanlines game-neon-border mb-4" onClick={() => setUiState((u) => ({ ...u, started: true }))}>
          <canvas ref={canvasRef} width={CW} height={CH} className="w-full h-full block" />
          {!uiState.started && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="text-center">
                <div className="text-4xl mb-2">🛡️</div>
                <div className="text-xl font-bold text-white mb-1">Apex Platformer</div>
                <div className="text-sm text-white/60 mb-4">{LEVELS[0].name}</div>
                <button className="btn-cobalt" onClick={restart}>Start Game</button>
              </div>
            </div>
          )}
        </div>

        <OSController onAction={handleOSC} buttons={[{ key: 'A', label: '↑' }]} />
      </div>

      <AnimatePresence>
        {uiState.levelComplete && !uiState.gameOver && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div initial={{scale:0.8,y:30}} animate={{scale:1,y:0}} className="glass-dark rounded-2xl p-8 text-center border border-cobalt/30 max-w-sm w-full">
              <div className="text-5xl mb-3">🏁</div>
              <h2 className="text-2xl font-bold text-white mb-2">Stage Clear!</h2>
              <div className="elo-badge mx-auto mb-6">Score: {formatNumber(uiState.score)}</div>
              <button onClick={nextLevel} className="btn-cobalt w-full">
                {uiState.levelIdx + 1 < LEVELS.length ? 'Next Stage →' : 'Victory!'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {uiState.gameOver && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div initial={{scale:0.8}} animate={{scale:1}} className="glass-dark rounded-2xl p-8 text-center border border-red-500/20 max-w-sm w-full">
              <div className="text-5xl mb-3">{uiState.score > 5000 ? '🏆' : '💀'}</div>
              <h2 className="text-2xl font-bold text-white mb-2">{uiState.score > 5000 ? 'Legendary!' : 'Game Over'}</h2>
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
