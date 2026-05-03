import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { saveScoreToDb } from '@/lib/supabase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number with commas */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Calculate ELO change after a game */
export function calculateElo(
  playerElo: number,
  opponentElo: number,
  result: 1 | 0.5 | 0, // 1=win, 0.5=draw, 0=loss
  kFactor = 32
): number {
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const newElo = Math.round(playerElo + kFactor * (result - expected));
  return Math.max(100, newElo);
}

/** Get ELO title */
export function getEloTitle(elo: number): string {
  if (elo >= 2500) return 'Grandmaster';
  if (elo >= 2200) return 'International Master';
  if (elo >= 2000) return 'FIDE Master';
  if (elo >= 1800) return 'Candidate Master';
  if (elo >= 1600) return 'Expert';
  if (elo >= 1400) return 'Class A';
  if (elo >= 1200) return 'Class B';
  if (elo >= 1000) return 'Class C';
  return 'Novice';
}

/** Save score to localStorage and Supabase (fire-and-forget) */
export function saveLocalScore(game: string, score: number, metadata?: Record<string, unknown>) {
  try {
    const key = `mgc_scores_${game}`;
    const existing: Array<{ score: number; date: string; metadata?: Record<string, unknown> }> =
      JSON.parse(localStorage.getItem(key) ?? '[]');
    existing.push({ score, date: new Date().toISOString(), metadata });
    existing.sort((a, b) => b.score - a.score);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 10)));

    // Also persist to Supabase (best-effort, non-blocking)
    const username = localStorage.getItem('mgc_username') ?? 'Guest';
    saveScoreToDb(username, game, score);
  } catch {
    // Storage might be unavailable
  }
}

/** Read local high scores */
export function getLocalScores(game: string) {
  try {
    return JSON.parse(localStorage.getItem(`mgc_scores_${game}`) ?? '[]');
  } catch {
    return [];
  }
}

/** Debounce a function */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

/** Generate a unique ID */
export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}
