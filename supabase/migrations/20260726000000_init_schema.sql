-- profiles: one row per auth user, auto-created on signup.
-- Reserved for future public profile pages (username) — see PLAN.md.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
on public.profiles for select
using (auth.uid () = id);

create policy "Profiles are updatable by owner"
on public.profiles for update
using (auth.uid () = id);

-- Auto-create a profile row whenever a new auth user is created.
create function public.handle_new_user () returns trigger language plpgsql security definer
set
  search_path = '' as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row
execute function public.handle_new_user ();

-- library_games: a user's personal collection of games (sourced from RAWG.io).
create table public.library_games (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.profiles (id) on delete cascade,
  rawg_id integer not null,
  name text not null,
  cover_url text,
  platforms jsonb,
  genres jsonb,
  release_date date,
  added_at timestamptz not null default now(),
  unique (user_id, rawg_id)
);

alter table public.library_games enable row level security;

create policy "Users manage their own library games"
on public.library_games for all
using (auth.uid () = user_id)
with
  check (auth.uid () = user_id);

create index library_games_user_id_idx on public.library_games (user_id);

-- journal_entries: entries a user writes about a game in their library.
-- body is a Tiptap/ProseMirror document (JSON), including any embedded media.
create table public.journal_entries (
  id uuid primary key default gen_random_uuid (),
  library_game_id uuid not null references public.library_games (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  body jsonb not null,
  date_played date,
  rating smallint check (
    rating between 1 and 5
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journal_entries enable row level security;

create policy "Users manage their own journal entries"
on public.journal_entries for all
using (auth.uid () = user_id)
with
  check (auth.uid () = user_id);

create index journal_entries_library_game_id_idx on public.journal_entries (library_game_id);

create index journal_entries_user_id_idx on public.journal_entries (user_id);

-- Keep updated_at current on journal_entries.
create function public.set_updated_at () returns trigger language plpgsql
set
  search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger journal_entries_set_updated_at before
update on public.journal_entries for each row
execute function public.set_updated_at ();
