import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { PageTransition } from "@/components/page-transition";
import { EntryEditor } from "../entry-editor";

export default async function NewEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/auth/login");

  return (
    <PageTransition className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <Link href={`/library/${id}`} className="text-sm text-zinc-500 hover:underline">
        ← Back to game
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New entry</h1>
      <EntryEditor gameId={id} userId={user.id} />
    </PageTransition>
  );
}
