"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAverageColor } from "@/lib/cover-color";
import {
  JOURNAL_MEDIA_BUCKET,
  collectMediaPaths,
} from "@/lib/journal-media";
import type { RawgGameSummary } from "@/lib/rawg";

const UNIQUE_VIOLATION = "23505";

export async function addGameToLibrary(game: RawgGameSummary) {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const spineColor = game.coverUrl ? await getAverageColor(game.coverUrl) : null;

  const supabase = await createClient();
  const { error } = await supabase.from("library_games").insert({
    user_id: user.id,
    rawg_id: game.rawgId,
    name: game.name,
    cover_url: game.coverUrl,
    platforms: game.platforms,
    genres: game.genres,
    release_date: game.releaseDate,
    spine_color: spineColor,
  });

  if (error && error.code !== UNIQUE_VIOLATION) {
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
