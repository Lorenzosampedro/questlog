"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAverageColor } from "@/lib/cover-color";
import {
  JOURNAL_MEDIA_BUCKET,
  collectMediaPaths,
} from "@/lib/journal-media";
import { gameExportFilename, gameToMarkdown } from "@/lib/markdown-export";
import type { RawgGameSummary } from "@/lib/rawg";

const UNIQUE_VIOLATION = "23505";

export async function addGameToLibrary(game: RawgGameSummary) {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const spineColor = game.coverUrl ? await getAverageColor(game.coverUrl) : null;

  const supabase = await createClient();

  // New games land at the front of the shelf, matching the old "newest first"
  // behaviour. We take one below the current minimum rather than shifting
  // every other row up by one: that's a single-row write instead of an N-row
  // rewrite. Negative values are fine — nothing reads sort_order as an index,
  // only as a relative ordering. `reorderLibrary` renumbers back to 0..n-1 on
  // the next drag, so the values never drift far.
  const { data: first } = await supabase
    .from("library_games")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle<{ sort_order: number }>();

  const { error } = await supabase.from("library_games").insert({
    user_id: user.id,
    rawg_id: game.rawgId,
    name: game.name,
    cover_url: game.coverUrl,
    platforms: game.platforms,
    genres: game.genres,
    release_date: game.releaseDate,
    spine_color: spineColor,
    sort_order: first ? first.sort_order - 1 : 0,
  });

  if (error && error.code !== UNIQUE_VIOLATION) {
    return { error: error.message };
  }

  revalidatePath("/library");
  return { success: true };
}

/**
 * Persist a new shelf arrangement.
 *
 * `orderedIds` is the complete, final order of the user's shelf — not a
 * "moved X from 3 to 7" delta. Sending the whole array makes the operation
 * idempotent: replaying it twice gives the same result, and there's no way for
 * a dropped request to leave the shelf subtly out of step. For a personal
 * library (tens of games) the payload is a few hundred bytes; deltas would
 * only start paying off in the thousands.
 *
 * The actual renumbering happens in the `reorder_library_games` SQL function —
 * see the migration for why it can't be expressed as a PostgREST upsert.
 */
export async function reorderLibrary(orderedIds: string[]) {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  if (orderedIds.length === 0) return { success: true };

  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_library_games", {
    p_ids: orderedIds,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/library");
  return { success: true };
}

/**
 * Remove a game and everything hanging off it.
 *
 * The journal_entries rows are *not* deleted here. `library_game_id` is
 * declared `references library_games (id) on delete cascade`, so Postgres
 * removes them as part of the same statement. Doing it manually in the app
 * would be slower, racier, and would silently diverge the day someone inserts
 * an entry by another path.
 *
 * What the database can't clean up is Supabase Storage — those are objects in
 * a bucket, not rows, and no foreign key reaches them. So we read the entry
 * bodies first (while they still exist), delete the game, and only then remove
 * the blobs. That order matters: if the blob removal fails we're left with
 * orphaned files, which is wasted bytes. The reverse order would risk deleted
 * images under entries that still exist — broken content the user can see.
 * When you can't have a transaction, choose the failure mode you can live with.
 */
export async function deleteGame(gameId: string) {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("body")
    .eq("library_game_id", gameId)
    .eq("user_id", user.id)
    .returns<{ body: unknown }[]>();

  const mediaPaths = (entries ?? []).flatMap((entry) =>
    collectMediaPaths(entry.body),
  );

  const { error } = await supabase
    .from("library_games")
    .delete()
    .eq("id", gameId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  if (mediaPaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(JOURNAL_MEDIA_BUCKET)
      .remove(mediaPaths);

    // Best effort. The game is already gone as far as the user is concerned,
    // so a storage hiccup must not surface as a failed delete.
    if (storageError) {
      console.error("Orphaned journal media:", storageError.message);
    }
  }

  revalidatePath("/library");
  redirect("/library");
}

/**
 * Turn one game's journal into a single portable markdown file, for users
 * who want their entries in Notion/Obsidian/anywhere else that reads
 * markdown. Entries are ordered oldest-first (chronological), unlike the
 * game page's newest-first display order — an export reads like a
 * narrative, not a feed.
 */
export async function exportGameMarkdown(
  gameId: string,
): Promise<{ error: string } | { markdown: string; filename: string }> {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  const [
    { data: game, error: gameError },
    { data: entries, error: entriesError },
  ] = await Promise.all([
    supabase
      .from("library_games")
      .select("name, platforms, genres, release_date")
      .eq("id", gameId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("journal_entries")
      .select("title, body, date_played, rating")
      .eq("library_game_id", gameId)
      .eq("user_id", user.id)
      .order("date_played", { ascending: true, nullsFirst: true }),
  ]);

  if (gameError || entriesError || !game) {
    return { error: "Failed to load game for export" };
  }

  const markdown = gameToMarkdown(
    {
      name: game.name,
      platforms: game.platforms,
      genres: game.genres,
      releaseDate: game.release_date,
    },
    (entries ?? []).map((entry) => ({
      title: entry.title,
      body: entry.body as JSONContent,
      datePlayed: entry.date_played,
      rating: entry.rating,
    })),
  );

  return { markdown, filename: gameExportFilename(game.name) };
}
