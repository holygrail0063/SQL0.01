alter table public.profiles
  add column if not exists daily_commitment_minutes integer not null default 30;

notify pgrst, 'reload schema';
