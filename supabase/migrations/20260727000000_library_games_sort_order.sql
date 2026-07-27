-- Custom shelf ordering for library_games.
--
-- Named `sort_order`, not `position`: `position` is a Postgres keyword (the
-- POSITION(x IN y) string function). It is *usable* as a column name, but it
-- forces quoting in enough places — and confuses enough tooling — that the
-- extra four characters are cheap insurance.
alter table public.library_games
add column sort_order integer;

-- Backfill so nobody's shelf visibly reshuffles on deploy. The library page
-- currently orders by `added_at desc`, so we freeze exactly that arrangement
-- into the new column.
--
-- `row_number() over (partition by user_id ...)` numbers each user's games
-- independently — without the partition, user B's shelf would start at
-- whatever index user A's ended on.
with
  ordered as (
    select
      id,
      row_number() over (
        partition by
          user_id
        order by
          added_at desc
      ) - 1 as rn
    from
      public.library_games
  )
update public.library_games g
set
  sort_order = ordered.rn
from
  ordered
where
  g.id = ordered.id;

-- Only enforce NOT NULL *after* the backfill — the column would reject the
-- ALTER above if any row were still null.
alter table public.library_games
alter column sort_order
set not null,
alter column sort_order
set default 0;

-- The library page's query is `where user_id = ? order by sort_order`, so a
-- composite index on exactly that pair lets Postgres satisfy both the filter
-- and the sort from one index scan, with no sort step at all.
create index library_games_user_sort_order_idx on public.library_games (user_id, sort_order);

-- Reorder the whole shelf in a single statement.
--
-- PostgREST can't express "set a different value on each of N rows" — an
-- upsert would be an INSERT ... ON CONFLICT and would trip over the NOT NULL
-- columns we aren't sending (name, rawg_id, user_id). The alternative is N
-- separate UPDATEs: N round trips, and a half-applied order if one fails.
--
-- `unnest(p_ids) with ordinality` is the trick that makes it one statement.
-- It expands the array into rows *and* hands back each element's 1-based
-- position, giving us a joinable (id, index) table out of thin air.
--
-- SECURITY INVOKER (the default) matters here: the function runs as the
-- calling user, so the RLS policy on library_games still applies. A
-- SECURITY DEFINER function would bypass RLS and let any authenticated user
-- renumber anyone's shelf. The explicit `auth.uid()` check is the second lock
-- on the same door.
create function public.reorder_library_games (p_ids uuid[]) returns void language sql
set
  search_path = '' as $$
  update public.library_games g
  set sort_order = t.ord - 1
  from unnest(p_ids) with ordinality as t (id, ord)
  where g.id = t.id
    and g.user_id = auth.uid ();
$$;

grant
execute on function public.reorder_library_games (uuid[]) to authenticated;
