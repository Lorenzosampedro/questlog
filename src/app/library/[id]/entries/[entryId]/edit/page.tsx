import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EntryEditor } from "../../entry-editor";

type JournalEntryRow = {
  id: string;
  title: string | null;
  body: JSONContent;
  date_played: string | null;
  rating: number | null;
};

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string; entryId: string }>;
}) {
  const { id, entryId } = await params;
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("journal_entries")
    .select("id, title, body, date_played, rating")
    .eq("id", entryId)
    .maybeSingle()
    .returns<JournalEntryRow>();

  if (!entry) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <Link
        href={`/library/${id}/entries/${entryId}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        ← Back to entry
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Edit entry</h1>
      <EntryEditor
        gameId={id}
        userId={user.id}
        entryId={entry.id}
        initialTitle={entry.title}
        initialBody={entry.body}
        initialDatePlayed={entry.date_played}
        initialRating={entry.rating}
      />
    </div>
  );
}
