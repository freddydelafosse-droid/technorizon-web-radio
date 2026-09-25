-- Mémoire éditoriale privée de Jaya. À appliquer dans le SQL Editor Supabase.
-- Les appels radio utilisent la clé service_role côté serveur uniquement.
create table if not exists public.jaya_antenna_memory (
  id bigint generated always as identity primary key,
  text text not null check (char_length(text) between 12 and 3000),
  kind text not null default 'h24' check (kind in ('h24', 'news_weather', 'horoscope')),
  slot text,
  created_at timestamptz not null default now()
);

create index if not exists jaya_antenna_memory_recent_idx
  on public.jaya_antenna_memory (created_at desc);

alter table public.jaya_antenna_memory enable row level security;
revoke all on public.jaya_antenna_memory from anon, authenticated;
grant select, insert on public.jaya_antenna_memory to service_role;
grant usage, select on sequence public.jaya_antenna_memory_id_seq to service_role;
