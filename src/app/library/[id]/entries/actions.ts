"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type EntryInput = {
  title: string | null;
  // A JSON-stringified Tiptap document, not the raw object — passing the
  // nested object directly as a Server Action argument intermittently drops
  // nested "attrs" (e.g. an embedded image/video's src) somewhere in RSC's
  // argument serialization. A plain string sidesteps that entirely.
  body: string;
  datePlayed: string | null;
  rating: number | null;
};

export async function createEntry(gameId: string, input: EntryInput) {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      library_game_id: gameId,
      user_id: user.id,
      title: input.title,
      body: JSON.parse(input.body),
      date_played: input.datePlayed,
      rating: input.rating,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create entry" };
  }

  revalidatePath(`/library/${gameId}`);
  redirect(`/library/${gameId}/entries/${data.id}`);
}

export async function updateEntry(
  entryId: string,
  gameId: string,
  input: EntryInput,
) {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("journal_entries")
    .update({
      title: input.title,
      body: JSON.parse(input.body),
      date_played: input.datePlayed,
      rating: input.rating,
    })
    .eq("id", entryId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/library/${gameId}`);
  revalidatePath(`/library/${gameId}/entries/${entryId}`);
  redirect(`/library/${gameId}/entries/${entryId}`);
}

export async function deleteEntry(entryId: string, gameId: string) {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", entryId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/library/${gameId}`);
  redirect(`/library/${gameId}`);
}

/**
 * Delete many entries in one round trip.
 *
 * Note there is no loop here: `.in("id", ids)` compiles to a single
 * `delete ... where id in (...)` statement, so the whole batch is one
 * implicit transaction — it either all lands or none of it does. Deleting in
 * a `for` loop would be N round trips *and* could leave you half-deleted if
 * the network dropped partway through.
 *
 * The `.eq("user_id", ...)` is belt-and-braces: RLS already makes it
 * impossible to delete another user's rows, but a client can send any ids it
 * likes, so we scope the statement explicitly too. If the RLS policy is ever
 * edited wrongly, this line is what still saves us.
 */
export async function deleteEntries(entryIds: string[], gameId: string) {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  if (entryIds.length === 0) return { success: true, deleted: 0 };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .delete()
    .in("id", entryIds)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/library/${gameId}`);
  revalidatePath("/library");
  return { success: true, deleted: data?.length ?? 0 };
}
