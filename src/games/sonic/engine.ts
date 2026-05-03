// ════════════════════════════════════════════════════════════════════════════
// Marzouq's Gaming Center — Velocity Runner Engine (Sonic-style)
// Momentum physics, loops, spin dash, 60fps Canvas2D rendering
// ════════════════════════════════════════════════════════════════════════════

export interface Vec2 { x: number; y: number; }

export interface Player {
  x: number; y: number;
  vx: number; vy: number;
  angle: number;         // Rotation angle on slopes/loops
  grounded: boolean;
  spinning: boolean;     // Spin dash charged
  spinCharge: number;    // 0–1
  facingRight: boolean;
  animFrame: number;
  animTimer: number;
  dead: boolean;
  invincible: number;    // frames of invincibility
  rings: number;
  speed: number;         // current ground speed (for display)
}

export interface Tile {
  solid: boolean;
  type: 'air' | 'ground' | 'slope' | 'loop' | 'spring' | 'spike' | 'ring' | 'checkpoint' | 'goal' | 'boost';
  angle: number;         // slope angle in radians
  springPower?: number;
  color?: string;
}

export interface Enemy {
  x: number; y: number;
  vx: number; vy: number;
  type: 'walker' | 'flyer' | 'shooter';
  dir: number;           // 1 or -1
  alive: boolean;
  animFrame: number;
  shootTimer: number;
}

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;          // frames remaining
  maxLife: number;
  color: string;
  size: number;
}

export interface RingCollectible {
  x: number; y: number;
  collected: boolean;
  animFrame: number;
}

export interface Zone {
  name: string;
  bgColors: [string, string]; // gradient top/bottom
  accentColor: string;
  tileColor: string;
  tilemap: number[][];     // 0=air, 1=solid, 2=slope-up, 3=slope-down, 4=spring, 5=spike, 6=goal
  enemies: Omit<Enemy, 'alive' | 'animFrame' | 'shootTimer'>[];
  rings: Omit<RingCollectible, 'collected' | 'animFrame'>[];
  gravity: number;
  friction: number;
  maxSpeed: number;
  boost: number;           // Acceleration
  checkpoint: { x: number; y: number };
}

// ─── Zone Definitions ─────────────────────────────────────────────────────
// Each zone is 50 tiles wide x 20 tiles tall
// Tile size: 32px
export const TILE_SIZE = 32;
export const ZONE_W = 50;
export const ZONE_H = 20;

// Build a tilemap for zone 1 (Green Speed Zone)
function makeZone1Tilemap(): number[][] {
  const m: number[][] = Array.from({ length: ZONE_H }, () => new Array(ZONE_W).fill(0));
  // Ground layer
  for (let x = 0; x < ZONE_W; x++) {
    m[16][x] = 1; m[17][x] = 1; m[18][x] = 1; m[19][x] = 1;
  }
  // Hills
  for (let x = 5; x < 10; x++) m[15][x] = 1;
  for (let x = 12; x < 18; x++) m[14][x] = 1;
  // Platforms
  m[12][20] = 1; m[12][21] = 1; m[12][22] = 1;
  m[10][26] = 1; m[10][27] = 1; m[10][28] = 1;
  // Springs
  m[15][15] = 4;
  m[15][32] = 4;
  // Spikes
  m[15][40] = 5; m[15][41] = 5;
  // Goal
  m[15][48] = 6;
  return m;
}

function makeZone2Tilemap(): number[][] {
  const m: number[][] = Array.from({ length: ZONE_H }, () => new Array(ZONE_W).fill(0));
  for (let x = 0; x < ZONE_W; x++) {
    m[17][x] = 1; m[18][x] = 1; m[19][x] = 1;
  }
  // Vertical section
  for (let y = 10; y < 17; y++) { m[y][20] = 1; m[y][21] = 1; }
  // Platforms
  for (let x = 8; x < 14; x++) m[15][x] = 1;
  for (let x = 24; x < 30; x++) m[12][x] = 1;
  for (let x = 34; x < 40; x++) m[8][x] = 1;
  m[15][22] = 4; // spring
  m[15][43] = 5; m[15][44] = 5; // spikes
  m[16][48] = 6; // goal
  return m;
}

