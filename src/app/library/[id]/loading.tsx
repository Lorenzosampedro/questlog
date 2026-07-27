import { PageTransition } from "@/components/page-transition";

export default function GameLoading() {
  return (
    <PageTransition className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">
      <div className="h-4 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />

      <div className="flex gap-6">
        <div className="h-48 w-36 shrink-0 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
        <div className="flex flex-col gap-2 pt-1">
          <div className="h-7 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
          <div className="h-4 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
          <div className="h-4 w-32 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="h-6 w-36 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        <div className="h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
        <div className="h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
      </div>
    </PageTransition>
  );
}
