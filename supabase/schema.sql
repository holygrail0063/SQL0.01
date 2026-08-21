create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  display_name text,
  selected_role text,
  sql_level text,
  daily_commitment_minutes integer not null default 30,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists first_name text;

alter table public.profiles
  add column if not exists last_name text;

alter table public.profiles
  add column if not exists daily_commitment_minutes integer not null default 30;

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id integer not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  attempt_count integer not null default 0,
  first_started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, challenge_id)
);

create table if not exists public.challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id integer not null,
  query_text text not null,
  is_correct boolean not null default false,
  execution_time_ms integer,
  attempted_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.challenge_attempts enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.user_progress to authenticated;
grant select, insert, update, delete on public.challenge_attempts to authenticated;

create policy "profiles are user-owned"
  on public.profiles
  for all
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy "progress is user-owned"
  on public.user_progress
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "attempts are user-owned"
  on public.challenge_attempts
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
