-- Add game_ids to ranked_sessions so we can resume a session mid-play
-- without relying on game_results rows (which only exist after submission).

ALTER TABLE public.ranked_sessions
  ADD COLUMN game_ids uuid[] NOT NULL DEFAULT '{}';
