-- ============================================================
-- Part 1 of 2: Games pool refactor (non-destructive)
--
-- Creates new tables, migrates data, updates game_results columns.
-- The old `daily_games` table and deprecated game_results columns
-- (daily_game_id, ranked_game_id) are left in place for verification.
--
-- After verifying with:
--   SELECT COUNT(*) FROM games;          -- should equal daily_games count
--   SELECT COUNT(*) FROM daily_schedule; -- should equal daily_games count
--   SELECT COUNT(*) FROM game_results WHERE game_id IS NULL; -- should be 0
--
-- Run Part 2 (20260324000001_games_pool_cleanup.sql) to drop old tables/columns.
-- ============================================================


-- ============================================================
-- 1. Create games table (central pool)
-- ============================================================

CREATE TABLE public.games (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  seq_id     bigserial   NOT NULL,
  pgn        text        NOT NULL,
  white_elo  integer     NOT NULL,
  black_elo  integer     NOT NULL,
  target_elo integer     NOT NULL,
  metadata   jsonb       NOT NULL DEFAULT '{}',
  lichess_id text        UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

CREATE INDEX ON public.games (seq_id);

CREATE TRIGGER set_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read games"
  ON public.games FOR SELECT
  USING (deleted_at IS NULL);


-- ============================================================
-- 2. Migrate existing daily_games rows into games (preserve UUIDs)
--    game_results.daily_game_id values match daily_games.id,
--    so keeping these UUIDs lets us populate game_results.game_id trivially.
-- ============================================================

INSERT INTO public.games (id, pgn, white_elo, black_elo, target_elo, metadata, lichess_id, created_at, updated_at, deleted_at)
SELECT id, pgn, white_elo, black_elo, target_elo, metadata, lichess_id, created_at, updated_at, deleted_at
FROM public.daily_games;


-- ============================================================
-- 3. Create daily_schedule table
-- ============================================================

CREATE TABLE public.daily_schedule (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id       uuid NOT NULL REFERENCES public.games(id),
  scheduled_for date UNIQUE NOT NULL,
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL,
  deleted_at    timestamptz
);

-- A game can only be scheduled once
CREATE UNIQUE INDEX ON public.daily_schedule (game_id);
CREATE INDEX ON public.daily_schedule (scheduled_for);

CREATE TRIGGER set_daily_schedule_updated_at
  BEFORE UPDATE ON public.daily_schedule
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.daily_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read daily_schedule"
  ON public.daily_schedule FOR SELECT
  USING (deleted_at IS NULL);


-- ============================================================
-- 4. Migrate daily_games scheduling rows into daily_schedule
-- ============================================================

INSERT INTO public.daily_schedule (game_id, scheduled_for, created_at, updated_at)
SELECT id, scheduled_for, created_at, updated_at
FROM public.daily_games;


-- ============================================================
-- 5. Create ranked_sessions table
-- ============================================================

CREATE TABLE public.ranked_sessions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  total_score   integer,
  rating_before integer NOT NULL,
  rating_after  integer,
  started_at    timestamptz DEFAULT now() NOT NULL,
  completed_at  timestamptz,
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL,
  deleted_at    timestamptz
);

CREATE INDEX ON public.ranked_sessions (user_id);

CREATE TRIGGER set_ranked_sessions_updated_at
  BEFORE UPDATE ON public.ranked_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ranked_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own ranked sessions"
  ON public.ranked_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ranked sessions"
  ON public.ranked_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ranked sessions"
  ON public.ranked_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- 6. Update game_results: add unified game_id + ranked_session_id
-- ============================================================

ALTER TABLE public.game_results
  ADD COLUMN game_id            uuid REFERENCES public.games(id),
  ADD COLUMN ranked_session_id  uuid REFERENCES public.ranked_sessions(id),
  ADD COLUMN round_number       integer CHECK (round_number BETWEEN 1 AND 5);

-- Populate game_id from daily_game_id (same UUIDs — no join needed)
UPDATE public.game_results
SET game_id = daily_game_id
WHERE mode = 'daily';

-- Enforce NOT NULL now that all existing rows are populated
ALTER TABLE public.game_results ALTER COLUMN game_id SET NOT NULL;

-- Drop the old XOR constraint so the app can insert rows using the new schema
-- (new inserts only set game_id, leaving daily_game_id NULL, which would fail the old check)
ALTER TABLE public.game_results DROP CONSTRAINT game_results_one_game_ref;

-- Drop old partial unique indexes (replaced below)
DROP INDEX public.game_results_user_daily_unique;
DROP INDEX public.game_results_user_ranked_unique;

-- New unique indexes based on game_id
CREATE UNIQUE INDEX game_results_user_daily_unique
  ON public.game_results (user_id, game_id)
  WHERE mode = 'daily';

CREATE UNIQUE INDEX game_results_session_game_unique
  ON public.game_results (ranked_session_id, game_id)
  WHERE mode = 'ranked';


-- ============================================================
-- 7. RPC function: get_random_games(n integer)
--    Efficient random selection using seq_id index (O(log n) per pick)
--    vs ORDER BY random() which is O(n).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_random_games(n integer)
RETURNS SETOF public.games
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH bounds AS (
    SELECT MIN(seq_id) AS lo, MAX(seq_id) AS hi
    FROM public.games
    WHERE deleted_at IS NULL
  ),
  candidates AS (
    SELECT DISTINCT ON (g.id) g.*
    FROM generate_series(1, n * 3) s  -- oversample 3x to handle seq_id gaps
    CROSS JOIN bounds
    CROSS JOIN LATERAL (
      SELECT g2.*
      FROM public.games g2
      WHERE g2.seq_id >= (bounds.lo + floor(random() * (bounds.hi - bounds.lo + 1))::bigint)
        AND g2.deleted_at IS NULL
      ORDER BY g2.seq_id
      LIMIT 1
    ) g
  )
  SELECT * FROM candidates LIMIT n;
$$;
