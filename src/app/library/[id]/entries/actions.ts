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

// Guards against a rare write-path bug where a node's "attrs" object (e.g. an
// embedded image/video's src) silently disappears on save. Walks both trees
// in parallel and flags any place the saved doc is missing "attrs" that the
// original had.
function attrsPreserved(original: unknown, saved: unknown): boolean {
  if (Array.isArray(original)) {
    return (
      Array.isArray(saved) &&
      original.length === saved.length &&
      original.every((item, i) => attrsPreserved(item, saved[i]))
    );
  }
  if (original && typeof original === "object") {
    const o = original as Record<string, unknown>;
    if (!saved || typeof saved !== "object") return false;
    const s = saved as Record<string, unknown>;
    if ("attrs" in o && !("attrs" in s)) return false;
    return Object.keys(o).every((key) => attrsPreserved(o[key], s[key]));
  }
  return true;
}

export async function createEntry(gameId: string, input: EntryInput) {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();
  const row = {
    library_game_id: gameId,
    user_id: user.id,
    title: input.title,
    body: input.body,
    date_played: input.datePlayed,
    rating: input.rating,
  };

  const { data, error } = await supabase
    .from("journal_entries")
    .insert(row)
    .select("id, body")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create entry" };
  }

  if (!attrsPreserved(input.body, data.body)) {
    const retry = await supabase
      .from("journal_entries")
      .update({ body: input.body })
      .eq("id", data.id)
      .select("body")
      .single();

    if (retry.error || !attrsPreserved(input.body, retry.data?.body)) {
      return { error: "Failed to save embedded media — please try again." };
    }
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
  const { data, error } = await supabase
    .from("journal_entries")
    .update({
      title: input.title,
      body: input.body,
      date_played: input.datePlayed,
      rating: input.rating,
    })
    .eq("id", entryId)
    .select("body")
    .single();

  if (error) {
    return { error: error.message };
  }

  if (!attrsPreserved(input.body, data?.body)) {
    const retry = await supabase
      .from("journal_entries")
      .update({ body: input.body })
      .eq("id", entryId)
      .select("body")
      .single();

    if (retry.error || !attrsPreserved(input.body, retry.data?.body)) {
      return { error: "Failed to save embedded media — please try again." };
    }
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
