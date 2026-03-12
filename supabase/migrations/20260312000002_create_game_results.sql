CREATE TABLE public.game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_game_id UUID REFERENCES public.daily_games(id) ON DELETE CASCADE,
  ranked_game_id UUID, -- FK to ranked_games added in future migration
  mode TEXT NOT NULL CHECK (mode IN ('daily', 'ranked')),
  guess_elo INTEGER NOT NULL,
  actual_elo INTEGER NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 5000),
  rating_change INTEGER, -- only set for ranked
  rating_after INTEGER, -- only set for ranked
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ,

  CONSTRAINT game_results_one_game_ref CHECK (
    (daily_game_id IS NOT NULL)::int + (ranked_game_id IS NOT NULL)::int = 1
  )
);

CREATE TRIGGER set_game_results_updated_at
  BEFORE UPDATE ON public.game_results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX ON public.game_results (user_id);
CREATE INDEX ON public.game_results (mode);
CREATE INDEX ON public.game_results (created_at);

CREATE UNIQUE INDEX game_results_user_daily_unique
  ON public.game_results (user_id, daily_game_id)
  WHERE daily_game_id IS NOT NULL;

CREATE UNIQUE INDEX game_results_user_ranked_unique
  ON public.game_results (user_id, ranked_game_id)
  WHERE ranked_game_id IS NOT NULL;

ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own results"
  ON public.game_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own results"
  ON public.game_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
