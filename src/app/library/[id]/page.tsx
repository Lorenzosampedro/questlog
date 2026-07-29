import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { PageTransition } from "@/components/page-transition";
import { EntryList } from "./entry-list";
import { DeleteGameButton } from "./delete-game-button";
import { ExportButton } from "./export-button";

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

  const [
    { data: game, error: gameError },
    { data: entries, error: entriesError },
  ] = await Promise.all([
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

  // PostgrestError carries `code`, `details` and `hint` alongside `message` —
  // and for RLS/permission problems the useful information is almost always in
  // `code`/`details`, not `message`. Surfacing only `.message` is why Supabase
  // failures so often read as "" or a bare "JSON object requested".
  if (gameError) {
    throw new Error(
      `Failed to load game [${gameError.code}]: ${gameError.message} — ${gameError.details ?? ""} ${gameError.hint ?? ""}`,
    );
  }
  if (entriesError) {
    throw new Error(
      `Failed to load journal entries [${entriesError.code}]: ${entriesError.message} — ${entriesError.details ?? ""} ${entriesError.hint ?? ""}`,
    );
  }
  if (!game) notFound();

  return (
    <PageTransition className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">
      <Link href="/library" className="text-sm text-zinc-500 hover:underline">
        ← Back to library
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="relative h-48 w-36 shrink-0 self-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900 sm:self-auto">
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
        <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
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

          <div className="mt-2 flex flex-wrap items-start gap-2">
            <ExportButton gameId={game.id} />
            <DeleteGameButton
              gameId={game.id}
              gameName={game.name}
              entryCount={entries?.length ?? 0}
            />
          </div>
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
          // The page stays a Server Component; only the interactive list is
          // client-side. We map snake_case DB rows to camelCase props here so
          // the client component never has to know about the database's
          // column naming.
          <EntryList
            gameId={game.id}
            entries={entries.map((entry) => ({
              id: entry.id,
              title: entry.title,
              datePlayed: entry.date_played,
              createdAt: entry.created_at,
              rating: entry.rating,
            }))}
          />
        )}
      </div>
    </PageTransition>
  );
}