export const ZONES: Zone[] = [
  {
    name: 'Emerald Sprint',
    bgColors: ['#0A1A0A', '#1A3A1A'],
    accentColor: '#00FF88',
    tileColor: '#2A6A2A',
    tilemap: makeZone1Tilemap(),
    gravity: 0.5,
    friction: 0.85,
    maxSpeed: 12,
    boost: 0.4,
    checkpoint: { x: 600, y: 440 },
    enemies: [
      { x: 400, y: 480, vx: -1, vy: 0, type: 'walker', dir: -1 },
      { x: 700, y: 480, vx: 1,  vy: 0, type: 'walker', dir: 1  },
      { x: 900, y: 380, vx: -1, vy: 0, type: 'flyer',  dir: -1 },
    ],
    rings: [
      { x: 120, y: 460 }, { x: 152, y: 460 }, { x: 184, y: 460 },
      { x: 320, y: 420 }, { x: 352, y: 420 },
      { x: 500, y: 380 }, { x: 532, y: 380 },
      { x: 680, y: 300 }, { x: 720, y: 460 },
      { x: 800, y: 460 }, { x: 840, y: 460 }, { x: 880, y: 420 },
    ],
  },
  {
    name: 'Azure Velocity',
    bgColors: ['#050A1A', '#0A1A3A'],
    accentColor: '#00AAFF',
    tileColor: '#1A4A8A',
    tilemap: makeZone2Tilemap(),
    gravity: 0.45,
    friction: 0.88,
    maxSpeed: 14,
    boost: 0.45,
    checkpoint: { x: 700, y: 440 },
    enemies: [
      { x: 300, y: 480, vx: -1.5, vy: 0, type: 'walker', dir: -1 },
      { x: 500, y: 480, vx: 1.5,  vy: 0, type: 'walker', dir: 1  },
      { x: 750, y: 320, vx: -1,   vy: 0, type: 'flyer',  dir: -1 },
      { x: 850, y: 480, vx: -1,   vy: 0, type: 'walker', dir: -1 },
    ],
    rings: [
      { x: 200, y: 460 }, { x: 232, y: 460 }, { x: 264, y: 460 },
      { x: 400, y: 380 }, { x: 432, y: 340 },
      { x: 600, y: 300 }, { x: 640, y: 260 },
      { x: 750, y: 460 }, { x: 800, y: 460 }, { x: 850, y: 420 },
      { x: 920, y: 460 }, { x: 950, y: 460 },
    ],
  },
];

// ─── Physics Constants ─────────────────────────────────────────────────────
export const AIR_RESISTANCE = 0.98;
export const JUMP_POWER = -11;
export const SPIN_DASH_MAX = 16;

// ─── Utility ──────────────────────────────────────────────────────────────
export function createPlayer(x: number, y: number): Player {
  return {
    x, y,
    vx: 0, vy: 0,
    angle: 0,
    grounded: false,
    spinning: false,
    spinCharge: 0,
    facingRight: true,
    animFrame: 0,
    animTimer: 0,
    dead: false,
    invincible: 0,
    rings: 0,
    speed: 0,
  };
}

export function createEnemy(e: Omit<Enemy, 'alive' | 'animFrame' | 'shootTimer'>): Enemy {
  return { ...e, alive: true, animFrame: 0, shootTimer: 0 };
}

export function createRing(r: Omit<RingCollectible, 'collected' | 'animFrame'>): RingCollectible {
  return { ...r, collected: false, animFrame: 0 };
}

export function createParticle(x: number, y: number, color: string, count = 6): Particle[] {
  return Array.from({ length: count }, () => ({
    x, y,
    vx: (Math.random() - 0.5) * 6,
    vy: (Math.random() - 0.5) * 6 - 2,
    life: 30,
    maxLife: 30,
    color,
    size: Math.random() * 4 + 2,
  }));
}
