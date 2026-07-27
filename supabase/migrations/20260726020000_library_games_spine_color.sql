-- Average color of each game's cover art, computed server-side when the game
-- is added to the library. Used to tint the tome's spine edge on the shelf.
-- Nullable: falls back to a neutral gradient if extraction ever fails.
alter table public.library_games
add column spine_color text;
