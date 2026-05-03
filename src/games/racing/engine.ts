// Motorcycle Racing Physics Engine — Marzouq's Gaming Center

export interface Vec2 { x: number; y: number }

// ─── Spline ───────────────────────────────────────────────────────────────────
function catmullRom(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const t2 = t * t, t3 = t2 * t;
  return {
    x: 0.5 * ((2*p1.x) + (-p0.x + p2.x)*t + (2*p0.x - 5*p1.x + 4*p2.x - p3.x)*t2 + (-p0.x + 3*p1.x - 3*p2.x + p3.x)*t3),
    y: 0.5 * ((2*p1.y) + (-p0.y + p2.y)*t + (2*p0.y - 5*p1.y + 4*p2.y - p3.y)*t2 + (-p0.y + 3*p1.y - 3*p2.y + p3.y)*t3),
  };
}

export function buildPath(wps: Vec2[], steps = 24): Vec2[] {
  const n = wps.length;
  const pts: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = wps[(i - 1 + n) % n], p1 = wps[i];
    const p2 = wps[(i + 1) % n], p3 = wps[(i + 2) % n];
    for (let s = 0; s < steps; s++) pts.push(catmullRom(p0, p1, p2, p3, s / steps));
  }
  return pts;
}

export function buildNormals(path: Vec2[]): Vec2[] {
  const n = path.length;
  return path.map((_, i) => {
    const a = path[(i - 1 + n) % n], b = path[(i + 1) % n];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    return { x: -dy / len, y: dx / len };
  });
}

export function closestOnPath(pos: Vec2, path: Vec2[]): number {
  let mi = 0, md = Infinity;
  for (let i = 0; i < path.length; i++) {
    const d = Math.hypot(pos.x - path[i].x, pos.y - path[i].y);
    if (d < md) { md = d; mi = i; }
  }
  return mi;
}

// ─── Core Types ───────────────────────────────────────────────────────────────
export interface Racer {
  x: number; y: number;
  angle: number;
  speed: number;
  lean: number;
  gear: number;
  rpm: number;
  nitro: number;
  nitroOn: boolean;
  drifting: boolean;
  driftAngle: number;
  offTrack: boolean;
  lap: number;
  lapTime: number;
  bestLap: number;
  totalTime: number;
  prevIdx: number;
  finished: boolean;
}

export interface Input {
  left: boolean; right: boolean;
  accel: boolean; brake: boolean;
  nitro: boolean;
}

export interface TrackDef {
  id: string;
  name: string;
  theme: 'neon' | 'desert' | 'mountain';
  waypoints: Vec2[];
  width: number;
  totalLaps: number;
  startAngle: number;
}

// ─── Physics Constants ────────────────────────────────────────────────────────
export const PH = {
  ACCEL:        380,
  BRAKE:        720,
  MAX_SPD:      700,
  NITRO_SPD:    870,
  IDLE_DECEL:   210,
  FRICTION:     0.987,
  TURN:         2.6,
  LEAN_RATE:    8,
  MAX_LEAN:     0.36,
  DRIFT_THRESH: 0.50,
  DRIFT_DECAY:  0.91,
  NITRO_DRAIN:  20,
  NITRO_REGEN:  5,
  OFF_PENALTY:  0.55,
} as const;

export function makeRacer(x: number, y: number, angle: number): Racer {
  return {
    x, y, angle, speed: 0, lean: 0,
    gear: 1, rpm: 800,
    nitro: 100, nitroOn: false,
    drifting: false, driftAngle: 0, offTrack: false,
    lap: 1, lapTime: 0, bestLap: Infinity,
    totalTime: 0, prevIdx: 0, finished: false,
  };
}

export function stepRacer(
  r: Racer, inp: Input, dt: number,
  path: Vec2[], norms: Vec2[], width: number, totalLaps: number,
): Racer {
  if (r.finished) return r;
  const s: Racer = { ...r };
  const P = PH;

  // Nitro
  s.nitroOn = inp.nitro && s.nitro > 0.5;
  s.nitro = s.nitroOn
    ? Math.max(0, s.nitro - P.NITRO_DRAIN * dt)
    : Math.min(100, s.nitro + P.NITRO_REGEN * dt);

  const maxSpd = s.nitroOn ? P.NITRO_SPD : P.MAX_SPD;
  const eff = s.offTrack ? P.OFF_PENALTY : 1;

  // Speed
  if (inp.accel) s.speed = Math.min(s.speed + P.ACCEL * eff * dt, maxSpd);
  else if (inp.brake) s.speed = Math.max(0, s.speed - P.BRAKE * dt);
  else s.speed = Math.max(0, s.speed - P.IDLE_DECEL * dt);
  s.speed *= Math.pow(P.FRICTION, dt * 60);

  // Gear (1-6)
  const ratio = s.speed / P.MAX_SPD;
  s.gear = Math.min(6, Math.max(1, Math.ceil(ratio * 6)));
  s.rpm = Math.min(8000, 800 + ratio * 7000);

  // Steering — responsive at mid-speed, limited at extremes
  const tr = P.TURN * Math.sqrt(Math.min(ratio, 1)) * (s.drifting ? 1.3 : 1);
  if (s.speed > 10) {
    if (inp.left) s.angle -= tr * dt;
    if (inp.right) s.angle += tr * dt;
  }

  // Lean animation
  const tgtLean = inp.left ? -P.MAX_LEAN : inp.right ? P.MAX_LEAN : 0;
  s.lean += (tgtLean - s.lean) * P.LEAN_RATE * dt;

  // Drift
  const driftCond = ratio > P.DRIFT_THRESH && (inp.left || inp.right) && inp.accel;
  if (driftCond) {
    s.drifting = true;
    s.driftAngle += (s.lean * 0.45 - s.driftAngle) * 5 * dt;
    s.speed *= Math.pow(P.DRIFT_DECAY, dt * 60);
  } else {
    s.drifting = false;
    s.driftAngle *= Math.pow(0.88, dt * 60);
    if (Math.abs(s.driftAngle) < 0.001) s.driftAngle = 0;
  }

  // Integrate position
  const ma = s.angle + s.driftAngle;
  s.x += Math.cos(ma) * s.speed * dt;
  s.y += Math.sin(ma) * s.speed * dt;

  // Track boundary constraint
  const ci = closestOnPath({ x: s.x, y: s.y }, path);
  const cp = path[ci], cn = norms[ci];
  const side = (s.x - cp.x) * cn.x + (s.y - cp.y) * cn.y;
  const half = width / 2;
  s.offTrack = Math.abs(side) > half * 0.8;
  if (Math.abs(side) > half) {
    const pen = Math.abs(side) - half;
    const dir = side > 0 ? 1 : -1;
    s.x -= cn.x * dir * pen;
    s.y -= cn.y * dir * pen;
    s.speed *= 0.7;
  }

  // Lap detection: cross start after 75% of track traversed
  const n = path.length;
  const sp = path[0];
  if (Math.hypot(s.x - sp.x, s.y - sp.y) < 42 && s.prevIdx > n * 0.72 && s.lapTime > 4) {
    if (s.lapTime < s.bestLap) s.bestLap = s.lapTime;
    s.lap++;
    if (s.lap > totalLaps) { s.finished = true; s.lap = totalLaps; }
    s.lapTime = 0;
  }
  s.prevIdx = ci;
  s.lapTime += dt;
  s.totalTime += dt;
  return s;
}

