import Link from "next/link";
import { getUser } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";
import { Button, buttonVariants } from "@/components/ui/button";

export async function Nav() {
  const user = await getUser();

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <Link href="/" className="font-semibold tracking-tight">
        Questlog
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <Link href="/library" className="text-zinc-600 dark:text-zinc-400">
              Library
            </Link>
            <span className="text-zinc-500">{user.email}</span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </>
        ) : (
          <>
            <Link href="/auth/login" className="text-zinc-600 dark:text-zinc-400">
              Sign in
            </Link>
            <Link href="/auth/sign-up" className={buttonVariants({ size: "sm" })}>
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

export function NavFallback() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <Link href="/" className="font-semibold tracking-tight">
        Questlog
      </Link>
      <div className="h-8 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
    </header>
  );
}
