import Link from "next/link";
import { getUser } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

function Wordmark() {
  return (
    <Link href="/" className="flex flex-col leading-tight">
      <span className="font-semibold tracking-tight">Questlog</span>
      <span className="text-[9px] uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-600">
        Archive of played worlds
      </span>
    </Link>
  );
}

export async function Nav() {
  const user = await getUser();

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <Wordmark />
      <nav className="flex items-center gap-3 text-sm sm:gap-4">
        {user ? (
          <>
            <Link href="/library" className="text-zinc-600 dark:text-zinc-400">
              Library
            </Link>
            <span className="hidden max-w-40 truncate text-zinc-500 sm:inline">
              {user.email}
            </span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
            <ThemeToggle />
          </>
        ) : (
          <>
            <Link href="/auth/login" className="text-zinc-600 dark:text-zinc-400">
              Sign in
            </Link>
            <Link href="/auth/sign-up" className={buttonVariants({ size: "sm" })}>
              Sign up
            </Link>
            <ThemeToggle />
          </>
        )}
      </nav>
    </header>
  );
}

export function NavFallback() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <Wordmark />
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="h-8 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        <ThemeToggle />
      </div>
    </header>
  );
}
