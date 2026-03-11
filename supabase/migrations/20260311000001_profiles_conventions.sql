-- ============================================================
-- Bring profiles table in line with the timestamp convention:
-- all tables must have created_at, updated_at, deleted_at
-- with an auto-update trigger on updated_at.
-- ============================================================

-- Add soft-delete column (set_updated_at function already exists from migration 20260311000000)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Auto-update updated_at on every row modification
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
