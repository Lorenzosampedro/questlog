"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type EntryInput = {
  title: string | null;
  body: JSONContent;
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
      body: input.body,
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
      body: input.body,
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
