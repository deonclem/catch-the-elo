ALTER TABLE public.profiles
  ADD COLUMN current_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN best_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN streak_last_played DATE;
