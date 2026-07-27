import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { EntryView } from "../entry-view";

type JournalEntryRow = {
  id: string;
  title: string | null;
  body: JSONContent;
  date_played: string | null;
  rating: number | null;
  created_at: string;
};

export default async function EntryPage({
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
    .select("id, title, body, date_played, rating, created_at")
    .eq("id", entryId)
    .maybeSingle()
    .returns<JournalEntryRow>();

  if (!entry) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <Link href={`/library/${id}`} className="text-sm text-zinc-500 hover:underline">
        ← Back to game
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {entry.title || "Untitled entry"}
          </h1>
          <p className="text-sm text-zinc-500">
            {(entry.date_played ?? entry.created_at).slice(0, 10)}
            {entry.rating ? ` · ${entry.rating}★` : ""}
          </p>
        </div>
        <Link
          href={`/library/${id}/entries/${entryId}/edit`}
          className={buttonVariants({ size: "sm", variant: "outline" })}
        >
          Edit
        </Link>
      </div>

      <EntryView body={entry.body} />
    </div>
  );
}
