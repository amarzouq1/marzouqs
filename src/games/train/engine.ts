// Train Surf Runner Engine — Marzouq's Gaming Center
// Lane-based endless runner on top of a speeding train.

export const LANE_X = [180, 340, 500] as const; // canvas 680 wide, 3 lanes
export const LANE_COUNT = 3;
export const GROUND_Y = 330;
export const PLAYER_W = 40;
export const PLAYER_H = 56;

export type Lane = 0 | 1 | 2;

export interface TrainPlayer {
  lane: Lane;
  targetLane: Lane;
  laneT: number;        // 0-1 lerp progress
  x: number;
  y: number;
  vy: number;
  onGround: boolean;
  rolling: boolean;
  rollTimer: number;
  dead: boolean;
  invincible: number;   // frames
  runFrame: number;
  runTimer: number;
}

export interface Obstacle {
  id: number;
  lane: Lane;
  y: number;
  type: 'barrier' | 'lowbar' | 'gap' | 'box';
  w: number;
  h: number;
}

export interface Coin {
  id: number;
  lane: Lane;
  y: number;
  collected: boolean;
}

export interface TrainSegment {
  y: number;  // screen y (scrolls upward → negative direction)
}

export interface TrainState {
  player: TrainPlayer;
  obstacles: Obstacle[];
  coins: Coin[];
  segments: TrainSegment[];
  score: number;
  coins_collected: number;
  distance: number;   // meters
  speed: number;      // pixels/sec
  tick: number;
  nextObstacleIn: number;
  nextCoinIn: number;
  idCtr: number;
}

export function makePlayer(): TrainPlayer {
  return {
    lane: 1,
    targetLane: 1,
    laneT: 1,
    x: LANE_X[1],
    y: GROUND_Y,
    vy: 0,
    onGround: true,
    rolling: false,
    rollTimer: 0,
    dead: false,
    invincible: 0,
    runFrame: 0,
    runTimer: 0,
  };
}

export function makeState(): TrainState {
  return {
    player: makePlayer(),
    obstacles: [],
    coins: [],
    segments: Array.from({ length: 12 }, (_, i) => ({ y: i * 80 })),
    score: 0,
    coins_collected: 0,
    distance: 0,
    speed: 320,
    tick: 0,
    nextObstacleIn: 80,
    nextCoinIn: 40,
    idCtr: 1,
  };
}

const GRAVITY = 1600;
const JUMP_VY = -680;
const LANE_LERP = 10; // speed of lane transition

export interface TrainInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  roll: boolean;
}

let _leftPrev = false;
let _rightPrev = false;
let _jumpPrev = false;
let _rollPrev = false;

