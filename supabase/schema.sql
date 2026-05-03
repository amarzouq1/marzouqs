-- ============================================================
--  Marzouq's Gaming Center — Supabase Database Schema
--  Run this in the Supabase SQL Editor (Dashboard > SQL)
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── user_profiles ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id               UUID        PRIMARY KEY DEFAULT auth.uid(),
  username         TEXT        NOT NULL UNIQUE
                                CHECK (username ~ '^[a-zA-Z0-9_]{3,24}$'),
  avatar_url       TEXT,
  chess_elo        INTEGER     NOT NULL DEFAULT 800
                                CHECK (chess_elo BETWEEN 0 AND 4000),
  total_games_played INTEGER   NOT NULL DEFAULT 0 CHECK (total_games_played >= 0),
  total_score      BIGINT      NOT NULL DEFAULT 0  CHECK (total_score >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── game_scores ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.game_scores (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  game_slug   TEXT        NOT NULL
                           CHECK (game_slug ~ '^[a-z_-]{1,30}$'),
  score       INTEGER     NOT NULL CHECK (score >= 0),
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_game_scores_game_score ON public.game_scores(game_slug, score DESC);
CREATE INDEX idx_game_scores_user       ON public.game_scores(user_id, game_slug);

-- ─── saved_game_states ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_game_states (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  game_slug   TEXT        NOT NULL CHECK (game_slug ~ '^[a-z_-]{1,30}$'),
  state       JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_slug)
);

CREATE TRIGGER trg_saved_game_states_updated_at
  BEFORE UPDATE ON public.saved_game_states
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── chess_games ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chess_games (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  white_id         UUID        REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  black_id         UUID        REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  pgn              TEXT,
  result           TEXT        CHECK (result IN ('1-0', '0-1', '1/2-1/2', '*')),
  white_elo_before INTEGER,
  white_elo_after  INTEGER,
  black_elo_before INTEGER,
  black_elo_after  INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at      TIMESTAMPTZ
);

CREATE INDEX idx_chess_games_white ON public.chess_games(white_id, created_at DESC);
CREATE INDEX idx_chess_games_black ON public.chess_games(black_id, created_at DESC);

-- ─── Row Level Security ───────────────────────────────────────────────────────

-- user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.user_profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- game_scores
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scores are publicly readable"
  ON public.game_scores FOR SELECT USING (true);

CREATE POLICY "Anyone can insert a score (anonymous OK)"
  ON public.game_scores FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own scores"
  ON public.game_scores FOR DELETE USING (auth.uid() = user_id);

-- saved_game_states
ALTER TABLE public.saved_game_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own game states"
  ON public.saved_game_states FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own game states"
  ON public.saved_game_states FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game states"
  ON public.saved_game_states FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own game states"
  ON public.saved_game_states FOR DELETE USING (auth.uid() = user_id);

-- chess_games
ALTER TABLE public.chess_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chess games are publicly readable"
  ON public.chess_games FOR SELECT USING (true);

CREATE POLICY "Players can insert chess games"
  ON public.chess_games FOR INSERT WITH CHECK (
    auth.uid() = white_id OR auth.uid() = black_id OR
    (white_id IS NULL AND black_id IS NULL)
  );

-- ─── Leaderboard view ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.leaderboard AS
  SELECT
    gs.game_slug,
    up.username,
    up.avatar_url,
    MAX(gs.score) AS best_score,
    COUNT(*)      AS plays,
    MAX(gs.created_at) AS last_played
  FROM public.game_scores gs
  LEFT JOIN public.user_profiles up ON up.id = gs.user_id
  GROUP BY gs.game_slug, up.username, up.avatar_url
  ORDER BY gs.game_slug, best_score DESC;

GRANT SELECT ON public.leaderboard TO anon, authenticated;

-- ─── Anonymous scores table (no auth required) ────────────────────────────────
-- Used by saveScoreToDb() helper — works without Supabase Auth.
CREATE TABLE IF NOT EXISTS public.scores (
  id          BIGSERIAL   PRIMARY KEY,
  username    TEXT        NOT NULL DEFAULT 'Guest',
  game        TEXT        NOT NULL,
  score       INTEGER     NOT NULL CHECK (score >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scores_game_score ON public.scores(game, score DESC);
CREATE INDEX idx_scores_username   ON public.scores(username);

ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scores readable by everyone"
  ON public.scores FOR SELECT USING (true);

CREATE POLICY "Anyone can insert a score"
  ON public.scores FOR INSERT WITH CHECK (true);

GRANT SELECT, INSERT ON public.scores TO anon, authenticated;

-- ─── profiles simple table (no auth required) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  username    TEXT        PRIMARY KEY,
  chess_elo   INTEGER     NOT NULL DEFAULT 800,
  total_score BIGINT      NOT NULL DEFAULT 0,
  total_games_played INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles readable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Anyone can upsert a profile"
  ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update a profile"
  ON public.profiles FOR UPDATE USING (true);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated;
