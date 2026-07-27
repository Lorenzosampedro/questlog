import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

type LibraryGame = {
  id: string;
  name: string;
  cover_url: string | null;
  platforms: string[] | null;
  genres: string[] | null;
  release_date: string | null;
};

type JournalEntry = {
  id: string;
  title: string | null;
  date_played: string | null;
  rating: number | null;
  created_at: string;
};

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  const [{ data: game }, { data: entries }] = await Promise.all([
    supabase
      .from("library_games")
      .select("id, name, cover_url, platforms, genres, release_date")
      .eq("id", id)
      .maybeSingle()
      .returns<LibraryGame>(),
    supabase
      .from("journal_entries")
      .select("id, title, date_played, rating, created_at")
      .eq("library_game_id", id)
      .order("date_played", { ascending: false, nullsFirst: false })
      .returns<JournalEntry[]>(),
  ]);

  if (!game) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">
      <Link href="/library" className="text-sm text-zinc-500 hover:underline">
        ← Back to library
      </Link>

      <div className="flex gap-6">
        <div className="relative h-48 w-36 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
          {game.cover_url && (
            <Image
              src={game.cover_url}
              alt=""
              fill
              sizes="144px"
              className="object-cover"
            />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{game.name}</h1>
          <p className="text-sm text-zinc-500">
            {game.release_date?.slice(0, 4) ?? "Unknown year"}
          </p>
          {game.platforms && game.platforms.length > 0 && (
            <p className="text-sm text-zinc-500">{game.platforms.join(", ")}</p>
          )}
          {game.genres && game.genres.length > 0 && (
            <p className="text-sm text-zinc-500">{game.genres.join(", ")}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Journal entries</h2>
          <Link
            href={`/library/${game.id}/entries/new`}
            className={buttonVariants({ size: "sm" })}
          >
            New entry
          </Link>
        </div>

        {!entries || entries.length === 0 ? (
          <p className="text-zinc-500">
            No entries yet.{" "}
            <Link href={`/library/${game.id}/entries/new`} className="underline">
              Write your first one.
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/library/${game.id}/entries/${entry.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <span className="font-medium">
                    {entry.title || "Untitled entry"}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {(entry.date_played ?? entry.created_at).slice(0, 10)}
                    {entry.rating ? ` · ${entry.rating}★` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
