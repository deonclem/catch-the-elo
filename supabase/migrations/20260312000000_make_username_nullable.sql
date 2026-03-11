-- Make username nullable to support Google OAuth users who haven't completed onboarding
ALTER TABLE public.profiles
  ALTER COLUMN username DROP NOT NULL;

-- Update auto-create trigger to always insert NULL for username.
-- Email/password users: username set immediately after via Server Action.
-- OAuth users (Google, future): username set during /onboarding flow.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id,
    NULL,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN new;
END;
$$;
