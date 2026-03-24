-- ============================================================
-- Part 2 of 2: Games pool cleanup (destructive)
--
-- Run this ONLY after verifying that Part 1 migrated data correctly:
--
--   -- Row counts should all match
--   SELECT COUNT(*) FROM daily_games;
--   SELECT COUNT(*) FROM games;
--   SELECT COUNT(*) FROM daily_schedule;
--
--   -- No game_results row should be missing its game_id
--   SELECT COUNT(*) FROM game_results WHERE game_id IS NULL;
--
--   -- Every game_id in game_results should resolve to a games row
--   SELECT COUNT(*) FROM game_results gr
--   LEFT JOIN games g ON g.id = gr.game_id
--   WHERE g.id IS NULL;
--
-- All queries above should return 0 (or equal counts) before proceeding.
-- ============================================================


-- Drop deprecated game_results columns (now replaced by game_id)
ALTER TABLE public.game_results
  DROP COLUMN daily_game_id,
  DROP COLUMN ranked_game_id;

-- Drop the original daily_games table
DROP TABLE public.daily_games;
