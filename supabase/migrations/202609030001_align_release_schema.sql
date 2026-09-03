-- Align production profile ownership and support/attempt columns with the repository schema.
-- This is intentionally non-destructive: it preserves existing profiles, progress, and attempts.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists auth_user_id uuid;

update public.profiles
set auth_user_id = id
where auth_user_id is null;

alter table public.profiles
  alter column auth_user_id set not null;

alter table public.profiles
  add column if not exists first_name text;

alter table public.profiles
  add column if not exists last_name text;

alter table public.profiles
  add column if not exists daily_commitment_minutes integer not null default 30;

alter table public.profiles
  add column if not exists accent_color text not null default 'lime';

alter table public.profiles
  drop constraint if exists profiles_auth_user_id_key;

alter table public.profiles
  add constraint profiles_auth_user_id_key unique (auth_user_id);

alter table public.profiles
  drop constraint if exists profiles_auth_user_id_fkey;

alter table public.profiles
  add constraint profiles_auth_user_id_fkey foreign key (auth_user_id) references auth.users(id) on delete cascade;

alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  alter column id set default gen_random_uuid();

update public.profiles
set accent_color = 'lime'
where accent_color not in ('lime', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'fuchsia', 'rose', 'orange', 'gold');

alter table public.profiles
  drop constraint if exists profiles_accent_color_check;

alter table public.profiles
  add constraint profiles_accent_color_check
  check (accent_color in ('lime', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'fuchsia', 'rose', 'orange', 'gold'));

update public.challenge_attempts
set query_text = ''
where query_text is null;

alter table public.challenge_attempts
  alter column query_text set not null;

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  topic text not null check (topic in ('Account & Login', 'Learning & Courses', 'SQL Editor', 'Query Results / Validation', 'Progress & Statistics', 'Technical Issue', 'Feedback / Feature Request', 'Other')),
  subject text not null check (char_length(subject) between 1 and 120),
  message text not null check (char_length(message) between 1 and 5000),
  page_path text,
  user_agent text,
  learning_mode text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.challenge_attempts enable row level security;
alter table public.support_requests enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.user_progress to authenticated;
grant select, insert, update, delete on public.challenge_attempts to authenticated;
grant select, insert on public.support_requests to authenticated;

drop policy if exists "profiles are user-owned" on public.profiles;
create policy "profiles are user-owned"
  on public.profiles
  for all
  to authenticated
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

drop policy if exists "progress is user-owned" on public.user_progress;
create policy "progress is user-owned"
  on public.user_progress
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "attempts are user-owned" on public.challenge_attempts;
create policy "attempts are user-owned"
  on public.challenge_attempts
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "support requests can be created by owner" on public.support_requests;
create policy "support requests can be created by owner"
  on public.support_requests
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "support requests are readable by owner" on public.support_requests;
create policy "support requests are readable by owner"
  on public.support_requests
  for select
  to authenticated
  using (user_id = (select auth.uid()));

notify pgrst, 'reload schema';
