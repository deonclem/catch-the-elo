-- Replace the lateral-join sampling function with ORDER BY random().
-- The original approach (seq_id + lateral) had random() evaluated once
-- across all generate_series iterations, returning the same game repeatedly.
-- ORDER BY random() is O(n) but perfectly fast at current scale (~22k rows).
-- Can be replaced with a gap-sampling approach once the pool exceeds ~200k rows.

CREATE OR REPLACE FUNCTION public.get_random_games(n integer)
RETURNS SETOF public.games
LANGUAGE sql
VOLATILE
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.games
  WHERE deleted_at IS NULL
  ORDER BY random()
  LIMIT n;
$$;
