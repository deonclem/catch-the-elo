-- Create the profiles table
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  avatar_url text,
  rating integer not null default 1200,
  highest_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policy: public profiles are viewable by everyone
create policy "Public profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

-- Policy: users can update their own profile
create policy "Users can update their own profiles"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Function: automatically create a profile on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'user_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- Trigger: fire handle_new_user after each new auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