export function stepTrain(
  state: TrainState,
  input: TrainInput,
  dt: number,
): void {
  if (state.player.dead) return;

  const { player } = state;
  state.tick++;
  state.distance += state.speed * dt;
  state.score = Math.round(state.distance / 10) + state.coins_collected * 50;

  // Speed ramp: +10px/s every 5 seconds
  state.speed = Math.min(900, 320 + Math.floor(state.distance / 500) * 12);

  // ── Lane change ──
  const leftEdge = !_leftPrev && input.left;
  const rightEdge = !_rightPrev && input.right;
  _leftPrev  = input.left;
  _rightPrev = input.right;

  if (leftEdge && player.targetLane > 0 && player.laneT > 0.8) {
    player.targetLane = (player.targetLane - 1) as Lane;
    player.laneT = 0;
  }
  if (rightEdge && player.targetLane < 2 && player.laneT > 0.8) {
    player.targetLane = (player.targetLane + 1) as Lane;
    player.laneT = 0;
  }

  // Lerp lane
  if (player.lane !== player.targetLane) {
    player.laneT = Math.min(1, player.laneT + dt * LANE_LERP);
    const fromX = LANE_X[player.lane];
    const toX   = LANE_X[player.targetLane];
    player.x = fromX + (toX - fromX) * easeInOut(player.laneT);
    if (player.laneT >= 1) {
      player.lane = player.targetLane;
      player.laneT = 1;
    }
  } else {
    player.x = LANE_X[player.lane];
  }

  // ── Jump ──
  const jumpEdge = !_jumpPrev && input.jump;
  _jumpPrev = input.jump;
  if (jumpEdge && player.onGround) {
    player.vy = JUMP_VY;
    player.onGround = false;
  }

  // ── Roll ──
  const rollEdge = !_rollPrev && input.roll;
  _rollPrev = input.roll;
  if (rollEdge && !player.rolling) {
    player.rolling = true;
    player.rollTimer = 0.55;
  }
  if (player.rolling) {
    player.rollTimer -= dt;
    if (player.rollTimer <= 0) player.rolling = false;
  }

  // ── Physics ──
  if (!player.onGround) {
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;
    if (player.y >= GROUND_Y) {
      player.y = GROUND_Y;
      player.vy = 0;
      player.onGround = true;
    }
  }

  if (player.invincible > 0) player.invincible--;

  // ── Run animation ──
  player.runTimer += dt;
  if (player.runTimer > 0.1) {
    player.runTimer = 0;
    player.runFrame = (player.runFrame + 1) % 4;
  }

  // ── Scroll obstacles & coins ──
  const scroll = state.speed * dt;
  for (const obs of state.obstacles) obs.y += scroll;
  for (const coin of state.coins) coin.y += scroll;

  // ── Spawn obstacles ──
  state.nextObstacleIn -= scroll;
  if (state.nextObstacleIn <= 0) {
    const lane = Math.floor(Math.random() * LANE_COUNT) as Lane;
    const types: Obstacle['type'][] = state.distance < 400
      ? ['barrier', 'box']
      : ['barrier', 'lowbar', 'box', 'gap'];
    const type = types[Math.floor(Math.random() * types.length)];
    const h = type === 'lowbar' ? 22 : type === 'gap' ? 18 : 52;
    state.obstacles.push({ id: state.idCtr++, lane, y: -80, type, w: 52, h });
    state.nextObstacleIn = 180 + Math.random() * 120 - Math.floor(state.speed / 80) * 10;
  }

  // ── Spawn coins ──
  state.nextCoinIn -= scroll;
  if (state.nextCoinIn <= 0) {
    const lane = Math.floor(Math.random() * LANE_COUNT) as Lane;
    state.coins.push({ id: state.idCtr++, lane, y: -40, collected: false });
    state.nextCoinIn = 90 + Math.random() * 60;
  }

  // ── Collision: obstacles ──
  const ph = player.rolling ? PLAYER_H * 0.55 : PLAYER_H;
  const py = player.y - ph + 4;

  for (const obs of state.obstacles) {
    if (obs.lane !== player.lane && obs.lane !== player.targetLane) continue;
    if (obs.y < -80 || obs.y > 520) continue;
    const oy = obs.y - obs.h;
    const laneMatch = obs.lane === player.lane || (player.laneT < 0.85 && obs.lane === player.targetLane);
    if (!laneMatch) continue;

    const overlapX = Math.abs(player.x - LANE_X[obs.lane]) < (PLAYER_W + obs.w) / 2 - 6;
    const overlapY = py < obs.y + 4 && player.y > oy - 4;

    if (overlapX && overlapY) {
      if (obs.type === 'gap') {
        if (!player.onGround) continue; // jumping over gap is fine
      }
      if (obs.type === 'lowbar') {
        if (!player.rolling) { hitPlayer(player, state); break; }
        continue;
      }
      if (player.invincible === 0) { hitPlayer(player, state); break; }
    }
  }

  // ── Collision: coins ──
  for (const coin of state.coins) {
    if (coin.collected) continue;
    if (coin.lane !== player.lane) continue;
    const overlapX = Math.abs(player.x - LANE_X[coin.lane]) < 28;
    const overlapY = Math.abs(player.y - coin.y) < 40;
    if (overlapX && overlapY) {
      coin.collected = true;
      state.coins_collected++;
    }
  }

  // ── Cull offscreen ──
  state.obstacles = state.obstacles.filter(o => o.y < 600);
  state.coins     = state.coins.filter(c => c.y < 600 && !c.collected);
}

function hitPlayer(player: TrainPlayer, state: TrainState) {
  if (player.invincible > 0) return;
  player.dead = true;
  state.score = Math.round(state.distance / 10) + state.coins_collected * 50;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
