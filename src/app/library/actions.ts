"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAverageColor } from "@/lib/cover-color";
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
