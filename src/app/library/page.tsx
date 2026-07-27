import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { TomeShelf, type ShelfGame } from "@/components/tome-shelf";
import { PageTransition } from "@/components/page-transition";

type LibraryGameRow = {
  id: string;
  name: string;
  cover_url: string | null;
  spine_color: string | null;
  journal_entries: { count: number }[];
};

export default async function LibraryPage() {
  const user = await getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("library_games")
    .select("id, name, cover_url, spine_color, journal_entries(count)")
    .order("added_at", { ascending: false })
    .returns<LibraryGameRow[]>();

  if (error) {
    throw new Error(`Failed to load library: ${error.message}`);
  }

  const games: ShelfGame[] =
    rows?.map((row) => ({
      id: row.id,
      name: row.name,
      coverUrl: row.cover_url,
      spineColor: row.spine_color,
      entryCount: row.journal_entries?.[0]?.count ?? 0,
    })) ?? [];

  return (
    <PageTransition className="flex flex-1 flex-col gap-8 px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Your library</h1>
        <Link href="/library/add" className={buttonVariants({ size: "sm" })}>
          Add a game
        </Link>
      </div>

      <div className="mx-auto w-full max-w-5xl">
        {games.length === 0 ? (
          <p className="text-center text-zinc-500">
            No games yet.{" "}
            <Link href="/library/add" className="underline">
              Add your first one.
            </Link>
          </p>
        ) : (
          <TomeShelf games={games} />
        )}
      </div>
    </PageTransition>
  );
}
