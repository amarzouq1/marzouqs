/**
 * Web Audio Engine for Marzouq's Gaming Center
 * Handles all UI sounds, game sfx, and background music.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicOscillators: OscillatorNode[] = [];
let musicIntervalId: ReturnType<typeof setInterval> | null = null;
let engineNode: OscillatorNode | null = null;
let engineGainNode: GainNode | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(ctx.destination);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 1.0;
    sfxGain.connect(masterGain);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.25;
    musicGain.connect(masterGain);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Resume audio context — must be called from a user gesture */
export function initAudio() {
  getCtx();
}

/** Mute / unmute master volume */
export function setMasterVolume(vol: number) {
  const c = getCtx();
  if (masterGain) masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), c.currentTime, 0.05);
}

// ─── SFX helpers ────────────────────────────────────────────────────────────

function playTone(freq: number, type: OscillatorType, duration: number, gain = 0.3, decay = 0.2) {
  const c = getCtx();
  const osc = c.createOscillator();
  const g   = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(g);
  g.connect(sfxGain ?? masterGain!);
  osc.start();
  osc.stop(c.currentTime + duration + decay);
}

function playNoise(duration: number, gainVal = 0.15) {
  const c      = getCtx();
  const bufLen = c.sampleRate * duration;
  const buf    = c.createBuffer(1, bufLen, c.sampleRate);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.setValueAtTime(gainVal, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  src.connect(g);
  g.connect(sfxGain ?? masterGain!);
  src.start();
  src.stop(c.currentTime + duration + 0.05);
}

// ─── Named SFX ─────────────────────────────────────────────────────────────

export const sfx = {
  click() {
    playTone(880, 'square', 0.08, 0.18);
  },
  success() {
    const c = getCtx();
    [523, 659, 784].forEach((f, i) => {
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.25, c.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + i * 0.12 + 0.35);
      osc.connect(g);
      g.connect(sfxGain ?? masterGain!);
      osc.start(c.currentTime + i * 0.12);
      osc.stop(c.currentTime + i * 0.12 + 0.4);
    });
  },
  fail() {
    const c = getCtx();
    [300, 220].forEach((f, i) => {
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.2, c.currentTime + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + i * 0.15 + 0.3);
      osc.connect(g);
      g.connect(sfxGain ?? masterGain!);
      osc.start(c.currentTime + i * 0.15);
      osc.stop(c.currentTime + i * 0.15 + 0.35);
    });
  },
  levelUp() {
    const c = getCtx();
    [392, 523, 659, 784, 1047].forEach((f, i) => {
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.2, c.currentTime + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + i * 0.1 + 0.45);
      osc.connect(g);
      g.connect(sfxGain ?? masterGain!);
      osc.start(c.currentTime + i * 0.1);
      osc.stop(c.currentTime + i * 0.1 + 0.5);
    });
  },
  achievement() {
    const c = getCtx();
    [659, 784, 1047, 1319].forEach((f, i) => {
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.22, c.currentTime + i * 0.09);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + i * 0.09 + 0.5);
      osc.connect(g);
      g.connect(sfxGain ?? masterGain!);
      osc.start(c.currentTime + i * 0.09);
      osc.stop(c.currentTime + i * 0.09 + 0.55);
    });
  },
  countdown() {
    playTone(440, 'sine', 0.15, 0.3);
  },
  countdownGo() {
    playTone(880, 'sine', 0.25, 0.4);
  },
  nitroBoost() {
    const c  = getCtx();
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, c.currentTime);
    osc.frequency.linearRampToValueAtTime(600, c.currentTime + 0.15);
    g.gain.setValueAtTime(0.25, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.4);
    osc.connect(g);
    g.connect(sfxGain ?? masterGain!);
    osc.start();
    osc.stop(c.currentTime + 0.45);
  },
  lapComplete() {
    const c = getCtx();
    [523, 659, 784].forEach((f, i) => {
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.type = 'square';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + i * 0.1 + 0.3);
      osc.connect(g);
      g.connect(sfxGain ?? masterGain!);
      osc.start(c.currentTime + i * 0.1);
      osc.stop(c.currentTime + i * 0.1 + 0.35);
    });
  },
  damage() {
    playNoise(0.12, 0.2);
    playTone(150, 'sawtooth', 0.12, 0.15);
  },
  chessMove() {
    playNoise(0.04, 0.12);
  },
  chessCapture() {
    playNoise(0.08, 0.22);
    playTone(220, 'sawtooth', 0.08, 0.1);
  },
};

