import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

type LibraryGame = {
  id: string;
  name: string;
  cover_url: string | null;
  platforms: string[] | null;
  release_date: string | null;
};

export default async function LibraryPage() {
  const user = await getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const { data: games } = await supabase
    .from("library_games")
    .select("id, name, cover_url, platforms, release_date")
    .order("added_at", { ascending: false })
    .returns<LibraryGame[]>();

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-16">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Your library</h1>
        <Link href="/library/add" className={buttonVariants({ size: "sm" })}>
          Add a game
        </Link>
      </div>

      <div className="mx-auto w-full max-w-4xl">
        {!games || games.length === 0 ? (
          <p className="text-center text-zinc-500">
            No games yet.{" "}
            <Link href="/library/add" className="underline">
              Add your first one.
            </Link>
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {games.map((game) => (
              <li key={game.id} className="flex flex-col gap-2">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
                  {game.cover_url && (
                    <Image
                      src={game.cover_url}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <p className="text-sm font-medium">{game.name}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
