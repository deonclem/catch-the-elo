-- Add lichess_id for deduplication and direct game linking
-- Table is empty at migration time — no backfill needed
ALTER TABLE public.daily_games
  ADD COLUMN lichess_id TEXT UNIQUE;
