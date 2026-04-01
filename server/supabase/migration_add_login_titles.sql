-- Якщо таблицю вже створювали без цих колонок — виконай один раз у SQL Editor:

alter table public.clip_month_ballots
  add column if not exists twitch_login text,
  add column if not exists clip_titles text[];

comment on column public.clip_month_ballots.twitch_login is 'Twitch login (нік) на момент голосування';
comment on column public.clip_month_ballots.clip_titles is 'Назви кліпів у тому ж порядку, що vote_keys (для таблиці)';
comment on column public.clip_month_ballots.vote_keys is 'Унікальні ключі s:slug — для підрахунку без колізій назв';
