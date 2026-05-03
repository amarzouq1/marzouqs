import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Client-side Supabase client (uses anon key)
// Returns a no-op proxy when env vars are not set (graceful fallback to localStorage)
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Database type definitions
export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  chess_elo: number;
  total_games_played: number;
  total_score: number;
  created_at: string;
  updated_at: string;
}

export interface GameScore {
  id: string;
  user_id: string;
  game_slug: string;
  score: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SavedGameState {
  id: string;
  user_id: string;
  game_slug: string;
  state: Record<string, unknown>;
  updated_at: string;
}

export interface ChessGame {
  id: string;
  white_id: string;
  black_id: string | null; // null = AI opponent
  pgn: string;
  result: 'white' | 'black' | 'draw' | null;
  white_elo_before: number;
  black_elo_before: number;
  white_elo_after: number | null;
  black_elo_after: number | null;
  created_at: string;
  finished_at: string | null;
}

// ─── Helper Functions ─────────────────────────────────────────────────────

/**
 * Save a score to Supabase `scores` table.
 * Falls back silently if Supabase is not configured.
 */
export async function saveScoreToDb(
  username: string,
  game: string,
  score: number
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('scores').insert({ username, game, score });
  } catch {
    // Non-blocking — localStorage is the primary store
  }
}

/**
 * Fetch top N scores for a specific game from Supabase.
 * Returns [] if Supabase is not configured.
 */
export async function getTopScoresFromDb(
  game: string,
  limit = 20
): Promise<Array<{ username: string; game: string; score: number; created_at: string }>> {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from('scores')
      .select('username, game, score, created_at')
      .eq('game', game)
      .order('score', { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}

/**
 * Upsert a player profile (username → stats).
 */
export async function upsertProfile(
  username: string,
  updates: Partial<{ chess_elo: number; total_score: number; total_games_played: number }>
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase
      .from('profiles')
      .upsert({ username, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'username' });
  } catch {
    // Non-blocking
  }
}
