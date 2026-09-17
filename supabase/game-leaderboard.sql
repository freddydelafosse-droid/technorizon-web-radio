-- Technorizon — classement général des jeux
-- À exécuter une seule fois dans Supabase > SQL Editor.

create table if not exists public.game_scores (
  player_key text not null,
  player_name text not null check (char_length(player_name) between 2 and 18),
  game text not null check (game in ('blind', 'intox', 'quiz')),
  score integer not null check (score > 0),
  updated_at timestamptz not null default now(),
  primary key (player_key, game)
);

alter table public.game_scores enable row level security;

revoke all on table public.game_scores from anon, authenticated;
grant usage on schema public to anon, authenticated;

create or replace function public.submit_game_score(
  p_player_name text,
  p_game text,
  p_score integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text;
  clean_key text;
begin
  clean_name := left(regexp_replace(trim(coalesce(p_player_name, '')), '\\s+', ' ', 'g'), 18);
  clean_key := lower(clean_name);

  if char_length(clean_name) < 2
     or clean_name !~ '^[[:alnum:]À-ÿ ._''-]+$' then
    raise exception 'invalid player name';
  end if;

  if p_game = 'blind' then
    if p_score <= 0 or p_score > 2500 or mod(p_score, 100) <> 0 then
      raise exception 'invalid blind score';
    end if;
  elsif p_game in ('intox', 'quiz') then
    if p_score <= 0 or p_score > 375 or mod(p_score, 75) <> 0 then
      raise exception 'invalid game score';
    end if;
  else
    raise exception 'invalid game';
  end if;

  insert into public.game_scores (player_key, player_name, game, score, updated_at)
  values (clean_key, clean_name, p_game, p_score, now())
  on conflict (player_key, game) do update
    set player_name = excluded.player_name,
        score = greatest(public.game_scores.score, excluded.score),
        updated_at = case
          when excluded.score > public.game_scores.score then now()
          else public.game_scores.updated_at
        end;
end;
$$;

create or replace function public.get_game_leaderboard(p_limit integer default 10)
returns table (
  player_name text,
  total_score bigint,
  games_count bigint,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    max(gs.player_name) as player_name,
    sum(gs.score)::bigint as total_score,
    count(*)::bigint as games_count,
    max(gs.updated_at) as updated_at
  from public.game_scores gs
  group by gs.player_key
  order by total_score desc, updated_at asc
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
$$;

revoke all on function public.submit_game_score(text, text, integer) from public;
revoke all on function public.get_game_leaderboard(integer) from public;
grant execute on function public.submit_game_score(text, text, integer) to anon, authenticated;
grant execute on function public.get_game_leaderboard(integer) to anon, authenticated;
