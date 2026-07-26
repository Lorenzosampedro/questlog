import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export default async function LibraryPage() {
  const user = await getUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Your library</h1>
      <p className="text-zinc-500">Signed in as {user.email}. The shelf goes here.</p>
    </div>
  );
}
