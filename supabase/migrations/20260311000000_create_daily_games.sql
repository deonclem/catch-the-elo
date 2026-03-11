-- ============================================================
-- Shared trigger function: auto-update updated_at on any UPDATE
-- Applied to all tables by convention.
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- daily_games
-- One row per day: the pre-scheduled game for that date.
-- PGN is scrubbed (no WhiteElo/BlackElo/title/ratingDiff tags).
-- ============================================================
CREATE TABLE public.daily_games (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  -- The calendar day this game is shown to all players
  scheduled_for  date        UNIQUE NOT NULL,
  -- Full PGN with clock/eval annotations but without elo-revealing tags
  pgn            text        NOT NULL,
  -- Average of white_elo and black_elo — used for score calculation
  target_elo     integer     NOT NULL,
  white_elo      integer     NOT NULL,
  black_elo      integer     NOT NULL,
  -- Secondary info: player names, lichess URL, opening, etc.
  metadata       jsonb       NOT NULL DEFAULT '{}',
  created_at     timestamptz DEFAULT now() NOT NULL,
  updated_at     timestamptz DEFAULT now() NOT NULL,
  deleted_at     timestamptz
);

-- Fast lookup by date (used by app/page.tsx to fetch today's game)
CREATE INDEX idx_daily_games_scheduled_for ON public.daily_games (scheduled_for);

-- RLS: everyone can read non-deleted games (daily challenge needs no auth)
ALTER TABLE public.daily_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read daily_games"
  ON public.daily_games FOR SELECT
  USING (deleted_at IS NULL);

-- Auto-update updated_at on every row modification
CREATE TRIGGER set_daily_games_updated_at
  BEFORE UPDATE ON public.daily_games
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