// ─── Engine sound for racing ────────────────────────────────────────────────

/**
 * Start/update the motorcycle engine sound.
 * Call this every frame during racing with current RPM (0–8000).
 */
export function setEngineRpm(rpm: number) {
  const c = getCtx();
  const baseFreq = 80 + (rpm / 8000) * 220;
  if (!engineNode) {
    engineNode     = c.createOscillator();
    engineGainNode = c.createGain();
    const distortion = c.createWaveShaper();
    const curve = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const x = (i * 2) / 512 - 1;
      curve[i] = ((Math.PI + 200) * x) / (Math.PI + 200 * Math.abs(x));
    }
    distortion.curve = curve;
    engineNode.type = 'sawtooth';
    engineNode.frequency.value = baseFreq;
    engineGainNode.gain.value  = 0.08;
    engineNode.connect(distortion);
    distortion.connect(engineGainNode);
    engineGainNode.connect(sfxGain ?? masterGain!);
    engineNode.start();
  } else {
    engineNode.frequency.setTargetAtTime(baseFreq, c.currentTime, 0.05);
  }
}

export function stopEngine() {
  if (engineNode) {
    try {
      engineNode.stop();
    } catch { /* already stopped */ }
    engineNode     = null;
    engineGainNode = null;
  }
}

// ─── Background Music ───────────────────────────────────────────────────────

type MusicTheme = 'menu' | 'racing' | 'battle' | 'chess';

const THEMES: Record<MusicTheme, { bpm: number; scale: number[]; root: number }> = {
  menu:   { bpm: 90,  scale: [0, 2, 4, 7, 9],        root: 261.63 }, // C pentatonic
  racing: { bpm: 170, scale: [0, 2, 3, 5, 7, 8, 10], root: 220    }, // A harmonic minor
  battle: { bpm: 140, scale: [0, 3, 5, 6, 7, 10],    root: 146.83 }, // D Phrygian dominant
  chess:  { bpm: 72,  scale: [0, 2, 4, 5, 7, 9, 11], root: 261.63 }, // C major
};

export function startMusic(theme: MusicTheme) {
  stopMusic();
  const c    = getCtx();
  const cfg  = THEMES[theme];
  const beat = 60 / cfg.bpm;

  let step = 0;
  musicIntervalId = setInterval(() => {
    if (!musicGain) return;
    const note  = cfg.scale[step % cfg.scale.length];
    const oct   = Math.floor(step / cfg.scale.length) % 3;
    const freq  = cfg.root * Math.pow(2, (note + oct * 12) / 12);
    const osc   = c.createOscillator();
    const g     = c.createGain();
    osc.type = theme === 'chess' ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.18, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + beat * 0.85);
    osc.connect(g);
    g.connect(musicGain);
    osc.start();
    osc.stop(c.currentTime + beat);
    musicOscillators.push(osc);
    // Clean up finished oscillators
    musicOscillators = musicOscillators.filter((o) => {
      try { return o.context.state !== 'closed'; } catch { return false; }
    });
    step++;
  }, beat * 1000);
}

export function stopMusic() {
  if (musicIntervalId !== null) {
    clearInterval(musicIntervalId);
    musicIntervalId = null;
  }
  musicOscillators.forEach((o) => { try { o.stop(); } catch { /* ok */ } });
  musicOscillators = [];
}

export function setMusicVolume(vol: number) {
  const c = getCtx();
  if (musicGain) musicGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), c.currentTime, 0.1);
}
