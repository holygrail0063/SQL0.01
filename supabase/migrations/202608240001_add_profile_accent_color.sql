alter table public.profiles
  add column if not exists accent_color text not null default 'lime';

update public.profiles
set accent_color = 'lime'
where accent_color not in ('lime', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'fuchsia', 'rose', 'orange', 'gold');

alter table public.profiles
  drop constraint if exists profiles_accent_color_check;

alter table public.profiles
  add constraint profiles_accent_color_check
  check (accent_color in ('lime', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'fuchsia', 'rose', 'orange', 'gold'));

notify pgrst, 'reload schema';
