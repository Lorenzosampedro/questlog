import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { PageTransition } from "@/components/page-transition";
import { GameSearch } from "./game-search";

export default async function AddGamePage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  return (
    <PageTransition className="flex flex-1 flex-col items-center gap-8 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Add a game</h1>
      <GameSearch />
    </PageTransition>
  );
}
