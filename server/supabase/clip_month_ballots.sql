-- Виконай у Supabase: SQL Editor → New query → Run
-- Таблиця бюлетенів «Кліп місяця»: один рядок на (тур + Twitch id), масив ключів кліпів.

create table if not exists public.clip_month_ballots (
  id uuid primary key default gen_random_uuid(),
  round_id text not null,
  twitch_user_id text not null,
  twitch_login text,
  vote_keys text[] not null,
  clip_titles text[],
  updated_at timestamptz not null default now(),
  constraint clip_month_ballots_round_user unique (round_id, twitch_user_id)
);

create index if not exists clip_month_ballots_round_id_idx
  on public.clip_month_ballots (round_id);

comment on table public.clip_month_ballots is 'Кліп місяця: twitch_login/clip_titles для зручності; vote_keys — стабільні ключі для підрахунків на сайті';