// ─── AI Opponent ──────────────────────────────────────────────────────────────
export interface AIRacer extends Racer { tgtIdx: number }

export function makeAI(x: number, y: number, angle: number): AIRacer {
  return { ...makeRacer(x, y, angle), tgtIdx: 10 };
}

export function stepAI(
  ai: AIRacer, dt: number,
  path: Vec2[], norms: Vec2[], width: number, totalLaps: number,
  difficulty = 0.85,
): AIRacer {
  const s = { ...ai };
  const tgt = path[s.tgtIdx % path.length];
  const dx = tgt.x - s.x, dy = tgt.y - s.y;
  if (Math.hypot(dx, dy) < 50) s.tgtIdx = (s.tgtIdx + 7) % path.length;

  let diff = Math.atan2(dy, dx) - s.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;

  const inp: Input = {
    left: diff < -0.07,
    right: diff > 0.07,
    accel: Math.abs(diff) < 0.9 && s.speed < PH.MAX_SPD * difficulty,
    brake: Math.abs(diff) > 1.1 && s.speed > 200,
    nitro: s.nitro > 25 && Math.abs(diff) < 0.12,
  };
  return { ...stepRacer(s, inp, dt, path, norms, width, totalLaps), tgtIdx: s.tgtIdx };
}

// ─── Particles ────────────────────────────────────────────────────────────────
export interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number;
  r: number; g: number; b: number;
  size: number;
  kind: 'dust' | 'nitro';
}

export function spawnDrift(x: number, y: number, angle: number): Particle[] {
  return Array.from({ length: 4 }, () => ({
    x: x + (Math.random() - 0.5) * 10,
    y: y + (Math.random() - 0.5) * 10,
    vx: Math.cos(angle + Math.PI) * (15 + Math.random() * 35),
    vy: Math.sin(angle + Math.PI) * (15 + Math.random() * 35),
    life: 0.9, maxLife: 0.9,
    r: 180, g: 180, b: 180,
    size: 5 + Math.random() * 8,
    kind: 'dust' as const,
  }));
}

export function spawnNitro(x: number, y: number, angle: number): Particle[] {
  return Array.from({ length: 6 }, () => ({
    x: x + Math.cos(angle + Math.PI) * 14 + (Math.random() - 0.5) * 5,
    y: y + Math.sin(angle + Math.PI) * 14 + (Math.random() - 0.5) * 5,
    vx: Math.cos(angle + Math.PI) * (70 + Math.random() * 60),
    vy: Math.sin(angle + Math.PI) * (70 + Math.random() * 60),
    life: 0.35, maxLife: 0.35,
    r: 0, g: 200, b: 255,
    size: 3 + Math.random() * 5,
    kind: 'nitro' as const,
  }));
}

export function stepParticles(ps: Particle[], dt: number): Particle[] {
  return ps
    .map(p => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, life: p.life - dt }))
    .filter(p => p.life > 0);
}

// ─── Track Definitions ────────────────────────────────────────────────────────
export const TRACKS: TrackDef[] = [
  {
    id: 'neon-city',
    name: 'Neon City Circuit',
    theme: 'neon',
    totalLaps: 3,
    startAngle: -0.5,
    width: 112,
    waypoints: [
      { x: 340, y: 330 },
      { x: 580, y: 150 },
      { x: 900, y: 145 },
      { x: 1120, y: 310 },
      { x: 1180, y: 580 },
      { x: 960, y: 760 },
      { x: 620, y: 800 },
      { x: 310, y: 700 },
      { x: 150, y: 490 },
    ],
  },
  {
    id: 'desert-dash',
    name: 'Desert Dash',
    theme: 'desert',
    totalLaps: 2,
    startAngle: 0.4,
    width: 124,
    waypoints: [
      { x: 360, y: 200 },
      { x: 720, y: 110 },
      { x: 1080, y: 200 },
      { x: 1260, y: 440 },
      { x: 1160, y: 710 },
      { x: 800, y: 850 },
      { x: 400, y: 840 },
      { x: 130, y: 660 },
      { x: 100, y: 390 },
    ],
  },
];
