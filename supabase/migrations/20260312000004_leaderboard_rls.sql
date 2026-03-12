-- Allow anyone (anon + authenticated) to read daily game results for leaderboard purposes.
-- Ranked results remain restricted to own rows only.
CREATE POLICY "Daily results are publicly readable"
  ON public.game_results
  FOR SELECT
  USING (mode = 'daily' AND deleted_at IS NULL);
