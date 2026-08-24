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

alter table public.support_requests enable row level security;

grant select, insert on public.support_requests to authenticated;

drop policy if exists "support requests can be created by owner" on public.support_requests;
create policy "support requests can be created by owner"
  on public.support_requests
  for insert
  with check (user_id = auth.uid());

drop policy if exists "support requests are readable by owner" on public.support_requests;
create policy "support requests are readable by owner"
  on public.support_requests
  for select
  using (user_id = auth.uid());

notify pgrst, 'reload schema';
