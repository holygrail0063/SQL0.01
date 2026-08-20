alter table public.profiles
  add column if not exists first_name text;

alter table public.profiles
  add column if not exists last_name text;

update public.profiles
set
  first_name = coalesce(first_name, nullif(split_part(display_name, ' ', 1), '')),
  last_name = coalesce(last_name, nullif(trim(regexp_replace(display_name, '^\S+\s*', '')), '')),
  updated_at = now()
where display_name is not null
  and (first_name is null or last_name is null);
