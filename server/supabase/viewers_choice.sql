-- Виконай у Supabase: SQL Editor → New query → Run
-- Viewers Choice. Повторний запуск безпечний (if not exists).
-- Доступ до всіх таблиць лише через бекенд (service_role); RLS увімкнено, публічних політик немає.

-- 1) Бюлетені: один на (подія + Twitch id).
--    picks — об'єкт { "<category_id>": "<twitch_login номінанта>" }.
create table if not exists public.vc_ballots (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  twitch_user_id text not null,
  twitch_login text,
  picks jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vc_ballots_event_user unique (event_id, twitch_user_id)
);
create index if not exists vc_ballots_event_id_idx on public.vc_ballots (event_id);
alter table public.vc_ballots enable row level security;

-- 2) Стрімери, яких додали глядачі («Немає твого стрімера? Додай»).
create table if not exists public.vc_nominations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  category_id text not null,
  nominee_login text not null,
  nominee_language text,
  nominated_by text not null,
  nominated_by_login text,
  created_at timestamptz not null default now(),
  constraint vc_nominations_unique unique (event_id, category_id, nominee_login, nominated_by)
);
create index if not exists vc_nominations_event_idx on public.vc_nominations (event_id);
alter table public.vc_nominations enable row level security;

-- 3) Рішення адміна щодо номінанта в категорії: approved (показати) або hidden (приховати).
create table if not exists public.vc_nominee_overrides (
  event_id text not null,
  category_id text not null,
  nominee_login text not null,
  status text not null check (status in ('approved', 'hidden')),
  updated_by text,
  updated_at timestamptz not null default now(),
  primary key (event_id, category_id, nominee_login)
);
alter table public.vc_nominee_overrides enable row level security;

-- 4) Автозбір: українськомовні канали, які були в ефірі (Twitch /streams?language=uk).
create table if not exists public.vc_seen_streamers (
  login text primary key,
  user_id text,
  display_name text,
  games text[] not null default '{}',
  sightings integer not null default 0,
  max_viewers integer not null default 0,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
alter table public.vc_seen_streamers enable row level security;
